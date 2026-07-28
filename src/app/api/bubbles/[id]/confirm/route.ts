import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/** POST /api/bubbles/[id]/confirm - End event: set bubble status to expired. Auth + membership required. No photo logic. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthenticated' },
        { status: 401 }
      );
    }

    const { id: bubbleId } = await params;
    if (!bubbleId) {
      return NextResponse.json(
        { success: false, error: 'Bubble ID is required' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: membership } = await admin
      .from('bubble_members')
      .select('user_id')
      .eq('bubble_id', bubbleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Not a member of this bubble' },
        { status: 403 }
      );
    }

    const { error } = await admin
      .from('bubbles')
      .update({ status: 'expired' })
      .eq('id', bubbleId);

    if (error) {
      console.error('Error updating bubble status:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update bubble status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in bubble completion route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
