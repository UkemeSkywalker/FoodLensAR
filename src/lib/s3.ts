import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';

// Factory function for creating S3 client
function createS3Client(): S3Client {
  // Validate required environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
    throw new Error('AWS S3 environment variables not configured - S3 features will be disabled');
  }

  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function getBucketName(): string {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is required');
  }
  return bucketName;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface SignedUrlResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a file buffer to S3
 * @param buffer File buffer to upload
 * @param key S3 object key (file path)
 * @param contentType MIME type of the file
 * @returns Upload result with URL or error
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/jpeg',
  cacheControl?: string
): Promise<UploadResult> {
  try {
    const client = createS3Client();
    const bucketName = getBucketName();
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Removed ACL - bucket should have public read policy instead
      ServerSideEncryption: 'AES256',
      CacheControl: cacheControl || 'public, max-age=31536000', // Default: cache for 1 year
      Metadata: {
        uploadedAt: new Date().toISOString(),
        source: 'food-lens-app'
      }
    });

    await client.send(command);

    const url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return {
      success: true,
      url,
      key
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Upload a file from URL to S3 (for AI-generated images)
 * @param imageUrl URL of the image to download and upload
 * @param key S3 object key (file path)
 * @returns Upload result with S3 URL or error
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  key: string
): Promise<UploadResult> {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Upload to S3
    return await uploadToS3(buffer, key, contentType);
  } catch (error) {
    console.error('Image URL upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image from URL'
    };
  }
}

/**
 * Generate a signed URL for secure access to S3 objects
 * @param key S3 object key
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Signed URL result
 */
export async function getSignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<SignedUrlResult> {
  try {
    const client = createS3Client();
    const bucketName = getBucketName();
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getS3SignedUrl(client, command, { expiresIn });

    return {
      success: true,
      url
    };
  } catch (error) {
    console.error('Signed URL generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate signed URL'
    };
  }
}

/**
 * Delete an object from S3
 * @param key S3 object key to delete
 * @returns Success status
 */
export async function deleteFromS3(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createS3Client();
    const bucketName = getBucketName();
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);

    return { success: true };
  } catch (error) {
    console.error('S3 delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete from S3'
    };
  }
}

/**
 * Generate a unique S3 key for a menu item image with restaurant isolation
 * @param restaurantId Restaurant UUID for data isolation
 * @param menuItemId Menu item UUID
 * @param extension File extension (default: png)
 * @returns S3 key string
 */
export function generateImageKey(
  restaurantId: string,
  menuItemId: string,
  extension: string = 'png'
): string {
  const timestamp = Date.now();
  return `restaurants/${restaurantId}/menu-items/${menuItemId}/${timestamp}.${extension}`;
}

/**
 * Extract S3 key from a full S3 URL
 * @param url Full S3 URL
 * @returns S3 key or null if invalid URL
 */
export function extractS3Key(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Handle both path-style and virtual-hosted-style URLs
    if (urlObj.hostname.includes('.s3.')) {
      return urlObj.pathname.substring(1); // Remove leading slash
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate S3 configuration
 * @returns Configuration status
 */
export function validateS3Config(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.AWS_ACCESS_KEY_ID) {
    errors.push('AWS_ACCESS_KEY_ID is not set');
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    errors.push('AWS_SECRET_ACCESS_KEY is not set');
  }
  if (!process.env.AWS_S3_BUCKET_NAME) {
    errors.push('AWS_S3_BUCKET_NAME is not set');
  }
  if (!process.env.AWS_REGION) {
    errors.push('AWS_REGION is not set');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}