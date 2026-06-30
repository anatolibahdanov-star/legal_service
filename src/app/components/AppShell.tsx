"use client";

import { usePathname } from "next/navigation";

import { Header } from "@/src/app/components/v2/header/header";
import { Footer } from "@/src/app/components/v2/footer/footer";
import { CookieConsent } from "@/src/app/components/CookieConsent";
import { SmartCaptchaLegalBadge } from "@/src/app/components/SmartCaptchaLegalBadge";
import { NextAuthProvider } from "@/src/app/providers/NextAuthProvider";
import { YandexCaptchaProvider } from "@/src/app/providers/YandexCaptchaProvider";
import { Toaster } from "@/src/app/components/ui/sonner";

const isRoute = (pathname: string, route: string) =>
  pathname === route || new RegExp(`^/[^/]+${route}(?:/|$)`).test(pathname);

const isHomeRoute = (pathname: string) =>
  pathname === "/" ||
  /^\/[^/]+\/?$/.test(pathname) ||
  isRoute(pathname, "/v2-main-page");

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = isRoute(pathname, "/admin");
  const isProfilePage = isRoute(pathname, "/profile");
  const headerMode = isProfilePage ? "static" : isHomeRoute(pathname) ? "fixed" : "sticky";

  return (
    <NextAuthProvider>
      <YandexCaptchaProvider>
        {!isAdminPage && <Header mode={headerMode} />}
        {children}
        {!isAdminPage && <Footer />}
        <CookieConsent />
        <SmartCaptchaLegalBadge />
        <Toaster richColors position="top-right" />
      </YandexCaptchaProvider>
    </NextAuthProvider>
  );
}
