import "./globals.css";
import '@/src/styles/index.css';
import "./enki.css";
import { AppShell } from "@/src/app/components/AppShell";

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
