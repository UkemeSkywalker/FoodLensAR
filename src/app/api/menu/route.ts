import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createPublicClient } from '@/lib/supabase'
import { getAuthenticatedUserFromCookies } from '@/lib/auth'

// Background image generation function
async function triggerImageGeneration(itemId: string, itemName: string, description?: string) {
  try {
    // Update status to generating
    const supabase = createServerClient()
    await supabase
      .from('menu_items')
      .update({ image_generation_status: 'generating' })
      .eq('id', itemId)

    // Generate image
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemName,
        description,
        menuItemId: itemId
      })
    })

    const result = await response.json()

    if (result.success && result.imageUrl) {
      // Update with generated image
      await supabase
        .from('menu_items')
        .update({
          image_url: result.imageUrl,
          image_generation_status: 'completed'
        })
        .eq('id', itemId)
    } else {
      // Mark as failed
      await supabase
        .from('menu_items')
        .update({ image_generation_status: 'failed' })
        .eq('id', itemId)
    }
  } catch (error) {
    // Mark as failed
    const supabase = createServerClient()
    await supabase
      .from('menu_items')
      .update({ image_generation_status: 'failed' })
      .eq('id', itemId)
    throw error
  }
}

// GET /api/menu - Get menu items (authenticated for restaurant owners, public for customers)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const isPublic = searchParams.get('public') === 'true'

    if (isPublic && restaurantId) {
      // Public access - use public client for menu items
      const supabase = createPublicClient()
      
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

      if (menuError) {
        console.error('Error fetching public menu items:', menuError)
        return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
      }

      return NextResponse.json({ menuItems })
    } else {
      // Authenticated access - use server client
      const supabase = createServerClient()
      const user = await getAuthenticatedUserFromCookies()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

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
    }
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

    // Trigger image generation in the background (don't wait for it)
    triggerImageGeneration(menuItem.id, menuItem.name, menuItem.description)
      .catch(error => {
        console.error('Background image generation failed for item:', menuItem.id, error)
      })

    return NextResponse.json({ 
      menuItem,
      message: 'Menu item created successfully. Image generation started.'
    }, { status: 201 })
  } catch (error) {
    console.error('Menu POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}