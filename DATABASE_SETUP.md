# Database Setup Guide

## Supabase Configuration

The application is configured to use Supabase with the following credentials:

- **Project URL**: https://onhkopzbqzbcaorxxpum.supabase.co
- **API Key**: Configured in `.env.local`

## Database Schema Setup

To set up the database schema, follow these steps:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Execute the following SQL to create the required tables and policies:

```sql
-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    ingredients TEXT[],
    description TEXT,
    image_url TEXT,
    image_generation_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for restaurants
DROP POLICY IF EXISTS "Restaurants can only see their own data" ON restaurants;
CREATE POLICY "Restaurants can only see their own data" ON restaurants
    FOR ALL USING (auth.uid()::text = email);

-- Create RLS policies for menu_items
DROP POLICY IF EXISTS "Restaurants can only manage their menu items" ON menu_items
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE email = auth.uid()::text
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_email ON restaurants(email);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_created_at ON menu_items(created_at);
```

## Testing the Setup

1. Start the development server:
   ```bash
   cd food-lens-mvp
   npm run dev
   ```

2. Visit the database test page:
   ```
   http://localhost:3000/database-test
   ```

3. Click "Test API Connection" to verify the Supabase connection
4. Click "Check Database Health" to verify tables and connectivity

## Row Level Security (RLS)

The database is configured with Row Level Security to ensure:

- Restaurants can only access their own data
- Menu items are isolated by restaurant ownership
- Authentication is required for data access

## Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://onhkopzbqzbcaorxxpum.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Next Steps

After setting up the database:

1. Implement authentication system (Task 3)
2. Build restaurant dashboard (Task 4)
3. Add menu management functionality

## Troubleshooting

- If connection fails, verify the Supabase URL and API key
- If tables don't exist, run the SQL schema in Supabase SQL Editor
- If RLS policies fail, ensure authentication is properly configured