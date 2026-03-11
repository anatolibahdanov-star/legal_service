import { MapPin, Phone, FileText } from 'lucide-react';

export function Yandex() {
    return (
        <>
            {/* Contact Info */}
            <div className="flex flex-wrap justify-center gap-8 mb-12 text-[#29282b]">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#87b7ce]" />
                <span className="font-['Inter:Regular',sans-serif] text-[16px]">г. Москва, ул. Юридическая, д. 1</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#87b7ce]" />
                <span className="font-['Inter:Regular',sans-serif] text-[16px]">+7 (999) 123-45-67</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#87b7ce]" />
                <span className="font-['Inter:Regular',sans-serif] text-[16px]">info@urconsult.ru</span>
              </div>
            </div>

            <div className="bg-white rounded-[24px] overflow-hidden shadow-lg border border-[#87b7ce]/20">
                <div className="h-full min-h-[500px]">
                    <iframe
                    src="https://yandex.ru/map-widget/v1/?um=constructor%3A5c9e1a0b0f0a0e0a0b0f0a0e0a0b0f0a&amp;source=constructor"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ minHeight: '500px' }}
                    title="Карта офиса"
                    className="w-full h-full"
                    />
                </div>
            </div>
        </>
    )
}