import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/media/upload
 * Remote moment photo upload has been removed.
 * End-event flow should confirm the bubble without cloud upload.
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Photo upload is disabled. You can still end the event and save photos to your device.",
      code: "UPLOAD_DISABLED",
    },
    { status: 410 }
  );
}
