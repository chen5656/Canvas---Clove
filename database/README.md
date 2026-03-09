# m8xtable — Database (Cloudflare D1)

Single shared D1 database for all users (multi-tenant by `owner_user_id`).

## Setup

```bash
# Create the D1 database
npx wrangler d1 create m8xtable-db

# Run migrations
# npx wrangler d1 migrations apply m8xtable-db --local   # local dev
Summer hi # production
```

## Migrations

| Migration | Description |
|-----------|-------------|
| `0001_initial.sql` | Full schema: users, recipes, ingredients, steps, collections, shopping list, meal plan, translations, custom categories |

## Key design decisions

- **Single database** for all users (multi-tenant by `owner_user_id`).
- **Soft delete** for recipes (`is_deleted` + `deleted_at`); auto-purge after 30 days (future cleanup script).
- **Draft model**: drafts are stored on-device only and never written to D1 until the user taps Save.
- **JSON arrays** stored as TEXT for tags (parsed at application layer).
- **R2 keys** stored as TEXT references for all media files.
- **Clerk user IDs** used as primary keys in the `users` table.

## Table overview

| Table | Purpose |
|-------|---------|
| `users` | App profile; auth handled by Clerk |
| `recipes` | Core recipe data; soft-delete; URL-import source tracking |
| `recipe_translations` | Per-locale title, description, tools, tips (§3.1) |
| `ingredients` | Recipe ingredients with amount, unit, sort order |
| `steps` | Recipe steps with type (prep/active_cook), time, images, video |
| `ingredient_vocab` | Per-user ingredient name vocabulary for autocomplete |
| `custom_categories` | Per-user custom recipe categories (§3.1) |
| `collections` | User-created recipe groups; visibility; pinnable (§3.3) |
| `collection_recipes` | M:M join: collections ↔ recipes |
| `collection_shares` | Specific users a collection is shared with (§3.3) |
| `shopping_list` | Recipes added to user's shopping list (§3.8) |
| `meal_plan` | Calendar entries — recipe or free-text note per date/slot (§3.9) |
