'use client'; 

import Image from 'next/image'
import {Yandex} from "@/src/app/components/ui/yandex"
import ContactForm from "@/src/app/components/forms/contact"

export default function ContactInfo() {

  return (
    <div className="bg-[#fefdf9] py-16 px-4">
      <div className="max-w-[1216px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[48px] leading-[57.6px] text-[#29282b] mb-4">Контакты</h2>
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[20px] leading-[32px] text-[#29282b]/70">
            Свяжитесь с нами удобным для вас способом
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact info */}
          <div className="bg-white rounded-[24px] p-8 shadow-lg border border-[#87b7ce]/20">
            <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[24px] text-[#29282b] mb-6">Наши контакты</h3>
            <div className="space-y-6">
              {/* Phones */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="size-[24px]" data-name="Icon">
                    <Image src="/design/phonef.svg" width={24} height={24} className="block size-full" alt="LLLMS Телефон" />
                  </div>
                  <div>
                    <p className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] mb-1">Телефоны</p>
                    <a href="tel:+79991234567" className="font-['Inter:Bold',sans-serif] font-bold text-[18px] text-[#29282b] hover:text-[#87b7ce] transition-colors">
                      +7 (999) 123-45-67
                    </a>
                  </div>
                </div>
                <div className="ml-[36px]">
                  <a href="tel:+74951234567" className="font-['Inter:Regular',sans-serif] text-[16px] text-[#29282b]/70 hover:text-[#87b7ce] transition-colors">
                    +7 (495) 123-45-67
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="size-[24px]" data-name="Icon">
                  <Image src="/design/email.png" width={24} height={24} className="block size-full" alt="LLLMS Email" />
                </div>
                <div>
                  <p className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] mb-1">Email</p>
                  <a href="mailto:info@urconsult.ru" className="font-['Inter:Bold',sans-serif] font-bold text-[18px] text-[#29282b] hover:text-[#87b7ce] transition-colors">
                    info@urconsult.ru
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="size-[24px]" data-name="Icon">
                  <Image
                    src="/design/nav.svg"
                    width={24}
                    height={24}
                    className="block size-full"
                    alt="LLLMS Навигация"
                  />
                </div>
                <div>
                  <p className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] mb-1">Адрес офиса</p>
                  <p className="font-['Inter:Bold',sans-serif] font-bold text-[18px] text-[#29282b] mb-2">
                    г. Москва, ул. Юридическая, д. 1
                  </p>
                  <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[#29282b]/60">
                    Метро Китай-город, 5 минут пешком
                  </p>
                  <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[#29282b]/60">
                    Пн-Пт: 9:00 - 19:00, Сб: 10:00 - 16:00
                  </p>
                </div>
              </div>

              {/* Social networks */}
              <div className="pt-6 border-t border-[#87b7ce]/20">
                <p className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#87b7ce] mb-4">Мессенджеры</p>
                <div className="flex gap-[10px]">
                  <a 
                    href="https://t.me/example" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative rounded-[33554400px] shrink-0 size-[40px] flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="Telegram"
                  >
                    <div className="relative shrink-0 size-[30px]" data-name="Icon">
                      <Image
                        src="/design/telegram.svg"
                        width={30}
                        height={30}
                        className="block size-full"
                        alt="LLLMS Telegram"
                      />
                    </div>
                  </a>
                  <a 
                    href="https://wa.me/79991234567" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative rounded-[33554400px] shrink-0 size-[40px] flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="WhatsApp"
                  >
                    <div className="relative shrink-0 size-[30px]" data-name="Icon">
                      <Image
                        src="/design/whatsapp.svg"
                        width={30}
                        height={30}
                        className="block size-full"
                        alt="LLLMS Telegram"
                      />
                    </div>
                  </a>
                  <a 
                    href="https://max.com/example" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative rounded-[33554400px] shrink-0 size-[40px] flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="Max"
                  >
                    <div className="relative shrink-0 size-[34px]" data-name="Icon">
                      <Image
                        src="/design/facebook.png"
                        width={34}
                        height={34}
                        className="block size-full"
                        alt="LLLMS Max"
                      />
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Any questions left? */}
          <ContactForm />
        </div>

        {/* Yandex map */}
        <Yandex />
      </div>
    </div>
  );
}