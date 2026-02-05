'use client'; 

import Image from 'next/image'
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
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
                    <h1>{t("phrase1")} 22222</h1>
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
