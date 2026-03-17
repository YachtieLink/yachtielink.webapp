import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { CookieBanner } from "@/components/CookieBanner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});


export const metadata: Metadata = {
  title: "YachtieLink — Crew Profiles & Endorsements",
  description:
    "Build your portable yachting profile anchored to real employment history. Get endorsed by crew you've actually worked with.",
  metadataBase: new URL("https://yachtie.link"),
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "YachtieLink",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        Inline script applies dark/light class before first paint to avoid
        flash of wrong theme. Reads from localStorage; falls back to system pref.
      */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var stored = localStorage.getItem('yl-theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${dmSans.variable} antialiased`}
      >
        <PostHogProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
          <CookieBanner />
        </PostHogProvider>
      </body>
    </html>
  );
}
