"use client";

import { useEffect, useRef, useState } from "react";
import { loadSmartCaptchaScript } from "@/src/libs/smartCaptchaLoader";

interface YandexSmartCaptchaProps {

  onChange: (token: string | null) => void;
  token: string | null;
  disabled?: boolean;
  /**
   * Selects which SmartCaptcha key to mount. "light" (default) uses the
   * standard key; "dark" uses the dark-themed key configured in the
   * Yandex Cloud console (theme is bound to the sitekey, not a render
   * param). Server-side `verifyCaptcha` must be called with the matching
   * variant or the token will be rejected.
   */
  variant?: "light" | "dark";
  /**
   * When true, forces Yandex's inner div + iframe to `width: 100%` so the
   * widget's dark card stretches to fill the parent's width. The slider
   * track itself stays at its design min-width and remains centered —
   * Yandex's HTML inside the iframe handles that responsively. Implemented
   * via the scoped global CSS rule `.smartcaptcha-host-stretched > div,
   * ... iframe` in globals.css.
   */
  fullWidth?: boolean;
}

/**
 * Visible Yandex SmartCaptcha slider widget. Shows the "Я не робот"
 * affordance and an adaptive slider/puzzle challenge that the user
 * solves by dragging. On success, a token is emitted via `onChange`;
 * on expiry/error the token is cleared.
 */
export function YandexSmartCaptcha({ onChange, token, disabled, variant = "light", fullWidth = false }: YandexSmartCaptchaProps) {
  const siteKey =
    variant === "dark"
      ? process.env.NEXT_PUBLIC_YANDEX_SMARTCAPTCHA_SITE_KEY_DARK
      : process.env.NEXT_PUBLIC_YANDEX_SMARTCAPTCHA_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  const tokenRef = useRef(token);
  const [error, setError] = useState<string | null>(
    siteKey ? null : "Сервис проверки не настроен. Свяжитесь с поддержкой.",
  );

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Mount the widget once. The form holds the token in its own state;
  // we surface success/expiry via onChange and never re-render the iframe
  // on every parent re-render.
  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;

    const mount = async () => {
      try {
        await loadSmartCaptchaScript();
      } catch {
        if (!cancelled) setError("Не удалось загрузить проверку. Обновите страницу.");
        return;
      }
      if (cancelled || !containerRef.current || !window.smartCaptcha) return;

      // Already rendered (StrictMode double-invoke guard).
      if (widgetIdRef.current !== null) return;

      widgetIdRef.current = window.smartCaptcha.render(containerRef.current, {
        sitekey: siteKey,
        hl: "ru",
        callback: (newToken: string) => {
          setError(null);
          onChangeRef.current(newToken);
        },
        "expired-callback": () => {
          setError("Срок действия проверки истёк. Подтвердите снова.");
          onChangeRef.current(null);
        },
        "error-callback": () => {
          setError("Не удалось пройти проверку. Попробуйте снова.");
          onChangeRef.current(null);
        },
      });
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
    };
  }, [siteKey]);

  // If the parent clears the token (e.g., on submit failure) and the
  // widget still holds a stale challenge, reset it so the user can
  // solve a fresh one.
  useEffect(() => {
    if (token === null && widgetIdRef.current !== null && window.smartCaptcha) {
      try {
        window.smartCaptcha.reset(widgetIdRef.current);
      } catch {
        // ignore
      }
    }
  }, [token]);

  return (
    <div className="flex flex-col gap-[6px]">
      <div
        className={
          "smartcaptcha-host flex flex-col" +
          (fullWidth ? " smartcaptcha-host-stretched" : " items-center")
        }
      >
        <div
          ref={containerRef}
          aria-disabled={disabled || undefined}
          style={{
            display: fullWidth ? "block" : "inline-block",
            width: fullWidth ? "100%" : "fit-content",
            maxWidth: "100%",
            ...(disabled ? { pointerEvents: "none", opacity: 0.6 } : null),
          }}
        />
        <p
          className={
            "mt-[8px] text-[12px] leading-[16px] text-center " +
            (variant === "dark" ? "text-white/70" : "text-[#0F1B2D]/60")
          }
        >
          Перетащите ползунок вправо, чтобы подтвердить, что вы не робот.
        </p>
      </div>
      {error && <p className="text-[12px] text-red-500 ml-[4px]">{error}</p>}
    </div>
  );
}
