const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const { v4: uuidv4 } = require('uuid');

const execPromise = util.promisify(exec);

const TEST_USER_ID = "user_test_123456";
const RECIPES_JSON = path.join(__dirname, 'recipes.json');
const IMAGES_DIR = "/Users/hj2/.gemini/antigravity/brain/a1fb0f43-021f-4611-b76d-baab04fe5b04";
const IMPORT_LOG = path.join(__dirname, 'import_log.json');
const LOCALE = "zh-CN";

const titleToImageMap = {
    "仙草芋圆": "xiancao_yuyuan",
    "回锅肉": "huiguo_rou",
    "白切鸡": "baiqie_ji",
    "生煎包": "shengjian_bao",
    "金包银 (翡翠白菜卷)": "jinbaoyin",
    "蒜苔炒腊肉": "suantai_larou",
    "干锅花菜": "ganguo_huacai",
    "皮蛋瘦肉粥": "pidan_shourou_zhou",
    "绿豆汤": "lvdou_tang",
    "日式炸猪排": "rishi_zhazp",
    "黑椒鸡片": "heijiao_jipian",
    "酸辣土豆丝": "suanla_tudousi",
    "老醋花生": "laocu_huasheng",
    "辣椒炒肉": "lajiao_chaorou",
    "意式萨拉米洋葱披萨": "yishi_salami",
    "螃蟹粉丝煲": "pangxie_fensi",
    "白菜炒粉丝": "baicai_chao"
};

async function getActualImagePath(keyword) {
    try {
        const { stdout } = await execPromise(`ls ${IMAGES_DIR}/${keyword}*.png`);
        const lines = stdout.trim().split('\n');
        return lines[0];
    } catch (e) {
        return null;
    }
}

function getRandomDate() {
    const start = new Date(2025, 9, 1).getTime();
    const end = new Date(2026, 1, 28).getTime();
    const date = new Date(start + Math.random() * (end - start));
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

async function uploadToR2(localPath) {
    const filename = path.basename(localPath);
    const key = `recipes/${uuidv4()}-${filename}`;
    console.log(`Uploading ${filename} to R2...`);
    try {
        await execPromise(`npx wrangler r2 object put m8x-table-media/${key} --file="${localPath}" --content-type="image/png" --remote`);
        return key;
    } catch (e) {
        console.error(`Upload failed for ${filename}:`, e.message);
        return null;
    }
}

async function main() {
    const recipes = JSON.parse(fs.readFileSync(RECIPES_JSON, 'utf8'));
    let importLog = { imported: [] };
    if (fs.existsSync(IMPORT_LOG)) {
        importLog = JSON.parse(fs.readFileSync(IMPORT_LOG, 'utf8'));
    }

    const importedTitles = new Set(importLog.imported);
    const sqlFile = path.join(__dirname, 'batch_import.sql');
    let sql = `INSERT OR IGNORE INTO users (id, display_name, locale) VALUES ('${TEST_USER_ID}', 'Test User', '${LOCALE}');\n\n`;

    let count = 0;
    for (const recipe of recipes) {
        if (importedTitles.has(recipe.title)) continue;

        const keyword = titleToImageMap[recipe.title];
        if (!keyword) continue;

        const localPath = await getActualImagePath(keyword);
        if (!localPath) continue;

        const r2Key = await uploadToR2(localPath);
        if (!r2Key) continue;

        const rId = uuidv4();
        const date = getRandomDate();
        const title = recipe.title.replace(/'/g, "''");
        const desc = (recipe.description || "").replace(/'/g, "''");
        const cat = (recipe.category || "其他").replace(/'/g, "''");
        const diff = ['easy', 'medium', 'hard'].includes(recipe.difficulty) ? recipe.difficulty : 'easy';
        const prep = recipe.prep_time || 15;
        const cook = recipe.cook_time || 30;
        const tools = (recipe.tools || "").replace(/'/g, "''");
        const tags = JSON.stringify(recipe.tags || []).replace(/'/g, "''");

        // Insert into recipes
        sql += `INSERT INTO recipes (id, owner_user_id, title, description, cover_image, tools, category, difficulty, prep_time, cook_time, tags, created_at, last_modified_at) VALUES ('${rId}', '${TEST_USER_ID}', '${title}', '${desc}', '${r2Key}', '${tools}', '${cat}', '${diff}', ${prep}, ${cook}, '${tags}', '${date}', '${date}');\n`;

        if (recipe.ingredients) {
            recipe.ingredients.forEach((ing, i) => {
                const iId = uuidv4();
                const iName = (ing.name || "").replace(/'/g, "''");
                const iUnit = (ing.unit || "").replace(/'/g, "''");
                sql += `INSERT INTO ingredients (id, recipe_id, name, amount, unit, sort_order) VALUES ('${iId}', '${rId}', '${iName}', ${ing.amount || 0}, '${iUnit}', ${i});\n`;
            });
        }
        if (recipe.steps) {
            recipe.steps.forEach((step, i) => {
                const sId = uuidv4();
                const sType = ['prep', 'active_cook'].includes(step.step_type) ? step.step_type : 'active_cook';
                const sDesc = (step.description || "").replace(/'/g, "''");
                sql += `INSERT INTO steps (id, recipe_id, description, step_type, time_minutes, sort_order) VALUES ('${sId}', '${rId}', '${sDesc}', '${sType}', ${step.time_minutes || 5}, ${i});\n`;
            });
        }

        importLog.imported.push(recipe.title);
        count++;
    }

    fs.writeFileSync(sqlFile, sql);
    fs.writeFileSync(IMPORT_LOG, JSON.stringify(importLog, null, 2));

    if (count > 0) {
        console.log(`Generated SQL for ${count} recipes.`);
        try {
            const { stdout } = await execPromise(`npx wrangler d1 execute m8xtable-db --remote --file="${sqlFile}"`);
            console.log(stdout);
            console.log("Import success.");
        } catch (e) {
            console.error("D1 execution failed:", e.message);
        }
    } else {
        console.log("No new recipes with images found.");
    }
}

main().catch(console.error);
