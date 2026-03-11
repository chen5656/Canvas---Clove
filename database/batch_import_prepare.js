const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const mammoth = require('mammoth');

const execPromise = util.promisify(exec);

const SAMPLE_DIR = path.join(__dirname, 'sample data');
const LOG_FILE = path.join(__dirname, 'import_log.json');
const OUTPUT_FILE = path.join(__dirname, 'batch_import.json');

const promptsFood = [
    // 1. 原先的prompt
    "调用nano banana重新生成 ${title} 的食谱图片。风格要求：极简构图（留白多，主体突出，每张食物都摆得很“干净”）；暗调高级感（深色背景、低饱和度，营造出比较精致的餐饮广告气质）；自然光静物摄影感（食物质感很强，偏真实、克制，不是夸张鲜艳的电商风）；品牌视觉/菜单视觉风格（很像咖啡馆、轻食店、餐厅品牌官网常见的视觉方向）。",
    // 2. 参考 photo.md (动感商业风格)
    "调用nano banana重新生成 ${title} 的食谱图片。风格要求：商业广告大片感。捕捉动感瞬间，例如食材轻微悬浮或酱汁动态飞溅；深色背景，对比强烈，景深效果明显；灯光极度讲究，高光锐利如精美工作室拍摄，边缘清晰，视觉冲击力极强。",
    // 3. 参考 photo2.md (旅游/生活方式融合)
    "调用nano banana重新生成 ${title} 的食谱图片。风格要求：生活方式融合的清新旅游风。背景可以展现温暖的异国阳光、自然绿植阴影或明亮的街道模糊背景；色调明快饱满但不失真实，主打治愈系与真实的户外氛围感，不夸张。",
    // 4. 参考 photo3.md (杂志解构/信息图)
    "调用nano banana重新生成 ${title} 的食谱图片。风格要求：顶尖美食杂志内页/艺术解构风。构图讲究层次美学，食材间可以有自然的摆放距离甚至轻微的空间分离层次；电影级打光，质感极其细腻超清，画面开胃惹眼且非常专业。",
    // 5. 参考 phtoto4.md (商品展示/高级便当盒)
    "调用nano banana重新生成 ${title} 的食谱图片。风格要求：具有可售卖感的高级实体商品陈列/精美餐盒展示风格。稍微偏斜的俯拍平铺视角，食物像是在精致餐器或外带盒中进行着完美的组合陈列；极其强调真实食材的油润光泽和立体拼搭。"
];

const promptDrink = "调用nano banana重新生成 ${title} 的饮品图片。风格要求：明亮温暖的环境背景。构图通透清爽，像是沐浴在阳光下的桌面或窗边；光线能微微打透杯壁或液体，展现出冰块冰冷剔透的质感或者热气上升的氤氲感；整体色调明朗、治愈，极具诱人解渴或放松的高级质感。";

// Ensure unique random dates between Oct 2025 and Feb 2026.
function getRandomDate() {
    const start = new Date(2025, 9, 1).getTime(); // Oct 1, 2025
    const end = new Date(2026, 1, 28).getTime(); // Feb 28, 2026
    const date = new Date(start + Math.random() * (end - start));
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

function getImagePrompt(title, category) {
    const isDrink = category && (category.includes('饮品') || category.includes('饮料') || category.includes('咖啡') || category.includes('茶'));
    let basePrompt = "";
    if (isDrink) {
        basePrompt = promptDrink.replace('${title}', title);
    } else {
        const randomIndex = Math.floor(Math.random() * promptsFood.length);
        basePrompt = promptsFood[randomIndex].replace('${title}', title);
    }
    return basePrompt;
}

async function askGemini(prompt) {
    try {
        const cmd = `gemini -p "${prompt.replace(/"/g, '\\"')}" -y --raw-output`;
        const { stdout, stderr } = await execPromise(cmd, { maxBuffer: 1024 * 1024 * 50 });
        const jsonMatch = stdout.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }
        return JSON.parse(stdout);
    } catch (e) {
        console.error("Gemini failed for prompt length:", prompt.length, "... Error:", e.message);
        return null;
    }
}

const promptBase = `Extract recipe data and return STRICTLY valid JSON with this exact schema:
{
  "recipes": [
    {
      "title": "String",
      "description": "String",
      "category": "String (e.g. 早餐, 晚餐, 甜点, 饮品)",
      "difficulty": "easy | medium | hard",
      "prep_time": 15,
      "cook_time": 30,
      "ingredients": [
        { "name": "猪肉", "amount": 500, "unit": "克" }
      ],
      "steps": [
        { "description": "切肉", "step_type": "prep | active_cook", "time_minutes": 5 }
      ],
      "tags": ["中餐", "猪肉"],
      "tools": "炒锅"
    }
  ]
}
If the input contains multiple recipes, include all of them in the recipes array. If it's a single recipe, the array should have one element. Language MUST be Chinese. Do not include random content, just extract. For images without text, use the image contents to imagine a recipe.`;

async function main() {
    let importedTitles = new Set();
    if (fs.existsSync(LOG_FILE)) {
        try {
            const logData = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
            if (logData.imported && Array.isArray(logData.imported)) {
                logData.imported.forEach(t => importedTitles.add(t));
                console.log(`Loaded ${importedTitles.size} imported titles to skip.`);
            }
        } catch(e) {
            console.error("Could not parse import_log.json:", e);
        }
    }

    const files = [];
    function walkDir(dir) {
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                walkDir(fullPath);
            } else {
                files.push(fullPath);
            }
        });
    }
    walkDir(SAMPLE_DIR);

    let allRecipesMap = new Map(); // deduplicate by title

    const CONCURRENCY = 3;
    let activePromises = [];

    for (const file of files) {
        if (file.endsWith('.url') || file.endsWith('.ico') || file.endsWith('.psd')) continue;

        const p = (async () => {
            console.log("Processing file:", file);
            let result = null;

            if (file.endsWith('.docx')) {
                const { value } = await mammoth.extractRawText({ path: file });
                const prompt = `Read the following text. ${promptBase}\n\nTEXT:\n\n${value.substring(0, 30000)}`;
                result = await askGemini(prompt);
            } 
            else if (file.endsWith('.html') || file.endsWith('.htm')) {
                const content = fs.readFileSync(file, 'utf8');
                const prompt = `Read the following HTML code representing recipes. ${promptBase}\n\nHTML content:\n\n${content.substring(0, 30000)}`;
                result = await askGemini(prompt);
            }
            else if (file.match(/\.(png|jpe?g)$/i)) {
                const prompt = `Read the image at ${file}. ${promptBase}`;
                result = await askGemini(prompt);
            }

            if (result) {
                const recipesInfo = Array.isArray(result) ? result : (result.recipes ? result.recipes : [result]);
                for (const r of recipesInfo) {
                    if (!r.title) continue;
                    
                    const trimmedTitle = r.title.trim();
                    if (importedTitles.has(trimmedTitle)) {
                        console.log(`Skipping already imported recipe: ${trimmedTitle}`);
                        continue;
                    }
                    
                    if (allRecipesMap.has(trimmedTitle)) {
                        // Merge or skip? Let's assume if ingredients are present, it's better.
                        const existing = allRecipesMap.get(trimmedTitle);
                        if (!existing.ingredients || existing.ingredients.length === 0) {
                            allRecipesMap.set(trimmedTitle, r);
                        }
                    } else {
                        allRecipesMap.set(trimmedTitle, r);
                        console.log(`Parsed new recipe: ${trimmedTitle}`);
                    }
                }
            } else {
                console.log("No valid JSON returned from Gemini for file:", file);
            }
        })();

        activePromises.push(p);
        if (activePromises.length >= CONCURRENCY) {
            await Promise.all(activePromises);
            activePromises = [];
        }
    }

    if (activePromises.length > 0) {
        await Promise.all(activePromises);
    }

    // Now format the recipes nicely into JSON array matching requirements
    const finalRecipesArray = [];
    for (const [title, r] of allRecipesMap.entries()) {
        r.image_prompt = getImagePrompt(r.title, r.category);
        r.created_at = getRandomDate();
        finalRecipesArray.push(r);
    }

    // Write output to batch_import.json
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalRecipesArray, null, 2));
    console.log(`Extracted ${finalRecipesArray.length} recipes and written to batch_import.json`);
}

main().catch(console.error);
