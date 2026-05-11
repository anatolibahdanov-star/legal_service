'use client'; 

import "./globals.css";
// import Header from "@/src/components/Header";
import { Header } from "@/src/app/components/Header";
// import Footer from "@/src/components/Footer";
import { Footer } from "@/src/app/components/Footer";
import {NextAuthProvider} from "@/src/app/providers/NextAuthProvider"
import {RecaptchaProvider} from "@/src/app/providers/RecaptchaProvider"
import '@/src/styles/index.css';
import "./enki.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <div className="min-h-screen bg-[#fefdf9]">
          <NextAuthProvider>
            <RecaptchaProvider>
              <Header />
              {children}
              <Footer />
            </RecaptchaProvider>
          </NextAuthProvider>
        </div>
      </body>
    </html>
  );
}
