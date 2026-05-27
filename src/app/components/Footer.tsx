"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import Image from "next/image";
import { PdfDocumentModal } from "@/src/app/components/PdfDocumentModal";
import {
  LEGAL_DOCUMENTS,
  type LegalDocumentKey,
} from "@/src/app/components/legalDocuments";

export function Footer() {
  const [openDoc, setOpenDoc] = useState<LegalDocumentKey | null>(null);

  const handleOpen = (key: LegalDocumentKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenDoc(key);
  };

  return (
    <>
      <footer id="contact" className="bg-[#3d4b5e] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* About the company */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/design/logowhite.svg"
                  width={36}
                  height={36}
                  className="w-9 h-9 object-contain"
                  alt="ЭНКИ"
                />
                <div>
                  <h3 className="text-lg font-bold">ЭНКИ</h3>
                  <p className="text-xs text-white/60">Быстрая юридическая помощь онлайн.</p>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                ©2026 гг. ЭНКИ
                <br />
                Все права защищены
              </p>
            </div>

            {/* Company legal info */}
            <div>
              <h3 className="text-lg font-bold mb-4">Реквизиты</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>ООО «ЭНКИ-Л»</li>
                <li>ОГРН: 1267700058130</li>
                <li>ИНН: 9704269974</li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#8faaba] shrink-0" />
                  <a
                    href="mailto:contact@enki.legal"
                    className="hover:text-white transition-colors"
                  >
                    contact@enki.legal
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal documents */}
            <div>
              <h3 className="text-lg font-bold mb-4">Документы</h3>
              <ul className="space-y-2 text-sm">
                {(
                  [
                    "privacy-policy",
                    "personal-data-consent",
                    "public-offer",
                  ] as LegalDocumentKey[]
                ).map((key) => (
                  <li key={key}>
                    <a
                      href={LEGAL_DOCUMENTS[key].src}
                      onClick={handleOpen(key)}
                      className="text-white/70 hover:text-white underline-offset-2 hover:underline transition-colors"
                    >
                      {LEGAL_DOCUMENTS[key].title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <PdfDocumentModal
        open={openDoc !== null}
        title={openDoc ? LEGAL_DOCUMENTS[openDoc].title : ""}
        src={openDoc ? LEGAL_DOCUMENTS[openDoc].src : ""}
        onClose={() => setOpenDoc(null)}
      />
    </>
  );
}
