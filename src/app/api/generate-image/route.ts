import { NextRequest, NextResponse } from 'next/server'
import { googleNanoBananaService, uploadToS3, generateImageKey } from '@/lib'

export async function POST(request: NextRequest) {
  try {
    const { itemName, description, cuisine, menuItemId, restaurantId } = await request.json()

    if (!itemName) {
      return NextResponse.json(
        { error: 'Item name is required' },
        { status: 400 }
      )
    }

    if (!restaurantId || !menuItemId) {
      return NextResponse.json(
        { error: 'Restaurant ID and Menu Item ID are required for secure storage' },
        { status: 400 }
      )
    }

    console.log('Generating image for:', { itemName, description, cuisine, restaurantId, menuItemId })

    // Generate image using Google Nano Banana API
    const result = await googleNanoBananaService.generateMenuItemImage(
      itemName,
      description,
      cuisine
    )

    if (!result.success || !result.imageData) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate image' },
        { status: 500 }
      )
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(result.imageData, 'base64')
    
    // Generate S3 key with restaurant isolation
    const imageKey = generateImageKey(restaurantId, menuItemId, 'png')
    
    // Upload to S3
    const uploadResult = await uploadToS3(imageBuffer, imageKey, 'image/png')
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Failed to upload image' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.url,
      imageKey: uploadResult.key
    })

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Test endpoint
export async function GET() {
  try {
    const testResult = await googleNanoBananaService.testConnection()
    
    return NextResponse.json({
      service: 'Google Nano Banana API',
      status: testResult.success ? 'connected' : 'error',
      error: testResult.error
    })
  } catch (error) {
    return NextResponse.json({
      service: 'Google Nano Banana API',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}