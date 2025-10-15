-- Add cuisine column to menu_items table
-- Run this in your Supabase SQL editor

ALTER TABLE menu_items 
ADD COLUMN cuisine TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN menu_items.cuisine IS 'Cuisine type for the menu item (e.g., Italian, Mexican, etc.)';