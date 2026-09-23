import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthUser } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import type { SupabaseClient } from '@supabase/supabase-js';

const MOMENTS_BUCKET = 'moments-photos';

// The bucket is public, so whatever lands in it is served to anyone with the
// URL under the content type we hand to Storage. Without an allowlist that
// makes this an open file host: an upload declaring itself text/html or
// image/svg+xml gets served as such. Restrict to raster images and derive the
// extension from the verified type rather than the user's filename.
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
};
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

const UPLOADS_PER_WINDOW = 20;
const UPLOAD_WINDOW_SECONDS = 60 * 60;

type MomentRow = {
  id: string;
  bubble_id: string | null;
  user_id: string | null;
  cloudinary_url: string | null;
  caption: string | null;
  created_at: string;
};

function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '✨';
  return (
    trimmed
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '✨'
  );
}

/** Join meetup_photos rows with bubbles/users for feed display. */
async function formatMoments(admin: SupabaseClient, rows: MomentRow[]) {
  const bubbleIds = [...new Set(rows.map((m) => m.bubble_id).filter((v): v is string => !!v))];
  const userIds = [...new Set(rows.map((m) => m.user_id).filter((v): v is string => !!v))];

  const bubblesById = new Map<string, { activity?: string; zone?: string; exact_location?: string | null }>();
  const usersById = new Map<string, { name?: string | null }>();

  if (bubbleIds.length > 0) {
    const { data: bubbles } = await admin.from('bubbles').select('id, activity, zone, exact_location').in('id', bubbleIds);
    for (const b of bubbles ?? []) bubblesById.set(b.id, b);
  }

  if (userIds.length > 0) {
    const { data: users } = await admin.from('users').select('id, name').in('id', userIds);
    for (const u of users ?? []) usersById.set(u.id, u);
  }

  return rows.map((m) => {
    const bubble = m.bubble_id ? bubblesById.get(m.bubble_id) : undefined;
    const user = m.user_id ? usersById.get(m.user_id) : undefined;
    const displayName = user?.name?.trim() || 'Wanderer';

    return {
      id: m.id,
      bubble_id: m.bubble_id,
      user_id: m.user_id,
      cloudinary_url: m.cloudinary_url,
      image_url: m.cloudinary_url,
      caption: m.caption,
      created_at: m.created_at,
      activity: bubble?.activity || 'Campus moment',
      zone: bubble?.zone || bubble?.exact_location || null,
      username: displayName,
      user_avatar: initialsFromName(displayName),
    };
  });
}

/**
 * Create the public moments-photos bucket if it doesn't already exist.
 *
 * Memoised for the lifetime of the process: the bucket only needs creating
 * once ever, but this used to cost a Storage round trip on every single
 * upload. Cached per warm lambda instance, so the check happens roughly once
 * per instance instead.
 */
let bucketReady: Promise<void> | null = null;

async function ensureMomentsBucket(admin: SupabaseClient) {
  bucketReady ??= (async () => {
    const { data: existing } = await admin.storage.getBucket(MOMENTS_BUCKET);
    if (existing) return;

    const { error } = await admin.storage.createBucket(MOMENTS_BUCKET, {
      public: true,
      fileSizeLimit: MAX_PHOTO_BYTES,
      // Second line of defence behind the check in POST, and it also covers a
      // bucket created by hand in the dashboard.
      allowedMimeTypes: Object.keys(ALLOWED_IMAGE_TYPES),
    });
    // Ignore a race where another request created it first.
    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`Could not create storage bucket: ${error.message}`);
    }
  })();

  try {
    await bucketReady;
  } catch (err) {
    // Don't cache a transient failure - the next upload should retry.
    bucketReady = null;
    throw err;
  }
}

/**
 * GET /api/moments - List Wander Moments (meetup_photos) for feed.
 * Auth required - these are real students' photos, captions, and names.
 * Ordered newest first, limited to 20.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: moments, error } = await admin
      .from('meetup_photos')
      .select('id, bubble_id, user_id, cloudinary_url, caption, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const data = await formatMoments(admin, moments ?? []);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

/**
 * POST /api/moments - Create a Wander Moment: upload a photo to Supabase
 * Storage (moments-photos, public bucket) and insert a meetup_photos row.
 * Auth + bubble membership required. Photo is optional - a caption-only
 * moment is still allowed (cloudinary_url stays null).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }

    if (!(await checkRateLimit('moment-create', user.id, UPLOADS_PER_WINDOW, UPLOAD_WINDOW_SECONDS))) {
      return rateLimitResponse();
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ success: false, error: 'multipart/form-data body required' }, { status: 400 });
    }

    const bubble_id = (formData.get('bubble_id') ?? '').toString().trim();
    const caption = (formData.get('caption') ?? '').toString().trim();
    const photo = formData.get('photo');

    if (!bubble_id) {
      return NextResponse.json({ success: false, error: 'bubble_id required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: membership } = await admin
      .from('bubble_members')
      .select('user_id')
      .eq('bubble_id', bubble_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ success: false, error: 'Not a member of this bubble' }, { status: 403 });
    }

    let cloudinary_url: string | null = null;
    let uploadedPath: string | null = null;

    if (photo instanceof File && photo.size > 0) {
      const contentType = photo.type.toLowerCase();
      const ext = ALLOWED_IMAGE_TYPES[contentType];
      if (!ext) {
        return NextResponse.json(
          { success: false, error: 'Photo must be a JPEG, PNG, WebP, GIF, or HEIC image' },
          { status: 400 }
        );
      }
      // Checked before arrayBuffer() so an oversized upload is rejected rather
      // than being pulled into the function's memory first.
      if (photo.size > MAX_PHOTO_BYTES) {
        return NextResponse.json(
          { success: false, error: `Photo must be ${MAX_PHOTO_BYTES / (1024 * 1024)}MB or smaller` },
          { status: 400 }
        );
      }

      await ensureMomentsBucket(admin);

      const path = `${bubble_id}/${user.id}/${Date.now()}.${ext}`;

      const bytes = new Uint8Array(await photo.arrayBuffer());
      const { error: uploadError } = await admin.storage
        .from(MOMENTS_BUCKET)
        .upload(path, bytes, { contentType, upsert: false });

      if (uploadError) {
        return NextResponse.json({ success: false, error: `Photo upload failed: ${uploadError.message}` }, { status: 500 });
      }

      uploadedPath = path;
      const { data: pub } = admin.storage.from(MOMENTS_BUCKET).getPublicUrl(path);
      cloudinary_url = pub.publicUrl;
    }

    const { data: inserted, error: insertError } = await admin
      .from('meetup_photos')
      .insert({
        bubble_id,
        user_id: user.id,
        cloudinary_url,
        caption: caption || null,
      })
      .select('id, bubble_id, user_id, cloudinary_url, caption, created_at')
      .single();

    if (insertError || !inserted) {
      // The upload happened first, so a failed insert would otherwise leave a
      // file in the bucket that nothing references and nothing will ever
      // clean up.
      if (uploadedPath) {
        await admin.storage.from(MOMENTS_BUCKET).remove([uploadedPath]);
      }
      return NextResponse.json(
        { success: false, error: insertError?.message ?? 'Failed to save moment' },
        { status: 500 }
      );
    }

    const [formatted] = await formatMoments(admin, [inserted]);
    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 400 }
    );
  }
}
