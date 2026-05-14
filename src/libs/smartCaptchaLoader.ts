/**
 * Shared loader for the Yandex SmartCaptcha JS SDK. The script self-registers
 * `window.smartCaptcha` once it loads; we de-duplicate concurrent loads and
 * cache the promise so every widget on the page reuses the same script tag.
 *
 * Docs: https://yandex.cloud/ru/docs/smartcaptcha/concepts/widget-methods
 */

interface SmartCaptchaWidgetParams {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  hl?: string;
  invisible?: boolean;
  hideShield?: boolean;
  test?: boolean;
}

interface SmartCaptchaGlobal {
  render: (container: HTMLElement | string, params: SmartCaptchaWidgetParams) => number;
  execute: (widgetId?: number) => void;
  reset: (widgetId?: number) => void;
  destroy: (widgetId?: number) => void;
  getResponse?: (widgetId?: number) => string;
  subscribe?: (
    widgetId: number,
    event: "success" | "challenge-visible" | "challenge-hidden" | "network-error" | "token-expired",
    callback: () => void,
  ) => void;
}

declare global {
  interface Window {
    smartCaptcha?: SmartCaptchaGlobal;
  }
}

const SCRIPT_SRC = "https://smartcaptcha.yandexcloud.net/captcha.js";

let loadPromise: Promise<void> | null = null;

export function loadSmartCaptchaScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.smartCaptcha) {
    return Promise.resolve();
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="${SCRIPT_SRC}"]`,
    );
    const onReady = () => {
      if (window.smartCaptcha) resolve();
      else reject(new Error("SmartCaptcha not initialised after script load"));
    };

    if (existing) {
      if (window.smartCaptcha) {
        resolve();
        return;
      }
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener(
        "error",
        () => {
          loadPromise = null;
          reject(new Error("SmartCaptcha script failed to load"));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", onReady, { once: true });
    script.addEventListener(
      "error",
      () => {
        loadPromise = null;
        reject(new Error("SmartCaptcha script failed to load"));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  return loadPromise;
}

export type { SmartCaptchaWidgetParams, SmartCaptchaGlobal };
