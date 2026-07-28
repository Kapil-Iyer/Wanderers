import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/** GET /api/moments - List Wander Moments (meetup_photos) for feed. No auth required. */
export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data: moments, error } = await admin
      .from('meetup_photos')
      .select('id, bubble_id, user_id, cloudinary_url, caption, created_at')
      .order('created_at', { ascending: false })
      .limit(24);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = moments ?? [];
    const bubbleIds = [...new Set(rows.map((m) => m.bubble_id).filter(Boolean))];
    const userIds = [...new Set(rows.map((m) => m.user_id).filter(Boolean))];

    const bubblesById = new Map<
      string,
      { activity?: string; zone?: string; exact_location?: string | null }
    >();
    const usersById = new Map<string, { name?: string | null }>();

    if (bubbleIds.length > 0) {
      const { data: bubbles } = await admin
        .from('bubbles')
        .select('id, activity, zone, exact_location')
        .in('id', bubbleIds);
      for (const b of bubbles ?? []) {
        bubblesById.set(b.id, b);
      }
    }

    if (userIds.length > 0) {
      const { data: users } = await admin
        .from('users')
        .select('id, name')
        .in('id', userIds);
      for (const u of users ?? []) {
        usersById.set(u.id, u);
      }
    }

    const data = rows.map((m) => {
      const bubble = m.bubble_id ? bubblesById.get(m.bubble_id) : undefined;
      const user = m.user_id ? usersById.get(m.user_id) : undefined;
      const displayName = user?.name?.trim() || 'Wanderer';
      const initials =
        displayName
          .split(/\s+/)
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || '✨';

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
        user_avatar: initials,
      };
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
