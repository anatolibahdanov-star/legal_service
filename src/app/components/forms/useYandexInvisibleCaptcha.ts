"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadSmartCaptchaScript } from "@/src/libs/smartCaptchaLoader";

type PendingPromise = {
  resolve: (token: string) => void;
  reject: (reason: Error) => void;
};

const EXECUTE_TIMEOUT_MS = 60_000;

interface UseYandexInvisibleCaptchaOptions {
  /**
   * Selects which SmartCaptcha key to mount. "light" (default) uses the
   * standard key; "dark" uses the dark-themed key. The challenge popup
   * (when shown) inherits the key's theme. Server-side `verifyCaptcha`
   * must be called with the matching variant or the token will be rejected.
   */
  variant?: "light" | "dark";
}

/**
 * Mounts an invisible Yandex SmartCaptcha widget once per consumer and
 * exposes `execute()` for silent on-demand token issuance (e.g. OTP resend).
 * The widget shows a challenge popup only when Yandex decides verification
 * is required — otherwise it returns a token in the background.
 */
export function useYandexInvisibleCaptcha({ variant = "light" }: UseYandexInvisibleCaptchaOptions = {}) {
  const widgetIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingRef = useRef<PendingPromise | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const siteKey =
      variant === "dark"
        ? process.env.NEXT_PUBLIC_YANDEX_SMARTCAPTCHA_SITE_KEY_DARK
        : process.env.NEXT_PUBLIC_YANDEX_SMARTCAPTCHA_SITE_KEY;
    if (!siteKey) return;

    let cancelled = false;
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.bottom = "0";
    container.style.left = "0";
    container.style.zIndex = "9999";
    container.style.pointerEvents = "auto";
    document.body.appendChild(container);
    containerRef.current = container;

    const mount = async () => {
      try {
        await loadSmartCaptchaScript();
      } catch {
        return;
      }
      if (cancelled || !window.smartCaptcha || !containerRef.current) return;
      if (widgetIdRef.current !== null) return;

      try {
        widgetIdRef.current = window.smartCaptcha.render(containerRef.current, {
          sitekey: siteKey,
          invisible: true,
          hl: "ru",
          callback: (token: string) => {
            const pending = pendingRef.current;
            pendingRef.current = null;
            pending?.resolve(token);
          },
          "error-callback": () => {
            const pending = pendingRef.current;
            pendingRef.current = null;
            pending?.reject(new Error("captcha_error"));
          },
        });
        setReady(true);
      } catch (err) {
        console.error("[SmartCaptcha invisible] render failed:", err);
      }
    };

    void mount();

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.smartCaptcha) {
        try {
          window.smartCaptcha.destroy(widgetIdRef.current);
        } catch {
          // ignore — widget may already be gone
        }
        widgetIdRef.current = null;
      }
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
      }
      containerRef.current = null;
      const pending = pendingRef.current;
      pendingRef.current = null;
      pending?.reject(new Error("captcha_unmounted"));
    };
  }, [variant]);

  const execute = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (widgetIdRef.current === null || !window.smartCaptcha) {
        reject(new Error("captcha_not_ready"));
        return;
      }
      if (pendingRef.current) {
        pendingRef.current.reject(new Error("captcha_superseded"));
      }
      const timeout = setTimeout(() => {
        if (pendingRef.current === wrapped) {
          pendingRef.current = null;
          reject(new Error("captcha_timeout"));
        }
      }, EXECUTE_TIMEOUT_MS);
      const wrapped: PendingPromise = {
        resolve: (token) => {
          clearTimeout(timeout);
          resolve(token);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      };
      pendingRef.current = wrapped;
      try {
        window.smartCaptcha.reset(widgetIdRef.current);
        window.smartCaptcha.execute(widgetIdRef.current);
      } catch (err) {
        pendingRef.current = null;
        clearTimeout(timeout);
        reject(err as Error);
      }
    });
  }, []);

  return { execute, ready };
}
