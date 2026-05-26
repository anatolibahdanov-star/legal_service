import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/i18n.config";

const PUBLIC_FILE = /\.[^/]+$/; // exclude files with extensions

// Locale auto-redirect to "/en" disabled per product spec — users must stay on
// the URL they requested. We still need to serve the default-locale content for
// non-prefixed paths, so the proxy now rewrites (not redirects) "/" and other
// bare paths to the [locale] segment without changing the visible URL.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/login") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return;
  }

  const hasLocale = locales.some(
    (locale) =>
      pathname === "/" + locale || pathname.startsWith("/" + locale + "/")
  );
  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = "/" + defaultLocale + (pathname === "/" ? "" : pathname);
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: [
    // Match all paths except the ones starting with these and files with an extension
    "/((?!api|_next|static|login|.*\\..*).*)",
  ],
};