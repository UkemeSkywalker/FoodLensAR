import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUserFromCookies } from '@/lib/auth'

// GET /api/menu/[itemId] - Get specific menu item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getAuthenticatedUserFromCookies()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = await params
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

    // Get menu item for this restaurant
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', itemId)
      .eq('restaurant_id', restaurant.id)
      .single()

    if (menuError || !menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    return NextResponse.json({ menuItem })
  } catch (error) {
    console.error('Menu item GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/menu/[itemId] - Update menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getAuthenticatedUserFromCookies()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = await params
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

    // Update menu item
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .update({
        name: name.trim(),
        price: numericPrice,
        ingredients: ingredients || [],
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('restaurant_id', restaurant.id)
      .select()
      .single()

    if (menuError || !menuItem) {
      console.error('Error updating menu item:', menuError)
      return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
    }

    return NextResponse.json({ 
      menuItem,
      message: 'Menu item updated successfully'
    })
  } catch (error) {
    console.error('Menu item PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/menu/[itemId] - Delete menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getAuthenticatedUserFromCookies()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = await params
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

    // Delete menu item
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId)
      .eq('restaurant_id', restaurant.id)

    if (deleteError) {
      console.error('Error deleting menu item:', deleteError)
      return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Menu item deleted successfully'
    })
  } catch (error) {
    console.error('Menu item DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}