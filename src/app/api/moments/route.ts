import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthUser } from '@/lib/auth';
import type { SupabaseClient } from '@supabase/supabase-js';

const MOMENTS_BUCKET = 'moments-photos';

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

/** Create the public moments-photos bucket if it doesn't already exist. */
async function ensureMomentsBucket(admin: SupabaseClient) {
  const { data: existing } = await admin.storage.getBucket(MOMENTS_BUCKET);
  if (existing) return;

  const { error } = await admin.storage.createBucket(MOMENTS_BUCKET, {
    public: true,
    fileSizeLimit: '10MB',
  });
  // Ignore a race where another request created it first.
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Could not create storage bucket: ${error.message}`);
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

    if (photo instanceof File && photo.size > 0) {
      await ensureMomentsBucket(admin);

      const extMatch = /\.([a-zA-Z0-9]+)$/.exec(photo.name);
      const ext = (extMatch?.[1] || photo.type.split('/')[1] || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${bubble_id}/${user.id}/${Date.now()}.${ext}`;

      const bytes = new Uint8Array(await photo.arrayBuffer());
      const { error: uploadError } = await admin.storage
        .from(MOMENTS_BUCKET)
        .upload(path, bytes, { contentType: photo.type || 'image/jpeg', upsert: false });

      if (uploadError) {
        return NextResponse.json({ success: false, error: `Photo upload failed: ${uploadError.message}` }, { status: 500 });
      }

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
