/**
 * GET /api/profile — machine-readable "who is this person".
 *
 * Public and CORS-open by design: the point of the portfolio link is that a
 * recruiter's tooling, a scraper, or another agent can read the same facts the
 * page shows. Placeholders are stripped upstream, so anything here is real.
 */
import { NextResponse } from "next/server";

import { publicProfile } from "@/lib/profile";

export async function GET() {
  return NextResponse.json(
    {
      ...publicProfile(),
      _links: {
        self: "/api/profile",
        ask: "/api/ask",
        site: "/",
      },
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
