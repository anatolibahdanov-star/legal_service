
import Image from 'next/image'
import { initI18next } from "@/src/app/i18n/server";
import type { Locale } from "@/i18n.config";

export default async function Home({
  params,
}: {
  params: { locale: Locale };
}) {
  const {locale} = await params
  const namespaces = ["translation", "home"] as const;

  const i18n = await initI18next(locale, [...namespaces]);
  const tHome = i18n.getFixedT(locale, "home");

  return (
    <>
        <div className="row">
            <div className="col-md-12">
                <div className="margin-b-40">
                    <p className="promo-block-text">
                      <Image
                        src="/site/lllms-logo.png"
                        width="200"
                        height="200"
                        className="d-inline-block align-top logo-img"
                        alt="LLLMS logo"
                      />
                    </p>
                    <h1>{tHome("phrase1")}</h1>
                </div>
            </div>
        </div>

        <div className="row">
            <div className="col-md-2"></div>
            <div className="col-md-8 content">
                Test LLLMS service. Main page.
            </div>
            <div className="col-md-2"></div>
        </div>
    </>
  );
}
