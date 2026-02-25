# Canvas & Clove — Database (Cloudflare D1)

Single shared D1 database for all users.

Can view details here: https://console.cloudflare.com/d1/accounts/1723021535804/databases/91125414-422f-498f-8f4b-588105502391/overview

## Setup

```bash
# Create the D1 database
npx wrangler d1 create kitchen-gallery-db

# Run migrations
npx wrangler d1 migrations apply kitchen-gallery-db --local   # local dev
npx wrangler d1 migrations apply kitchen-gallery-db --remote  # production
```

## Migrations

All migrations live in `migrations/`. They are applied in order by filename prefix.

| Migration | Description |
|-----------|-------------|
| `0001_initial.sql` | Full initial schema: users, recipes, ingredients, steps, collections, shopping list, meal plan, books, share links, stars |

## Key design decisions

- **Single database** for all users (multi-tenant by `owner_user_id`).
- **Soft delete** for recipes (`is_deleted` + `deleted_at`); auto-purge after 30 days (future cleanup script).
- **JSON arrays** stored as TEXT for tags (parsed at application layer).
- **R2 keys** stored as TEXT references for all media files.
- **Clerk user IDs** used as primary keys in the `users` table.
