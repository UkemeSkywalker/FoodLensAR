import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  console.log('=== API Route Started ===')
  
  try {
    const { restaurantId } = await request.json()

    console.log('=== Image Generation Debug ===')
    console.log('Restaurant ID received:', restaurantId)

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    const { itemId } = await params
    console.log('Menu Item ID:', itemId)

    // Verify restaurant exists
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .single()

    console.log('Restaurant lookup result:', { restaurant, restaurantError })

    if (restaurantError || !restaurant) {
      console.log('Restaurant not found in database. Checking all restaurants...')
      
      // Debug: List all restaurants
      const { data: allRestaurants } = await supabase
        .from('restaurants')
        .select('*')
      
      console.log('All restaurants in database:', allRestaurants)
      
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Get menu item and verify ownership
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', itemId)
      .eq('restaurant_id', restaurantId)
      .single()

    console.log('Menu item lookup result:', { menuItem, menuError })

    if (menuError || !menuItem) {
      console.log('Menu item not found. Checking all menu items for this restaurant...')
      
      // Debug: List all menu items for this restaurant
      const { data: allMenuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
      
      console.log('All menu items for restaurant:', allMenuItems)
      
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    // Update status to generating
    await supabase
      .from('menu_items')
      .update({ image_generation_status: 'generating' })
      .eq('id', itemId)

    // Generate image
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemName: menuItem.name,
        description: menuItem.description,
        cuisine: menuItem.cuisine,
        menuItemId: itemId,
        restaurantId: restaurantId
      })
    })

    const result = await response.json()

    if (result.success && result.imageUrl) {
      // Update with generated image
      const { data: updatedItem, error: updateError } = await supabase
        .from('menu_items')
        .update({
          image_url: result.imageUrl,
          image_generation_status: 'completed'
        })
        .eq('id', itemId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating menu item with image:', updateError)
        return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
      }

      console.log('=== API Route Success ===')
      return NextResponse.json({
        success: true,
        menuItem: updatedItem,
        message: 'Image generated successfully'
      })
    } else {
      // Mark as failed
      await supabase
        .from('menu_items')
        .update({ image_generation_status: 'failed' })
        .eq('id', itemId)

      console.log('=== API Route Failed - Image Generation ===')
      return NextResponse.json({
        success: false,
        error: result.error || 'Image generation failed'
      }, { status: 500 })
    }

  } catch (error) {
    console.log('=== API Route Catch Block ===')
    console.error('Image generation error:', error)

    // Mark as failed
    try {
      const { itemId } = await params
      await supabase
        .from('menu_items')
        .update({ image_generation_status: 'failed' })
        .eq('id', itemId)
    } catch (updateError) {
      console.error('Error updating failed status:', updateError)
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}