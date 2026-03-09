# m8xtable — Product Plan

A cross-platform cooking recipe collection app (iPhone, iPad). **Online only** — no offline mode, no sync layer.

---

## 1. Overview & scope

| Aspect | Decision |
|--------|----------|
| **Platforms** | iPhone, iPad (Expo) |
| **Network** | Online only; no offline storage or sync |
| **Core value** | Collect, organize |

---

## 2. Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| **App** | Expo (React Native) | Single codebase for iOS + Web |
| **Auth** | iOS only; Sign in with Apple | |
| **Database** | Cloudflare D1 Shared D1 (multi-tenant by owner_user_id)| SQLite-compatible |
| **File storage** | Cloudflare R2 | Images, video |
| **AI providers** | Gemini, OpenAI, Claude, OpenRouter, Qwen, GLM | API keys stored per-user in Settings; direct connection from app to provider — no intermediary gateway |
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
| **Language** | Stored in the app’s default language only |
| **Flags** | is_favorite (boolean), is_draft (boolean), is_deleted, deleted_at |
| **Source** | forked_from_url (if imported from URL) |

### 3.2 User

- **Profile**: Display name, avatar.
- **API keys**: Per-provider keys (Gemini, OpenAI, Claude, OpenRouter, Qwen, GLM) stored securely on-device in the iOS Keychain (`kSecAttrAccessibleWhenUnlockedThisDeviceOnly`); used for direct AI calls.

### 3.3 Collections
- add, remove recipes to a collection.
- add cover image.
- batch add, user can select multiple recipes and add them to a collection.
- batch remove, user can select multiple recipes and remove them from a collection.
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

### 3.6 Recycle bin 
- Soft-deleted recipes; hidden from main UI.
- Show countdown ("X days remaining") per recipe.
- User can restore within 30 days.
- User can select and permanently delete early ("empty bin").
- Auto-purge after 30 days (cleanup script added later).

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

## 4. API key management

Each user stores their own API keys for AI providers in the app Settings. AI requests are made directly from the device to the provider — there is no server-side proxy or gateway for AI calls.

Supported providers:

| Provider | Used for |
|----------|----------|
| **Gemini** | Recipe generation,translation, image generation, URL parsing, Voice-to-text |
| **OpenAI** | Voice-to-text (gpt-4o-audio-preview), Alternative recipe / text generation |
| **Claude** | Alternative recipe / text generation, Voice-to-text |
| **OpenRouter** | Multi-provider routing (optional) |
| **Qwen** | Alternative text generation, Voice-to-text |
| **GLM** | Alternative text generation, Voice-to-text |

- Keys are stored securely in the iOS Keychain (`kSecAttrAccessibleWhenUnlockedThisDeviceOnly`).
- User can add, update, or remove keys at any time.
- Key entry supports temporary show/hide while typing, but after Save the full key is never displayed again.
- After Save, each provider shows only a masked preview (first few + last few characters) and status (`configured` / `not configured`).
- Available actions after Save: `Replace key` and `Delete key` (no `Reveal full key` action).
- If no API key is configured for a required provider, the feature is disabled and the user is prompted to add one in Settings.
- Security notice in Settings: if a device is lost, compromised, or reverse engineered, the user must rotate affected provider API keys immediately.

---

## 5. Device permissions

- **Camera + Photo library**: Cover image, step images, video capture/import.
- **Microphone**: Voice input for text fields.

Request only when the feature is first used; explain purpose in permission dialog.

---

## 6. Core features (by area)

### 6.1 Auth & profile

- **Login / sign-up**: Apple Sign In.
- **Delete account**: Full deletion with animated UI flow: deleting images, deleting recipes, deleting account. No data retained.
- **Terms & Privacy**: Shown on login screen.
  - No data kept after account deletion.
  - We do not share your recipes or generated data with anyone.
  - Data protected with Clerk and Cloudflare.
  - Contact: contact@aclogics.com; Help center: https://answer.aclogics.com/ (placeholder domains).

### 6.2 Recipe creation (multiple entry points)

**Draft model**: All new and in-progress recipes exist as device-local drafts until the user explicitly taps **Save**. On Save, the recipe is committed to the server. Drafts are stored on-device only and are **not synced between devices**.

The import menu lets the user select an entry method. Output language always matches the app language (language selection is not applicable for "From scratch" or "From paste").

| Method | Flow |
|--------|------|
| **From scratch** | Manual entry of all fields |
| **From photo (scan)** | User photographs a printed/handwritten recipe; AI extracts and fills in recipe fields |
| **From photo (dish)** | User photographs a dish; AI identifies the dish and gives three options; user selects one, then continues the **AI generate** flow |
| **From dish name** | User enters dish name; AI generates full recipe; user reviews, edits, and saves |
| **From URL** | User pastes URL; device fetches page content and sends to AI provider; try JSON-LD structured data first, then AI parse; user edits and saves. Records `forked_from_url`. User can configure default cooking site URLs for quick access. **Paywall sites**: try JSON-LD first; if parsing fails, show clear error and offer paste-as-text fallback — no attempt to bypass paywalls. |
| **From paste** | User pastes plain text or markdown; parsed into recipe fields; user edits and saves |

- **Cover & step images**: if photo scan, use the scanned image; if from URL, use the image from the URL; if no cover image, AI-generate one using a default prompt style. No automatic step-image generation.
  User can replace cover image and step images from camera/library or generate via AI (one image at a time; requires a configured Gemini API key).

### 6.3 Recipe editing

- Full edit of all fields; `last_modified_at` updated on save.
- **Undo**: Session-level undo available while on the edit page (cached locally); lost once user leaves.
- Unsaved edits remain as a local draft on the current device until Save is tapped.

### 6.4 Recipe deletion

- Soft delete to recycle bin.

### 6.5 Voice & input UX

- **Voice input**: Available on any text input field. Uses OpenAI voice model (requires OpenAI API key in Settings); converts voice to text and fills the active field.
- **Keyboard**: Never overlaps focused input; "dismiss keyboard" button provided.

### 6.6 Discovery & organization

- **Home / gallery**: Grid layout inspired by iPhone Photos.
  - Each tile shows a configurable label (calories, name, servings, cook time, tags, etc.).
  - Eye icon toggle to show/hide labels globally.
- **Collections**: Same grid layout; see section 3.3 for full details.
- **Search**: Keyword search by recipe name and/or ingredients. Simple implementation for now.
- **Filters**: Tag, category, last-edited range, cook time range, servings range, difficulty, calorie range.
- **Favorites**: Toggle to show favorites only (see section 3.5).

### 6.10 Shopping list

See section 3.8 for full spec. Lives in the bottom tab bar.

### 6.11 Meal plan calendar

See section 3.9 for full spec. Lives in the bottom tab bar.

### 6.12 Settings & locale

- **Language**: App UI language follows device setting; user can tap the language option to open the system Settings app to change it.
- **API keys**: User enters and manages API keys for each supported AI provider (Gemini, OpenAI, Claude, OpenRouter, Qwen, GLM). Keys are stored in iOS Keychain (`kSecAttrAccessibleWhenUnlockedThisDeviceOnly`). After save, the UI shows only a masked preview (first/last few characters), never the full key. Actions: `Replace key`, `Delete key`. Each provider shows status (`configured` / `not configured`). Settings includes a notice that users must rotate keys if device is lost or compromised.
- **Account**: Manage profile, delete account.

---

## 9. Non-functional requirements

### 9.1 Design

- **Tone**: Sophisticated, exclusive; same design language across all screens.
- **Balance**: Aesthetics and functionality equally important.
- **Design System**:
  1. 8pt grid (spacing only: 4 / 8 / 12 / 16 / 24 / 32 / 40 / 48)
  2. Design tokens (color / spacing / radius / shadow / typography); support light/dark
  3. Strict typographic hierarchy (32 / 24 / 20 / 16 / 14 / 12 with matching line heights); each card shows no more than 3 lines. Style: restrained, neutral, generous whitespace, light borders, light shadows, subtle micro-animations (hover/focus)

### 9.2 Implementation

- **Modularity**: Modular features, reusable components and functions.
- **Concurrency**: Avoid race conditions (e.g. save while generating).
- **Deploy**: Each major piece has a deploy doc (`.md`); any new service includes setup instructions.

### 9.3 Localizations (target locales)

`en`, `zh-Hans`.

### 9.4 Error handling

- On failure (R2 error, Clerk down, AI provider error, missing API key, etc.): show a clear error message.
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
| **Profile** | Settings, account, API key management | — |

## Prompting for frontend aesthetics

<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:
 
Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.
 
Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
 
Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.
 
Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effec ts that match the overall aesthetic.
 
Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character
 
Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
