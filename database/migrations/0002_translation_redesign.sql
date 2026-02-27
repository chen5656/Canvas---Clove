-- M8x Table — Migration 0002: Translation Redesign
--
-- Changes:
--   1. Move translatable text (title, description, tools, tips) out of recipes
--      into recipe_translations. Recipes become language-agnostic containers;
--      all locale-specific content lives in recipe_translations.
--   2. Move translatable text (name, unit) out of ingredients into a new
--      ingredient_translations table.
--   3. Move translatable text (description) out of steps into a new
--      step_translations table.
--   4. Drop ingredient_vocab (not needed).
--   5. Drop collection_shares (sharing deferred to future).

-- ============================================================
-- 1. Recipes: drop translatable columns
-- ============================================================
ALTER TABLE recipes DROP COLUMN title;
ALTER TABLE recipes DROP COLUMN description;
ALTER TABLE recipes DROP COLUMN tools;
ALTER TABLE recipes DROP COLUMN tips;

-- ============================================================
-- 2. Ingredients: drop translatable columns, add translation table
-- ============================================================
ALTER TABLE ingredients DROP COLUMN name;
ALTER TABLE ingredients DROP COLUMN unit;

CREATE TABLE IF NOT EXISTS ingredient_translations (
  id            TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  locale        TEXT NOT NULL,
  name          TEXT NOT NULL,
  unit          TEXT NOT NULL DEFAULT '',
  UNIQUE(ingredient_id, locale)
);

CREATE INDEX idx_ingredient_translations_ingredient ON ingredient_translations(ingredient_id);

-- ============================================================
-- 3. Steps: drop translatable column, add translation table
-- ============================================================
ALTER TABLE steps DROP COLUMN description;

CREATE TABLE IF NOT EXISTS step_translations (
  id          TEXT PRIMARY KEY,
  step_id     TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  locale      TEXT NOT NULL,
  description TEXT NOT NULL,
  UNIQUE(step_id, locale)
);

CREATE INDEX idx_step_translations_step ON step_translations(step_id);

-- ============================================================
-- 4. Drop ingredient_vocab (no longer needed)
-- ============================================================
DROP TABLE IF EXISTS ingredient_vocab;

-- ============================================================
-- 5. Drop collection_shares (sharing deferred to future)
-- ============================================================
DROP TABLE IF EXISTS collection_shares;
