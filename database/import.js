const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');

const execPromise = util.promisify(exec);

// Hardcoded for test user
const TEST_USER_ID = "user_test_123456";

const SAMPLE_DIR = path.join(__dirname, 'sample data');
const OUTPUT_SQL = path.join(__dirname, 'import.sql');

async function askGemini(prompt) {
    try {
        const cmd = `echo "" | gemini -p "${prompt.replace(/"/g, '\\"')}" -y --raw-output`;
        const { stdout } = await execPromise(cmd, { maxBuffer: 1024 * 1024 * 50 });
        // The CLI might output its thinking/actions. We only want the JSON.
        const jsonMatch = stdout.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }
        // Fallback: try parsing the whole output
        return JSON.parse(stdout);
    } catch (e) {
        console.error("Gemini failed for prompt:", prompt.substring(0, 100), "... Error:", e.message);
        return null;
    }
}

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

async function generateImage(title, category) {
    console.log(`Generating image for ${title}...`);

    const isDrink = category && (category.includes('饮品') || category.includes('饮料') || category.includes('咖啡') || category.includes('茶'));

    let basePrompt = "";
    if (isDrink) {
        basePrompt = promptDrink.replace('${title}', title);
    } else {
        const randomIndex = Math.floor(Math.random() * promptsFood.length);
        basePrompt = promptsFood[randomIndex].replace('${title}', title);
    }

    const finalPrompt = basePrompt + "请只返回生成的图片本地保存路径或者直接生成。";

    try {
        const cmd = `gemini -p "${finalPrompt.replace(/"/g, '\\"')}" -y --raw-output`;
        const { stdout } = await execPromise(cmd);
        console.log("Image generation stdout:", stdout);
        const match = stdout.match(/\/tmp\/.*\.png|\/tmp\/.*\.jpg/i);
        if (match) {
            return match[0];
        }
    } catch (e) {
        console.error("Image generation failed:", e.message);
    }
    return null;
}

// Ensure unique random dates between Oct 2025 and Feb 2026.
function getRandomDate() {
    const start = new Date(2025, 9, 1).getTime(); // Oct 1, 2025
    const end = new Date(2026, 1, 28).getTime(); // Feb 28, 2026
    const date = new Date(start + Math.random() * (end - start));
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

function generateSql(recipeData, coverImageKey) {
    if (!recipeData) return '';
    let sql = '';
    const date = getRandomDate();

    // Fallbacks
    const rId = uuidv4();
    const title = recipeData.title && recipeData.title.trim() ? recipeData.title.replace(/'/g, "''") : "未命名食谱";
    const desc = recipeData.description ? recipeData.description.replace(/'/g, "''") : "";
    const category = recipeData.category ? recipeData.category.replace(/'/g, "''") : "其他";
    const diff = ['easy', 'medium', 'hard'].includes(recipeData.difficulty) ? recipeData.difficulty : 'easy';
    const prep = recipeData.prep_time || 15;
    const cook = recipeData.cook_time || 30;
    const tools = recipeData.tools ? recipeData.tools.replace(/'/g, "''") : "";
    const tags = recipeData.tags && Array.isArray(recipeData.tags) ? JSON.stringify(recipeData.tags).replace(/'/g, "''") : "[]";
    const cover = coverImageKey ? `'${coverImageKey}'` : "NULL";

    sql += `INSERT INTO recipes (id, owner_user_id, title, description, cover_image, category, difficulty, prep_time, cook_time, tags, tools, created_at, last_modified_at) VALUES ('${rId}', '${TEST_USER_ID}', '${title}', '${desc}', ${cover}, '${category}', '${diff}', ${prep}, ${cook}, '${tags}', '${tools}', '${date}', '${date}');\n`;

    if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
        let sortOrder = 0;
        for (const ing of recipeData.ingredients) {
            const iId = uuidv4();
            const name = ing.name ? ing.name.replace(/'/g, "''") : "未知配料";
            const amt = ing.amount || 0;
            const unit = ing.unit ? ing.unit.replace(/'/g, "''") : "";
            sql += `INSERT INTO ingredients (id, recipe_id, name, amount, unit, sort_order) VALUES ('${iId}', '${rId}', '${name}', ${amt}, '${unit}', ${sortOrder++});\n`;
        }
    }

    if (recipeData.steps && Array.isArray(recipeData.steps)) {
        let sortOrder = 0;
        for (const step of recipeData.steps) {
            const sId = uuidv4();
            const desc = step.description ? step.description.replace(/'/g, "''") : "";
            const sType = ['prep', 'active_cook'].includes(step.step_type) ? step.step_type : 'active_cook';
            const sTime = step.time_minutes || 5;
            sql += `INSERT INTO steps (id, recipe_id, description, step_type, time_minutes, sort_order) VALUES ('${sId}', '${rId}', '${desc}', '${sType}', ${sTime}, ${sortOrder++});\n`;
        }
    }
    return sql;
}

const promptBase = `Extract recipe data and return STRICTLY valid JSON with this schema:
{
  "title": "String",
  "description": "String",
  "category": "String (e.g. 早餐, 晚餐, 甜点)",
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
If multiple recipes exist, return an array of such objects. Otherwise return a single object or an array of one. Language MUST be Chinese.`;

async function main() {
    let finalSql = `-- Test User
INSERT OR IGNORE INTO users (id, display_name, locale) VALUES ('${TEST_USER_ID}', 'Test User', 'zh-CN');\n\n`;
    let allRecipes = [];
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

    // Process files with concurrency limit of 5
    const CONCURRENCY = 5;
    let activePromises = [];

    for (const file of files) {
        if (file.endsWith('.url') || file.endsWith('.ico') || file.endsWith('.psd') || file.endsWith('index.html')) continue;

        const p = (async () => {
            console.log("Processing:", file);
            let recipes = [];

            if (file.endsWith('.docx')) {
                const { value } = await mammoth.extractRawText({ path: file });
                const prompt = `Read the following text. ${promptBase}\n\nTEXT:\n\n${value.substring(0, 30000)}`;
                const result = await askGemini(prompt);
                if (result) {
                    recipes = Array.isArray(result) ? result : (result.recipes ? result.recipes : [result]);
                }
            } else if (file.match(/\.(png|jpe?g)$/i)) {
                const prompt = `Read the image at ${file}. ${promptBase}`;
                const result = await askGemini(prompt);
                if (result) {
                    recipes = Array.isArray(result) ? result : (result.recipes ? result.recipes : [result]);
                }
            }

            for (const recipe of recipes) {
                if (!recipe.title || !recipe.ingredients) continue;
                allRecipes.push(recipe);
            }
        })();

        activePromises.push(p);

        if (activePromises.length >= CONCURRENCY) {
            await Promise.all(activePromises);
            activePromises = [];
        }
    }

    // flush the rest
    if (activePromises.length > 0) {
        await Promise.all(activePromises);
    }

    fs.writeFileSync(path.join(__dirname, 'recipes.json'), JSON.stringify(allRecipes, null, 2));
    console.log(`Extracted ${allRecipes.length} recipes to recipes.json`);
}

main().catch(console.error);
