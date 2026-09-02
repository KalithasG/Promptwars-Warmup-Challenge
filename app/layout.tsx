import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { profile, real } from "@/lib/profile";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const name = real(profile.name) ?? "Portfolio";
const headline = real(profile.headline) ?? "";
const summary = real(profile.summary) ?? `${headline} — portfolio, work and contact details.`;

// Set NEXT_PUBLIC_SITE_URL in the host's env once deployed; the fallback only
// keeps local builds from emitting relative OG URLs, which crawlers reject.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${name} — ${headline}`,
    template: `%s — ${name}`,
  },
  description: summary,
  applicationName: name,
  authors: [{ name, url: profile.contact.linkedin }],
  creator: name,
  keywords: [headline, profile.specialism, ...profile.coreAreas],
  // The link unfurls into a card in LinkedIn, WhatsApp and Slack.
  openGraph: {
    type: "profile",
    url: siteUrl,
    title: `${name} — ${headline}`,
    description: summary,
    siteName: name,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${name} — ${headline}`,
    description: summary,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-page"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
