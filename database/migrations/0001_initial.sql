-- Canvas & Clove — Initial D1 Schema
-- Single shared database for all users

-- ============================================================
-- Users (app profile; auth is handled by Clerk)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY,            -- Clerk user ID
  display_name     TEXT NOT NULL DEFAULT '',
  profile_picture  TEXT,                        -- R2 key
  locale           TEXT NOT NULL DEFAULT 'en',
  monthly_tokens   INTEGER NOT NULL DEFAULT 20000,
  addon_tokens     INTEGER NOT NULL DEFAULT 0,
  tokens_used      INTEGER NOT NULL DEFAULT 0,
  tier             TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'premium')),
  token_reset_date TEXT,                        -- ISO date of next reset
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Recipes
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
  id                    TEXT PRIMARY KEY,
  owner_user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL DEFAULT '',
  description           TEXT NOT NULL DEFAULT '',
  cover_image           TEXT,                   -- R2 key
  category              TEXT NOT NULL DEFAULT '',
  difficulty            TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  prep_time             INTEGER,                -- minutes
  cook_time             INTEGER,                -- minutes
  servings_min          INTEGER,
  servings_max          INTEGER,
  calories              INTEGER,
  carbs                 REAL,
  protein               REAL,
  fat                   REAL,
  wine_pairing          TEXT,
  tags                  TEXT NOT NULL DEFAULT '[]',  -- JSON array
  is_favorite           INTEGER NOT NULL DEFAULT 0,
  is_deleted            INTEGER NOT NULL DEFAULT 0,
  deleted_at            TEXT,
  star_count            INTEGER NOT NULL DEFAULT 0,
  fork_count            INTEGER NOT NULL DEFAULT 0,
  forked_from_url       TEXT,
  forked_from_recipe_id TEXT,
  fork_date             TEXT,
  video                 TEXT,                   -- R2 key
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  last_modified_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_recipes_owner ON recipes(owner_user_id);
CREATE INDEX idx_recipes_deleted ON recipes(is_deleted);
CREATE INDEX idx_recipes_favorite ON recipes(is_favorite);
CREATE INDEX idx_recipes_category ON recipes(category);

-- ============================================================
-- Recipe translations
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_translations (
  id         TEXT PRIMARY KEY,
  recipe_id  TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  locale     TEXT NOT NULL,
  title      TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(recipe_id, locale)
);

-- ============================================================
-- Ingredients
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredients (
  id         TEXT PRIMARY KEY,
  recipe_id  TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  amount     REAL,
  unit       TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_ingredients_recipe ON ingredients(recipe_id);

-- ============================================================
-- Steps
-- ============================================================
CREATE TABLE IF NOT EXISTS steps (
  id          TEXT PRIMARY KEY,
  recipe_id   TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  step_type   TEXT NOT NULL DEFAULT 'active_cook' CHECK (step_type IN ('prep', 'active_cook')),
  time_minutes INTEGER,
  image       TEXT,                              -- R2 key
  video       TEXT,                              -- R2 key
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_steps_recipe ON steps(recipe_id);

-- ============================================================
-- Ingredient vocabulary (per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredient_vocab (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, name)
);

-- ============================================================
-- Collections
-- ============================================================
CREATE TABLE IF NOT EXISTS collections (
  id           TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  visibility   TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'public')),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_collections_owner ON collections(owner_user_id);

-- ============================================================
-- Collection-Recipe join table
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_recipes (
  id            TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  recipe_id     TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  UNIQUE(collection_id, recipe_id)
);

-- ============================================================
-- Collection sharing (for "shared with specific people")
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_shares (
  id            TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  shared_with   TEXT NOT NULL,                    -- Clerk user ID
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(collection_id, shared_with)
);

-- ============================================================
-- Custom recipe pages (generated HTML)
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_pages (
  id         TEXT PRIMARY KEY,
  recipe_id  TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  html       TEXT NOT NULL,
  style      TEXT NOT NULL DEFAULT '',
  prompt     TEXT NOT NULL DEFAULT '',
  is_pinned  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_recipe_pages_recipe ON recipe_pages(recipe_id);

-- ============================================================
-- Shopping list items
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_list (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id  TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  added_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, recipe_id)
);

-- ============================================================
-- Meal plan entries
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_plan (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,                       -- YYYY-MM-DD
  meal_type  TEXT NOT NULL DEFAULT 'other',       -- breakfast, lunch, dinner, snack, other
  recipe_id  TEXT REFERENCES recipes(id) ON DELETE SET NULL,
  note       TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_meal_plan_user_date ON meal_plan(user_id, date);

-- ============================================================
-- Books (Premium tier)
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
  id           TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  cover_image  TEXT,                              -- R2 key
  file_key     TEXT,                              -- R2 key for EPUB
  status       TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  is_downloaded INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_books_owner ON books(owner_user_id);

-- ============================================================
-- Book chapters
-- ============================================================
CREATE TABLE IF NOT EXISTS book_chapters (
  id            TEXT PRIMARY KEY,
  book_id       TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  sort_order    INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- Share links
-- ============================================================
CREATE TABLE IF NOT EXISTS share_links (
  id         TEXT PRIMARY KEY,
  recipe_id  TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Stars (user-recipe)
-- ============================================================
CREATE TABLE IF NOT EXISTS stars (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id  TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, recipe_id)
);
