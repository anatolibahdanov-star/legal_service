'use client';
import Image from 'next/image'
import RequestForm from "@/src/app/components/forms/request"


export function Hero() {

  return (
    <section className="bg-[#fefdf9] pt-[20px] pb-[20px] lg:pt-[20px] lg:pb-[20px] rounded-b-[60px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-5 items-center">
          {/* Left side — description */}
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#252623] leading-[1.1]">
              Задавайте вопросы опытным юристам <span className="text-[#8faaba] whitespace-nowrap">онлайн</span>.
            </h1>
            
            <p className="text-xl text-[#29282b]">
              Онлайн-консультации юристов для решения правовых вопросов в повседневных и нестандартных ситуациях.
            </p>
            
            <p className="text-2xl text-[#8faaba] font-semibold">
              Анонимно, безопасно и без личного визита к юристу.
            </p>

            <div className="bg-[#fefdf9] rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <Image
                    src="/design/femida.png"
                    width={500}
                    height={298}
                    className="w-64 h-auto"
                    alt="LLLMS Фемида"
                  />
                </div>
                <div className="flex-1">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="text-[#8faaba] text-2xl font-bold flex-shrink-0 leading-none">
                        /
                      </span>
                      <span className="text-[#29282b] text-base leading-relaxed">
                        Консультации по гражданским и административным вопросам, включая недвижимость.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#8faaba] text-2xl font-bold flex-shrink-0 leading-none">
                        /
                      </span>
                      <span className="text-[#29282b] text-base leading-relaxed">
                        Разъяснение прав и обязанностей физических лиц в типовых и сложных правовых ситуациях.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#8faaba] text-2xl font-bold flex-shrink-0 leading-none">
                        /
                      </span>
                      <span className="text-[#29282b] text-base leading-relaxed">
                        Первичная правовая оценка и рекомендации по дальнейшим действиям.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right side — form */}
          <RequestForm />
        </div>
      </div>
    </section>
  );
}