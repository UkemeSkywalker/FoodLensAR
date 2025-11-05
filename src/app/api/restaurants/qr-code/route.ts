import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { uploadToS3 } from '@/lib/s3';

async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function POST(_request: NextRequest) {
  try {
    console.log('=== QR Code POST Request Debug ===');
    
    // Create server client with cookies
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth result:', { user: user?.email, authError });
    
    if (authError || !user) {
      console.log('No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get restaurant record - verify ownership
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('email', user.email)
      .single();

    if (restaurantError || !restaurant) {
      console.log('Restaurant error:', restaurantError);
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Generate customer menu URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const menuUrl = `${baseUrl}/menu/${restaurant.id}`;

    console.log('=== QR Code Generation Debug ===');
    console.log('Restaurant ID:', restaurant.id);
    console.log('Menu URL:', menuUrl);

    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(menuUrl, {
      type: 'png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Upload QR code to S3
    const s3Key = `qr-codes/${restaurant.id}.png`;
    const s3Result = await uploadToS3(qrCodeBuffer, s3Key, 'image/png');

    console.log('QR Code uploaded to S3:', s3Result);

    if (!s3Result.success || !s3Result.url) {
      return NextResponse.json({ error: 'Failed to upload QR code to S3' }, { status: 500 });
    }

    // Update restaurant record with QR code URL
    const { data: updatedRestaurant, error: updateError } = await supabase
      .from('restaurants')
      .update({ 
        qr_code_url: s3Result.url,
        updated_at: new Date().toISOString()
      })
      .eq('id', restaurant.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update restaurant with QR code URL:', updateError);
      return NextResponse.json({ error: 'Failed to save QR code' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      qrCodeUrl: s3Result.url,
      menuUrl: menuUrl,
      restaurant: updatedRestaurant
    });

  } catch (error) {
    console.error('QR code generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate QR code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Create server client with cookies
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get restaurant record with QR code URL
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('email', user.email)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const menuUrl = `${baseUrl}/menu/${restaurant.id}`;

    return NextResponse.json({
      success: true,
      qrCodeUrl: restaurant.qr_code_url,
      menuUrl: menuUrl,
      hasQrCode: !!restaurant.qr_code_url
    });

  } catch (error) {
    console.error('QR code fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch QR code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}