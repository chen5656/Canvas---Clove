-- Migration: Add cover_image to collections table
ALTER TABLE collections ADD COLUMN cover_image TEXT;
