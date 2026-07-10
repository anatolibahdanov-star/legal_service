export type LegalDocumentKey =
  | "privacy-policy"
  | "personal-data-consent"
  | "public-offer"
  | "recommendation-technologies"
  | "insurance-policy";

export interface LegalDocument {
  key: LegalDocumentKey;
  title: string;
  src: string;
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocument> = {
  "privacy-policy": {
    key: "privacy-policy",
    title: "Политика в отношении обработки персональных данных",
    src: "/docs/privacy-policy.pdf",
  },
  "personal-data-consent": {
    key: "personal-data-consent",
    title: "Согласие на обработку персональных данных",
    src: "/docs/personal-data-consent.pdf",
  },
  "public-offer": {
    key: "public-offer",
    title: "Условия публичной оферты",
    src: "/docs/public-offer.pdf",
  },
  "recommendation-technologies": {
    key: "recommendation-technologies",
    title: "Рекомендательные технологии",
    src: "/docs/recommendation-technologies.pdf",
  },
  "insurance-policy": {
    key: "insurance-policy",
    title: "Полис страхования ЭНКИ",
    src: "/docs/insurance-policy.pdf",
  },
};
