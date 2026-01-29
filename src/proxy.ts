import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/i18n.config";

const PUBLIC_FILE = /\.[^/]+$/; // exclude files with extensions

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return;
  }

  const hasLocale = locales.some(
    (locale) =>
      pathname === "/" + locale || pathname.startsWith("/" + locale + "/")
  );
  if (!hasLocale) {
    console.log('redirect!!!')
    const locale = defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = "/" + locale + (pathname === "/" ? "" : pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    // Match all paths except the ones starting with these and files with an extension
    "/((?!api|_next|static|.*\\..*).*)",
  ],
};