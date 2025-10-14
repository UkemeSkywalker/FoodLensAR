import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUserFromCookies } from '@/lib/auth'

// GET /api/menu - Get all menu items for authenticated restaurant
export async function GET() {
  try {
    const user = await getAuthenticatedUserFromCookies()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()

    // Get restaurant ID from user email
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('email', user.email)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Get menu items for this restaurant
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })

    if (menuError) {
      console.error('Error fetching menu items:', menuError)
      return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
    }

    return NextResponse.json({ menuItems })
  } catch (error) {
    console.error('Menu GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/menu - Create new menu item
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserFromCookies()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, price, ingredients, description } = body

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

    // Validate price is a positive number
    const numericPrice = parseFloat(price)
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'Price must be a valid positive number' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get restaurant ID from user email
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('email', user.email)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Create menu item
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .insert({
        restaurant_id: restaurant.id,
        name: name.trim(),
        price: numericPrice,
        ingredients: ingredients || [],
        description: description?.trim() || null,
        image_generation_status: 'pending'
      })
      .select()
      .single()

    if (menuError) {
      console.error('Error creating menu item:', menuError)
      return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
    }

    return NextResponse.json({ 
      menuItem,
      message: 'Menu item created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Menu POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}