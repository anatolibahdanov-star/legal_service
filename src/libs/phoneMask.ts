export const PHONE_MASK_TEMPLATE = "+7 (___) ___-__-__";

export const formatPhoneInput = (raw: string): string => {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (!digits.startsWith("7")) digits = "7" + digits;
  digits = digits.slice(0, 11);
  const rest = digits.slice(1);
  let out = "+7";
  if (rest.length >= 1) out += " (" + rest.slice(0, 3);
  if (rest.length >= 4) out += ") " + rest.slice(3, 6);
  if (rest.length >= 7) out += "-" + rest.slice(6, 8);
  if (rest.length >= 9) out += "-" + rest.slice(8, 10);
  return out;
};

export const isPhoneComplete = (formatted: string): boolean => {
  const digits = formatted.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("7");
};
