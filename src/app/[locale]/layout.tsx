import type { ReactNode } from "react";
import { locales, defaultLocale, isRtl, type Locale } from "@/i18n.config";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const {locale} = await params
  const _locale: Locale = (locales as readonly string[]).includes(locale)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (locale as any)
    : defaultLocale;

  const dir = isRtl(_locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body>
        <div className="flex min-h-screen items-center justify-center font-sans dark:bg-black">
          <main className="flex min-h-screen w-full flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}