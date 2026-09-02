/**
 * The card that appears when the link is pasted into LinkedIn, WhatsApp or
 * Slack. Generated from the same profile.json as the page, so the preview can
 * never drift from the site.
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
          background: "#d9d8d2",
          color: "#0b0b0b",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "#6b6a64",
          }}
        >
          <span>{profile.location}</span>
          <span>{profile.openToWork.blurb}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>
            {profile.name}
          </div>
          <div style={{ display: "flex", fontSize: 44, color: "#0b0b0b", marginTop: 10 }}>
            {profile.headline} — {profile.specialism}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#3d3d3a", marginTop: 22 }}>
            {profile.tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            fontSize: 22,
            color: "#6b6a64",
            borderTop: "1px solid #c1c0b8",
            paddingTop: 24,
          }}
        >
          {profile.coreAreas.slice(0, 7).join("  ·  ")}
        </div>
      </div>
    ),
    size,
  );
}
