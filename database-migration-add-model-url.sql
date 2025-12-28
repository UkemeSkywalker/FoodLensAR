-- Migration: Add model_url column to menu_items table for AR 3D model storage
-- Date: 2024-12-10
-- Purpose: Support AR Food Visualization feature by storing GLTF model URLs

-- Add model_url column to menu_items table
ALTER TABLE menu_items
ADD COLUMN model_url TEXT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN menu_items.model_url IS 'URL to GLTF 3D model file for AR visualization, NULL uses default placeholder model';

-- Create index for model_url column for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_model_url ON menu_items(model_url);

-- Update the updated_at timestamp for tracking schema changes
UPDATE menu_items SET updated_at = NOW() WHERE model_url IS NULL;