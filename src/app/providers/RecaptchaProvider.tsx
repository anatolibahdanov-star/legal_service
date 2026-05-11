"use client";

import { ReactNode } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export const RecaptchaProvider = ({ children }: { children: ReactNode }) => {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return <>{children}</>;
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{ async: true, defer: true, appendTo: "head" }}
      container={{ parameters: { badge: "bottomright" } }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
};
