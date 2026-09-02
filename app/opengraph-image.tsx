/**
 * The link-preview card. Generated from the same profile.json as the page, so
 * the preview can never drift from the site.
 */
import { ImageResponse } from "next/og";

import { profile } from "@/lib/profile";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${profile.name} — ${profile.headline}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#ffffff",
          color: "#1d1d1f",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, color: "#0071e3", fontWeight: 600 }}>
          {profile.openToWork.blurb}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: -3,
              lineHeight: 1.05,
            }}
          >
            {profile.name}
          </div>
          <div style={{ display: "flex", fontSize: 46, color: "#6e6e73", marginTop: 12 }}>
            {profile.headline} · {profile.specialism}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#86868b",
            borderTop: "1px solid rgba(0,0,0,0.12)",
            paddingTop: 24,
          }}
        >
          {profile.location}   ·   {profile.coreAreas.slice(0, 6).join("  ·  ")}
        </div>
      </div>
    ),
    size,
  );
}
