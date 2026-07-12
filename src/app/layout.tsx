import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
import '@/src/styles/index.css';
import "./enki.css";
import { AppShell } from "@/src/app/components/AppShell";

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicon-196x196.png", sizes: "196x196", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  applicationName: "ENKI",
  other: {
    "msapplication-TileColor": "#FFFFFF",
    "msapplication-TileImage": "/favicon-196x196.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <div className="min-h-screen bg-[#fefdf9]">
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
