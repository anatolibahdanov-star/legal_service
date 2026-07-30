"use client";

import { usePathname } from "next/navigation";
import { locales } from "@/i18n.config";

import { Header } from "@/src/app/components/v2/header/header";
import { Footer } from "@/src/app/components/v2/footer/footer";
// import { CookieConsent } from "@/src/app/components/CookieConsent";
// import { SmartCaptchaLegalBadge } from "@/src/app/components/SmartCaptchaLegalBadge";
import { NextAuthProvider } from "@/src/app/providers/NextAuthProvider";
import { YandexCaptchaProvider } from "@/src/app/providers/YandexCaptchaProvider";
import { Toaster } from "@/src/app/components/ui/sonner";

const isRoute = (pathname: string, route: string) =>
  pathname === route ||
  pathname.startsWith(`${route}/`) ||
  new RegExp(`^/(?:${locales.join("|")})${route}(?:/|$)`).test(pathname);

const LOCALE_HOME_PATTERN = new RegExp(`^/(?:${locales.join("|")})/?$`);

const isHomeRoute = (pathname: string) =>
  pathname === "/" ||
  LOCALE_HOME_PATTERN.test(pathname) ||
  isRoute(pathname, "/v2-main-page");

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRequests = isRoute(pathname, "/admin/requests");
  // Full-width flat header only for react-admin (/admin), not lawyer UI (/admin/requests)
  const isReactAdmin = isRoute(pathname, "/admin") && !isAdminRequests;
  const isHome = isHomeRoute(pathname);
  const contentClass = isHome ? undefined : "v2-header-content-offset";

  return (
    <NextAuthProvider>
      <YandexCaptchaProvider>
        <Header mode="fixed" flush={isReactAdmin} />
        <div className={contentClass}>{children}</div>
        <Footer />
        {/* <CookieConsent /> */}
        {/* <SmartCaptchaLegalBadge /> */}
        <Toaster richColors position="top-right" />
      </YandexCaptchaProvider>
    </NextAuthProvider>
  );
}
