Now, finish my app, no stop until you finished all the features in Plan.md

I have the full plan for my app in Plan.md. 
I have a style sample images:
    list.png will be the home page
    calendar.png will be the calendar page
    recipe.png will be the recipe detail page
I have prompt examples folder, each will present a style of the cover photo.
# search

### 3.6 Recycle bin

- Soft-deleted recipes; hidden from main UI.
- Show countdown ("X days remaining") per recipe.
- User can restore within 30 days.
- User can select and permanently delete early ("empty bin").
- Auto-purge after 30 days (cleanup script added later).


### 3.7 Custom recipe pages

- Per-recipe generated HTML pages.
- One "pinned" page shown first; user can swipe to see others; can delete any.
- Stored in D1 (HTML text) with association to recipe and pinned flag.


### 3.10 Books (Premium tier only)

- Bookshelf component: shows covers, titles, downloaded status (boolean).
- Red badge on bookshelf button for new undownloaded books.
- Book file naming: `{title}_{collection-name}_{date}_{time}`.
- User can delete a book.
- Book tab hidden for non-Premium users.




- **Onboarding**: Guided tour for first-time users (empty state + walkthrough).


- **Paywall sites**: Try JSON-LD first. If parsing fails, show clear error and offer paste-as-text fallback. No attempt to bypass paywalls.


| **From share-to-app** | User shares content to Canvas & Clove via OS share sheet; if it is a recipe (URL or text), create new recipe |


### 6.7 Custom recipe page (HTML generation)

- **Purpose**: User views recipe in a custom HTML layout in-app (swipe between versions) and uses it for sharing.
- **Reference**: Approach inspired by [ui-ux-pro-max-skill](https://github.com/chen5656/ui-ux-pro-max-skill).
- **Live data**: HTML uses placeholders filled with current recipe data — ingredient/step changes flow through without regenerating.
- **Constraints (epub-ready)**: No flex, no grid, no JS, no `position: fixed`, no complex animation. Prompt includes these constraints.
- **Style presets**: Glassmorphism, Claymorphism, Minimalism, Brutalism, Neumorphism, Bento Grid, Dark Mode, Frosted Glass, Neon, etc. User can choose or skip.
- **Custom prompt**: User adds instructions (e.g. "make title orange and bigger"); system merges with previous context and sends to Gemini.
- **Thinking indicator**: Show processing state during generation.
- **Scoping**:
  - Global default template for recipes without a custom page.
  - Per-recipe: multiple generated pages, one pinned (shown first); swipe to others; delete any.
- **Bulk generation**: Apply same prompt to all or selected recipes in a collection. Token deducted per recipe; stops if tokens run out.
- **Token**: Each generation consumes tokens toward user limit.

### 6.8 Sharing

- **Share link**: Public (anyone with link can view). Shows user name, badge, and small watermark. If recipe has a custom page, show that; otherwise default template. User sets link expiration.
- **Share as long image**: Render HTML to a tall mobile-friendly image; includes QR code at bottom, user name, profile picture, and watermark. User saves the image locally and shares it themselves.
- **Share via OS share sheet**: Use the native system share sheet (the iOS/Android built-in sharing UI that shows iMessage, WhatsApp, Telegram, WeChat, etc. based on installed apps).
- **Share collections**: See section 3.4 visibility (private / specific people / public).
- **Fork sync**: When a public/shared collection's source recipe is updated, users who forked it can initiate a sync (with conflict resolution UI).


### 6.9 Book generation

- **Input**: User selects one or more collections; each collection becomes a chapter.
- **Chapter**: Collection name as chapter title; user can add a description per chapter.
- **Book title**: User-defined.
- **Cover**: User uploads OR uses AI to generate. We provide example covers; user can ask AI to generate something similar, or use a fully custom prompt.
- **Structure**: Optional articles before/after recipe chapters; optional custom introduction per recipe.
- **Fork info**: Default shows fork attribution; user can toggle it off per book.
- **Export**: EPUB with same layout constraints as recipe pages. Fonts embedded in EPUB.
- **TOC**: Auto-generated from collection names (chapters) and recipe titles.
- **Queue**: Export runs in a Worker queue; user notified via push notification + in-app red badge.
- **Bookshelf**: See section 3.10 for UI details.
- **Tier**: Only Premium ($39.99/mo) tier can create ebooks.
- **Downgrade**: See section 4 downgrade handling.


## 7. Recipe page generation (detail)

- **Flow**: User selects style + optional custom prompt. Backend sends recipe data + constraints + prompt to Gemini. Returns epub-safe HTML.
- **Live data**: HTML references recipe data via placeholders; edits to recipe reflect without regenerating.
- **Storage**: HTML stored in D1; recipe-to-page association and pinned flag in DB.
- **Display**: In-app WebView; pinned page shown first; swipe to browse others.



## 8. Book generation (detail)

- **Title**: User-defined.
- **Cover**: Upload or AI-generated (with example templates).
- **Chapters**: One per collection; user-defined chapter description.
- **Sections**: Optional intro/outro articles; optional per-recipe introduction.
- **Fork info**: Default shows fork attribution (source URL or user); user can toggle off.
- **Output**: Single EPUB file with epub-safe HTML per recipe, embedded fonts, auto-generated TOC.
- **Delivery**: After queue processing, download available in bookshelf. Red badge for new books. Push notification when export completes.
- **Naming**: `{title}_{collection-name}_{date}_{time}`.
- **Management**: User can delete books.

## 10. Fork system (like GitHub)

- **Fork from URL**: External recipe (e.g. NYT Cooking); records `forked_from_url`.
- **Fork from shared recipe**: Another user's public/shared recipe; records `forked_from_recipe_id`.
- **Source tracking**: Always record when and where the recipe was forked.
- **Sync from source**: When the source recipe is updated, the forked user can initiate a sync. On conflict (both sides changed), user resolves via conflict resolution UI.
- **Star & fork counts**: Each recipe shows how many stars and forks it has (like GitHub repos).
- **Paywall sites**: Device fetches page content; send to Gemini Worker for parsing. Try JSON-LD first; fail with clear error and paste-as-text fallback. No attempt to bypass paywalls.


## 13. Future considerations

Items explicitly deferred for future development:

- Semantic / natural language search (architecture documented in Search-Discussion.md).
- Screen reader accessibility (VoiceOver / TalkBack).
- Wine pairing hyperlinks with affiliate commission.
- Admin panel for ingredient vocabulary management.
- Recycle bin auto-purge cleanup script.
- Book file archive cleanup script on downgrade.


## 角色（Role）

- 你是一个毛玻璃特效知识卡片生成专家

## 技术规范
- 使用 HTML5、TailwindCSS 3.0+（通过 CDN 引入）和必要的 JavaScript
- Font Awesome 6.0+（通过 CDN 引入）用于图标库增加视觉冲击
- 代码结构清晰，包含适当注释，便于理解和维护
- 避免 js 报错，确保页面加载完成后才进行后续操作

## 设计风格 （Design Style）
- 采用前沿的毛玻璃效果，结合动态背景模糊技术，打造现代感十足的界面视觉效果。
- 背景图片使用固定地址 https://picsum.photos/1920/1080
- 整体背景模糊（毛玻璃效果），强度 12px
- 精心调校的模糊参数与色彩搭配，确保内容可读性的同时保持背景的深度感知。
- 毛玻璃（磨砂玻璃）效果的卡片设计要求：
  1. 半透明白色背景（透明度 8%）
  2. 背景模糊（毛玻璃效果），强度 12px
  3. 使用柔和的阴影，提升层次感
  4. 设置最小宽度，防止内容过窄（响应式适配）

## 交互体验（Interaction Experience）
- 鼠标悬浮：当前选中的卡片高亮。流畅的交互动画效果

## 响应布局 （Responsive Layout）
- 智能响应式设计适配各种屏幕尺寸，卡片为纵向排列。弹性布局系统保证不同内容长度下的视觉一致性。

## 输出要求
- 提供完整可运行的单一 HTML 文件，包含所有必要的 CSS 和 JavaScript
- 确保代码符合 W3C 标准，无错误警告。
- 页面在不同浏览器中保持一致的外观和功能

## 用户输入（User Input）
- 用户可以输入卡片内容，包括标题、内容

(Shared from: https://promptup.net/prompt/chinese-%E6%AF%9B%E7%8E%BB%E7%92%83%E7%89%B9%E6%95%88%E7%9F%A5%E8%AF%86%E5%8D%A1%E7%89%87%E7%94%9F%E6%88%90%E4%B8%93%E5%AE%B6-1a)
