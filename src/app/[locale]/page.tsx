
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
    <div className="flex min-h-screen items-center justify-center font-sans dark:bg-black">
      <main className="flex min-h-screen w-full flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        
        <div className="row">
            <div className="col-md-12">
                <div className="margin-b-40">
                    <p className="promo-block-text">
                      <Image
                        src="/site/logo_web.png"
                        width="375"
                        height="150"
                        className="d-inline-block align-top logo-img"
                        alt="React Bootstrap logo"
                      />
                    </p>
                    <h1>{tHome("phrase1")}</h1>
                </div>
            </div>
        </div>

        <div className="row">
            <div className="col-md-2"></div>
            <div className="col-md-8 content">
                We are a reliable partner in the field of web solutions development. With over 10 years of experience in providing quality software development services, we are committed to delivering effective products for your business.

    Our team of skilled professionals utilizes cutting-edge advanced IT technologies and our own development standards to create custom web solutions that meet your unique needs. <br/>
    Whether you need a simple landing page, an information web portal, or a large online store, we have the expertise to deliver a solution that exceeds your expectations.<br/>

    Contact us today to learn more about our web solutions development services and how we can help you achieve your goals. 
            </div>
            <div className="col-md-2"></div>
        </div>

        <div className="row">
            <div className="col-md-12">
                <h5> We look forward to hearing from you!</h5>
                <a href="https://t.me/Nadya_Bohdanova">
                  <Image
                    src="/site/telegram.png"
                    width="35"
                    height="35"
                    className="d-inline-block align-top"
                    alt="Telegram webeasysoft link"
                  />
                </a>
                <a href="https://wa.me/375293114271">
                  <Image
                    src="/site/whatsapp.png"
                    width="35"
                    height="35"
                    className="d-inline-block align-top"
                    alt="Whatsapp webeasysoft link"
                  />
                </a><br/>
                <a href="mailto:contact@webeasysoft.com">contact@webeasysoft.com</a> 
            </div>
        </div>
      </main>
    </div>
  );
}
