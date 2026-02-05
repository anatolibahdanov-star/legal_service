'use client'; 

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import Image from 'next/image'

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState(0);

  const services = [
    {
      name: "Вы оставляете обращение",
      image: "/assets/5c181d66975d91904f5225bb61540400eca74864.png",
      steps: [
        {
          title: "Заполняете форму на сайте и подробно описываете вашу ситуацию",
          description: "суть вопроса, обстоятельства дела, статус участника (подозреваемый, обвиняемый, потерпевший, свидетель)."
        },
        {
          title: "Указываете, на какой стадии находится дело",
          description: "проверка, следствие, суд или обжалование судебного решения."
        },
        {
          title: "Прикладываете документы и материалы, которые есть у вас на руках",
          description: "повестки, постановления, протоколы, решения суда и др."
        },
        {
          title: "Отправляете обращение онлайн",
          description: "сообщения принимаются круглосуточно, без необходимости личного визита."
        }
      ],
      price: "от 20 000 рублей"
    },
    {
      name: "Анализ ситуации юристом",
      image: "/assets/2c6d5834476f66d7db6679155079c3ce7a9f3350.png",
      steps: [
        {
          title: "Ваше обращение рассматривает профильный юрист",
          description: "специализирующийся на уголовных делах."
        },
        {
          title: "Проводится правовой анализ изложенных обстоятельств",
          description: "оцениваются возможные риски и последствия."
        },
        {
          title: "Определяются применимые нормы уголовного и уголовно-процессуального законодательства РФ",
          description: ""
        },
        {
          title: "Если информации недостаточно для точного ответа, мы связываемся с вами и направляем уточняющие вопросы",
          description: ""
        }
      ],
      price: "от 15 000 рублей"
    },
    {
      name: "Подготовка ответа",
      image: "/assets/5c181d66975d91904f5225bb61540400eca74864.png",
      steps: [
        {
          title: "Юрист готовит развернутый письменный ответ с учетом всех обстоятельств дела",
          description: ""
        },
        {
          title: "В ответе подробно разъясняются ваши права, возможные варианты действий и их последствия",
          description: ""
        },
        {
          title: "Даются практические рекомендации с ссылками на статьи УК РФ, УПК РФ и судебную практику",
          description: ""
        },
        {
          title: "Ответ формируется индивидуально, без шаблонов и общих формулировок",
          description: ""
        }
      ],
      price: "от 5 000 рублей"
    },
    {
      name: "Получение результата",
      image: "/assets/b6960b94bcfb9d1d3bf67497520f371c5fe7e993.png",
      steps: [
        {
          title: "Готовый ответ направляется вам онлайн, на страницу консультации и на указанный e-mail",
          description: ""
        },
        {
          title: "Вы можете внимательно изучить рекомендации в удобное для вас время",
          description: ""
        },
        {
          title: "Ответ сохраняется и остаётся доступным — к нему можно вернуться при необходимости",
          description: ""
        },
        {
          title: "При возникновении дополнительных вопросов вы можете продолжить общение с юристом",
          description: ""
        }
      ],
      price: "от 10 000 рублей"
    }
  ];

  return (
    <section id="how-it-works" className="pt-[20px] pb-[20px] lg:pt-[20px] lg:pb-[20px] bg-[#fcfbf7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-[30px]">
          <h2 className="text-4xl lg:text-5xl font-bold text-[#29282b] leading-tight mb-4">
            Как это работает
          </h2>
          <p className="text-xl text-[#29282b]/70 max-w-3xl">
            Прозрачный и понятный процесс <span className="text-[#8faaba]">онлайн-консультации</span> по уголовным делам
          </p>
        </div>

        {/* Табы */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center lg:justify-center gap-4 mb-8">
          {services.map((service, index) => (
            <div key={index} className="flex flex-col lg:flex-row items-center">
              <button
                onClick={() => setActiveTab(index)}
                className={`px-4 py-3 rounded-[30px] whitespace-nowrap font-medium transition-all w-full lg:w-auto text-center ${
                  activeTab === index
                    ? "bg-[#3d4b5e] text-white"
                    : "bg-[#29282b]/10 text-[#29282b]/70 hover:bg-[#29282b]/20"
                }`}
              >
                {service.name}
              </button>
              {index < services.length - 1 && (
                <ChevronRight className="text-[#8faaba] my-2 lg:my-0 lg:mx-3 flex-shrink-0 rotate-90 lg:rotate-0" size={28} />
              )}
            </div>
          ))}
        </div>

        {/* Контент активного таба */}
        <div className="bg-[#fefdf9] rounded-[40px] p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-8">
            {/* Левая часть - список шагов */}
            <div>
              <div className="space-y-6">
                {services[activeTab].steps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="text-2xl font-bold text-[#8faaba] flex-shrink-0">
                      {index + 1} /
                    </div>
                    <div>
                      <h4 className="font-bold text-[#29282b]">
                        {step.title}
                      </h4>
                      {step.description && (
                        <p className="text-sm text-[#29282b]/70 mt-1">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Правая часть - иллюстрация */}
            <div className="flex flex-col items-center justify-center">
              {/* Иллюстрация */}
              <div>
                <Image
                  src={services[activeTab].image}
                  width={416}
                  height={0}
                  className="max-w-[333px] lg:max-w-[416px] w-full h-auto object-contain"
                  alt="LLLMS Иллюстрация"
                />
              </div>
            </div>
          </div>

          {/* Кнопка по центру */}
          <div className="flex justify-center">
            <a
              href="#contact"
              className="bg-[#3d4b5e] hover:bg-[#323c54] text-white font-medium py-4 px-8 rounded-2xl transition-colors"
            >
              Онлайн консультация
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}