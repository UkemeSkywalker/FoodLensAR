import { NextRequest, NextResponse } from 'next/server';
import { 
  uploadToS3, 
  uploadImageFromUrl, 
  getSignedUrl, 
  deleteFromS3, 
  generateImageKey,
  validateS3Config 
} from '@/lib/s3';

export async function GET() {
  try {
    // Validate S3 configuration
    const configStatus = validateS3Config();
    if (!configStatus.valid) {
      return NextResponse.json({
        success: false,
        error: 'S3 configuration invalid',
        details: configStatus.errors
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'S3 configuration is valid',
      config: {
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      }
    });
  } catch (error) {
    console.error('S3 test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test S3 configuration'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'upload-test': {
        // Create a test image buffer (1x1 pixel PNG)
        const testImageBuffer = Buffer.from([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
          0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
          0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
          0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
          0x01, 0x00, 0x01, 0x35, 0x6F, 0x31, 0x74, 0x00, 0x00, 0x00, 0x00, 0x49,
          0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);

        const testKey = `test/test-image-${Date.now()}.png`;
        const result = await uploadToS3(testImageBuffer, testKey, 'image/png');

        return NextResponse.json({
          action: 'upload-test',
          result
        });
      }

      case 'upload-from-url': {
        const { imageUrl, restaurantId, menuItemId } = params;
        if (!imageUrl || !restaurantId || !menuItemId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: imageUrl, restaurantId, menuItemId'
          }, { status: 400 });
        }

        const key = generateImageKey(restaurantId, menuItemId);
        const result = await uploadImageFromUrl(imageUrl, key);

        return NextResponse.json({
          action: 'upload-from-url',
          result
        });
      }

      case 'signed-url': {
        const { key } = params;
        if (!key) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: key'
          }, { status: 400 });
        }

        const result = await getSignedUrl(key);

        return NextResponse.json({
          action: 'signed-url',
          result
        });
      }

      case 'delete': {
        const { key } = params;
        if (!key) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: key'
          }, { status: 400 });
        }

        const result = await deleteFromS3(key);

        return NextResponse.json({
          action: 'delete',
          result
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: upload-test, upload-from-url, signed-url, delete'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('S3 test API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}