import { NextResponse } from "next/server";

/** GET /api/hello - demo endpoint to confirm API is reachable (e.g. health check). */
export async function GET() {
  return NextResponse.json({ message: "Hello from Next.js API" });
}
