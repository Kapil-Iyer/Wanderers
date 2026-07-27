import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAuthUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Configure cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOW_UPLOAD_WITHOUT_AUTH = process.env.ALLOW_UPLOAD_WITHOUT_AUTH === 'true';

export async function POST(request: NextRequest) {
  try {
    let user: { id: string } | null = await getAuthUser(request);
    if (!user && ALLOW_UPLOAD_WITHOUT_AUTH) {
      user = { id: '00000000-0000-0000-0000-000000000000' } as { id: string };
    }
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthenticated. Sign in to upload, or set ALLOW_UPLOAD_WITHOUT_AUTH=true in .env.local to test.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { image, activity, location, date, memberCount, filterStyle, bubble_id } = body ?? {};

    if (!bubble_id && !ALLOW_UPLOAD_WITHOUT_AUTH) {
      return NextResponse.json(
        { success: false, error: 'bubble_id required' },
        { status: 400 }
      );
    }

    if (!ALLOW_UPLOAD_WITHOUT_AUTH) {
      const admin = getSupabaseAdmin();
      const { data: membership } = await admin
        .from('bubble_members')
        .select('user_id')
        .eq('bubble_id', bubble_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json(
          { success: false, error: 'Join this bubble from the Map first (tap Join Bubble), then you can save and post a moment when you end the event.' },
          { status: 403 }
        );
      }
    }

    // Validate request body
    if (!image || !activity || !location || !date || memberCount === undefined || !filterStyle) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: image, activity, location, date, memberCount, filterStyle' },
        { status: 400 }
      );
    }

    // Cloudinary effect: apply grayscale or sepia in the first transformation step
    const baseTransform: Record<string, unknown> = { width: 500, height: 500, crop: 'fill' };
    if (filterStyle === 'grayscale') {
      baseTransform.effect = 'grayscale';
    } else if (filterStyle === 'sepia') {
      baseTransform.effect = 'sepia';
    }

    // Upload to Cloudinary (accepts data URL: data:image/...;base64,...)
    let uploadResponse: { secure_url: string };
    try {
      uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'meetups/polaroids',
        transformation: [
        // 1. Base transform (crop + optional filter)
        baseTransform,
        
        // 2. Add a 20px solid dark border (matches the app's dark theme)
        { border: '20px_solid_rgb:140f0a' },

        // 3. Pad the bottom with dark space to a total height of 750px
        // Since image was 500x500, adding a 20px border makes it 540x540.
        // We set height to 750, crop to pad, and gravity to north so padding goes to the bottom.
        { width: 540, height: 750, crop: 'pad', background: 'rgb:140f0a', gravity: 'north' },

        // 4. Overlay the 4 lines of text in the bottom padded area perfectly centered
        // We stack them using gravity: 'north' with an offset (y)
        {
          overlay: { font_family: 'Montserrat', font_size: 38, font_weight: 'bold', text: `${activity} %40 ${location}` },
          color: 'white',
          gravity: 'north',
          y: 560
        },
        {
          overlay: { font_family: 'Roboto', font_size: 20, font_weight: 'normal', text: date },
          color: 'lightgray',
          gravity: 'north',
          y: 615
        },
        {
          overlay: { font_family: 'Montserrat', font_size: 22, font_weight: 'bold', text: `${memberCount} wanderers joined here` },
          color: 'white',
          gravity: 'north',
          y: 655
        },
        {
          // Cloudinary requires URL-encoding for # (%23)
          overlay: { font_family: 'Caveat', font_size: 28, text: '%23wandermoment' },
          color: '#FF5722',
          gravity: 'north',
          y: 695
        }
      ]
      });
    } catch (uploadErr: unknown) {
      const msg = uploadErr instanceof Error ? uploadErr.message : 'Cloudinary upload failed';
      console.error('Cloudinary upload error:', uploadErr);
      return NextResponse.json(
        { success: false, error: msg },
        { status: 500 }
      );
    }

    const cloudinary_url = uploadResponse.secure_url;

    if (!ALLOW_UPLOAD_WITHOUT_AUTH && bubble_id) {
      const admin = getSupabaseAdmin();
      const { error: insertError } = await admin.from('meetup_photos').insert({
        bubble_id,
        user_id: user.id,
        cloudinary_url,
      });

      if (insertError) {
        console.error('meetup_photos insert error:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to save moment' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: { cloudinary_url },
    });
  } catch (error: unknown) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error occurred during file upload' },
      { status: 500 }
    );
  }
}
