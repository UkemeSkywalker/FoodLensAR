-- Disable Row Level Security for development
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Restaurants can only see their own data" ON restaurants;
DROP POLICY IF EXISTS "Restaurants can only manage their menu items" ON menu_items;