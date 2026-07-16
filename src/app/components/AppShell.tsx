"use client";

import { usePathname } from "next/navigation";
import { locales } from "@/i18n.config";

import { Header as LegacyHeader } from "@/src/app/components/Header";
import { Footer as LegacyFooter } from "@/src/app/components/Footer";
import { Header } from "@/src/app/components/v2/header/header";
import { Footer } from "@/src/app/components/v2/footer/footer";
// import { CookieConsent } from "@/src/app/components/CookieConsent";
// import { SmartCaptchaLegalBadge } from "@/src/app/components/SmartCaptchaLegalBadge";
import { NextAuthProvider } from "@/src/app/providers/NextAuthProvider";
import { YandexCaptchaProvider } from "@/src/app/providers/YandexCaptchaProvider";
import { Toaster } from "@/src/app/components/ui/sonner";

const isRoute = (pathname: string, route: string) =>
  pathname === route || new RegExp(`^/[^/]+${route}(?:/|$)`).test(pathname);

const LOCALE_HOME_PATTERN = new RegExp(`^/(?:${locales.join("|")})/?$`);

const isHomeRoute = (pathname: string) =>
  pathname === "/" ||
  LOCALE_HOME_PATTERN.test(pathname) ||
  isRoute(pathname, "/v2-main-page");

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = isRoute(pathname, "/admin");
  const isAdminRequests = isRoute(pathname, "/admin/requests");
  const isLegacyAdminShell = isAdminPage && !isAdminRequests;
  const isHome = isHomeRoute(pathname);
  const contentClass =
    isHome || isLegacyAdminShell ? undefined : "v2-header-content-offset";

  if (isLegacyAdminShell) {
    return (
      <NextAuthProvider>
        <YandexCaptchaProvider>
          <LegacyHeader />
          {children}
          <LegacyFooter />
          {/* <SmartCaptchaLegalBadge /> */}
          <Toaster richColors position="top-right" />
        </YandexCaptchaProvider>
      </NextAuthProvider>
    );
  }

  return (
    <NextAuthProvider>
      <YandexCaptchaProvider>
        <Header mode="fixed" />
        <div className={contentClass}>{children}</div>
        <Footer />
        {/* <CookieConsent /> */}
        {/* <SmartCaptchaLegalBadge /> */}
        <Toaster richColors position="top-right" />
      </YandexCaptchaProvider>
    </NextAuthProvider>
  );
}
