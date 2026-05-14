export function CaptchaDisclaimer() {
  return (
    <p className="text-[11px] leading-[14px] text-[#0F1B2D]/40 text-center">
      Сайт защищён Yandex SmartCaptcha. Применяются{" "}
      <a
        href="https://yandex.ru/legal/cloud_terms_smartcaptcha/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-[#0F1B2D]/60"
      >
        Условия использования
      </a>{" "}
      и{" "}
      <a
        href="https://yandex.ru/legal/confidential/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-[#0F1B2D]/60"
      >
        Политика конфиденциальности
      </a>{" "}
      Яндекса.
    </p>
  );
}
