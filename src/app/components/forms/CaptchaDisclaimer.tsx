export function CaptchaDisclaimer() {
  return (
    <p className="text-[11px] leading-[14px] text-[#0F1B2D]/40 text-center">
      Сайт защищён reCAPTCHA. Применяются{" "}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-[#0F1B2D]/60"
      >
        Политика конфиденциальности
      </a>{" "}
      и{" "}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-[#0F1B2D]/60"
      >
        Условия использования
      </a>{" "}
      Google.
    </p>
  );
}
