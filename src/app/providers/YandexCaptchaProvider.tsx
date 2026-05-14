"use client";

import { ReactNode } from "react";
import Script from "next/script";

export const YandexCaptchaProvider = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Script
        id="yandex-smartcaptcha"
        src="https://smartcaptcha.yandexcloud.net/captcha.js?render=onload"
        strategy="afterInteractive"
      />
      {children}
    </>
  );
};
