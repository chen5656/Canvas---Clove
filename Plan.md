# Canvas & Clove — Product Plan

A cross-platform cooking recipe collection app (iPhone, iPad). **Online only** — no offline mode, no sync layer. 

---

## 1. Overview & scope

| Aspect | Decision |
|--------|----------|
| **Platforms** | iPhone, iPad (Expo) 
| **Network** | Online only; no offline storage or sync |
| **Core value** | Collect, organize |

---

## 2. Tech stack

| Layer | Choice | Notes |
|-------|--------|------|
| **App** | Expo (React Native) | Single codebase for iOS + Web |
| **Auth** | ios only, use iphone sign in with apple |
| **Database** | Cloudflare D1 (single shared DB) | SQLite-compatible; one database for one user |
| **File storage** | Cloudflare R2 | Images, video |
| **AI (text/recipe)** | Gemini via Cloudflare Worker + AI Gateway | Token usage returned per request for billing |
| **AI (voice)** | OpenAI gpt-audio-mini via Cloudflare Worker | Voice-to-text; token counted toward user limit |
| **i18n** | Lingui | All supported locales (see section 9.3) |
| **Error tracking** | Sentry | Logging and error monitoring |

---

## 3. Data model

### 3.1 Recipe

| Field / concept | Description |
|-----------------|-------------|
| **Content** | Title, description, ingredients (with measurements), steps (with time per step and step type: prep / active cook), tools/equipment, tips/notes |
| **Media** | Cover image; per-step images; per-step video; recipe-level video (all stored in R2) |
| **Pairing** | Optional wine/drink pairing per recipe (not applicable for drink-type recipes); can be added by user or AI |
| **Classification** | Category (predefined + custom), tags (autocomplete from existing tags) |
| **Timing** | Prep time, cook time |
| **Servings** | servings_min, servings_max |
| **Difficulty** | Easy / Medium / Hard |
| **Nutrition** | Calories, macros: carbs, protein, fat |
| **Multi-language** | Per-recipe translations; user adds manually or via Gemini |
| **Flags** | is_favorite (boolean), is_deleted, deleted_at |

### 3.2 User 

- **Credit balance**

### 3.3 Collections

- User-created groups of recipes (e.g. "Weeknight", "Holiday").
- Max 999 collections per user.
- Recipe can belong to multiple collections.
- Operations: create, rename, pin, delete (user can choose: 1. recipes are unassigned, not deleted; 2. recipes are moved to recycle bin).
- Searchable by collection name and description.
- **Visibility**: Private (default), shared with specific people (login required), or public.
- Uses the same grid layout as the home gallery.

### 3.5 Favorites

- Boolean flag on recipe (`is_favorite`).
- Toggle gallery to show favorites only.

### 3.6 Recycle bin ( skip for now, user can add to recycle bin, but no able to see it)


### 3.8 Shopping list

- Lives in the bottom tab bar; red badge shows number of recipes added.
- Each recipe page has an "Add to shopping list" button.
- **Tab 1 — Recipes**: List of added recipes; can remove one or all.
- **Tab 2 — Ingredients**: Aggregated from Tab 1 recipes; no manual delete.
  - Each ingredient shows which recipe(s) it comes from.
  - If an ingredient appears in multiple recipes, quantities are summed.
  - Toggle checkbox per ingredient.
  - Share button: send selected (checked) ingredients via iMessage or Telegram.

### 3.9 Meal plan calendar

- Lives in the bottom tab bar.
- Calendar view where user can add recipes or free-text notes to any date.


---

## 4. Users, limits & monetization

| **One-time add-on** | +2000 credits (no expiry) | $10 

### Token rules

- Tokens deducted **per AI request** (URL parse, image gen, page gen, recipe AI generation, translation, voice-to-text, etc.).
- **UI**: Token usage shown as a progress bar with percentage inside the user profile badge. Each AI action shows "This used X credits" feedback.

---

## 5. Device permissions

- **Camera + Photo library**: Cover image, step images, video capture/import.
- **Microphone**: Voice input for text fields.

Request only when the feature is first used; explain purpose in permission dialog.

---

## 6. Core features (by area)

### 6.1 Auth & profile

- **Login / sign-up**:  Apple.
- **Delete account**: Full deletion with animated UI flow: deleting images, deleting recipes, deleting account. No data retained.
- **Terms & Privacy**: Shown on login and payment screens.
  - No data kept after account deletion.
  - We do not share your recipes or generated data with anyone.
  - Data protected with Clerk and Cloudflare.
  - Contact: contact@aclogics.com; Help center: https://answer.aclogics.com/ (placeholder domains).

### 6.2 Recipe creation (multiple entry points)

No separate "draft" state. Auto-save locally with debounced sync to server (every 5 seconds of inactivity + on leave/background).
menu - user need to select which way to import. it will always output in the app language. (from scratch/ paste is not applicable for language selection)

| Method | Flow |
|--------|------|
| **From scratch** | Manual entry of all fields |
| **From photo (scan)** | User photographs a printed/handwritten recipe; AI extracts and fills in recipe fields |
| **From photo (dish)** | User photographs a dish; AI identifies the dish give user three options to choose from. - then continue  the **AI generate** flow |
| **AI generate** | User enters recipe name; Gemini generates full recipe; AI review (section 3.2 vocabulary matching); user edits and saves |
| **From URL** | User pastes URL; device fetches page content and sends to Gemini Worker; try JSON-LD structured data first, then AI parse; AI review; user edits and saves. Records `forked_from_url`. User can configure default cooking site URLs for quick access |
| **From paste** | User pastes plain text or markdown; parsed into recipe fields; user edits and saves |

- **Cover & step images**: if photo scan, use the scan, if from url, use the image from url. if no cover image, ai generated cover image. imgae will use one of the default prompt styles. No automatic step images generation.
    user can replace the cover image and step images from camera/library OR generate via Gemini (one image at a time; credits cost).

### 6.3 Recipe editing

- Full edit of all fields; `last_modified_at` updated on save.
- **Undo**: Session-level undo available while on the edit page(caches in local); lost once user leaves.

### 6.4 Recipe deletion

- Soft delete to recycle bin; 

### 6.5 Voice & input UX

- **Voice input**: Available on any text input field. Uses OpenAI gpt-audio-mini (via Cloudflare Worker); consumes credits from user limit.
- **Keyboard**: Never overlaps focused input; "dismiss keyboard" button provided.

### 6.6 Discovery & organization

- **Home / gallery**: Grid layout inspired by iPhone Photos.
  - Each tile shows a configurable label (calories, name, servings, cook time, tags, etc.).
  - Eye icon toggle to show/hide labels globally.
- **Collections**: Same grid layout; see section 3.4 for full details.
- **Search**: Keyword search by recipe name and/or ingredients. Simple implementation for now.
- **Filters**: Tag, category, last-edited range, cook time range, servings range, difficulty, calorie range.
- **Favorites**: toggle to show favorites only (see section 3.5).


### 6.10 Shopping list

See section 3.8 for full spec. Lives in the bottom tab bar.

### 6.11 Meal plan calendar

See section 3.9 for full spec. Lives in the bottom tab bar.

### 6.12 Settings & locale

- **Language**: App UI language follows device setting or no-app override (see section 9.3 for locale list). - user can click the language to go to app's system setting to change the language.
---


## 9. Non-functional requirements

### 9.1 Design

- **Tone**: Sophisticated, exclusive; same design language across all screens.
- **Balance**: Aesthetics and functionality equally important.
- **Design System**: 
1)  8pt grid (spacing only allow 4/8/12/16/24/32/40/48)
2） 使用 design tokens (color/spacing/radius/shadow/typography),support light/dark
3）严格排版层级（32/24/20/16/14/12+ 对应行高），每个Card 信息不超过3行风格：克制、中性、留白足、轻边框、轻投影、微动效 （hover/focus）输出：结构说明 + token表+React/Tailwind 可运行代码

### 9.2 Implementation

- **Modularity**: Modular features, reusable components and functions.
- **Concurrency**: Avoid race conditions (e.g. save while generating).
- **Deploy**: Each major piece has a deploy doc (`.md`); any new service includes setup instructions.

### 9.3 Localizations (target locales)

`en`, `zh-Hans`.

### 9.4 Error handling

- On failure (tokens exhausted, R2 error, Clerk down, etc.): show clear error message.
- Provide support links: email contact@aclogics.com + help center https://answer.aclogics.com/ (placeholder domains).
- All errors logged to Sentry.

### 9.5 Accessibility

- Dynamic font scaling (respect system font size setting).
- Reduced motion (respect system "reduce motion" setting).
- Screen reader support deferred to a future pass.

---

## 11. Bottom tab bar structure

| Tab | Feature | Badge |
|-----|---------|-------|
| **Home** | Recipe gallery (grid) | — |
| **Shopping List** | Recipes + aggregated ingredients | Red badge: recipe count |
| **Meal Plan** | Calendar with recipes and notes | — |
| **Profile** | Settings, account, token usage | — |
