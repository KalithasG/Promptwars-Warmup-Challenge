import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { profile, real } from "@/lib/profile";
import "./globals.css";

// SF Pro is used where it exists (Apple platforms); Inter is the closest
// match everywhere else, so the type looks the same on Windows and Android.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

const name = real(profile.name) ?? "Portfolio";
const headline = real(profile.headline) ?? "";
const summary = real(profile.summary) ?? `${headline} — portfolio, work and contact details.`;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${name} — ${headline}`, template: `%s — ${name}` },
  description: summary,
  applicationName: name,
  authors: [{ name, url: profile.contact.linkedin }],
  creator: name,
  keywords: [headline, profile.specialism, ...profile.coreAreas],
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

// Tells the browser both appearances are supported, so form controls and
// scrollbars match the theme rather than staying light.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <head>
        {/* Applies a stored appearance before first paint. No attribute means
            "follow the system", which the stylesheet handles on its own. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('portfolio-theme');" +
              "if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
