# 测试账号连接指南 (Test Account Guide)

为了方便您测试导入的食谱数据，我们创建了一个专用的测试账号。所有的 17 个带图片的食谱都已导入到该账号下。

## 1. 账号信息
- **测试用户 ID (Clerk ID)**: `user_test_123456`
- **显示名称**: `Test User`
- **语言设置**: `zh-CN` (中文)

## 2. 如何在 App 中连接/模拟该账号
由于 App 使用 Clerk 进行身份验证，如果您想在本地开发环境看到这些数据，可以通过以下方式模拟该用户：

### 方案 A：修改中间件/Auth 包装器 (推荐用于快速测试)
在 `src/middleware.ts` 或处理 Clerk 认证的地方（如 `src/app/api/...`），硬编码返回该测试 ID：

```typescript
// 临时修改示例
const userId = "user_test_123456"; 
```

### 方案 B：直接查询数据库
您可以使用以下命令验证数据在云端 D1 数据库中是否存在：

```bash
# 查看所有导入的食谱标题和分类
npx wrangler d1 execute m8xtable-db --remote --command "SELECT * FROM recipes r JOIN recipe_translations rt ON r.id = rt.recipe_id WHERE r.owner_user_id = 'user_test_123456';"
```

```bash
npx wrangler d1 execute m8xtable-db --remote --command "SELECT description FROM steps;" 
//recipe_id
```

## 3. 增量导入说明
如果您在 5 小时后（模型额度重置后）想要继续导入剩余的食谱，只需运行：

1. 修改 `batch_import.js` 中的 `titleToImageMap`，添加新的食谱标题。
2. 运行 `node batch_import.js`。

该脚本会自动检测 `import_log.json`，**只会处理未导入过的食谱**，不会造成数据重复。

## 4. 媒体文件
食谱封面图已上传至 R2 存储桶 `m8x-table-media` 目录下的 `recipes/` 文件夹中。
