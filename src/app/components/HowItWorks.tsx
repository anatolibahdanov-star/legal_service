'use client'; 

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import Image from 'next/image'

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState(0);

  const services = [
    {
      name: "Вы оставляете обращение",
      image: "/design/step1man.png",
      steps: [
        {
          title: "Заполняете форму на сайте и подробно описываете вашу ситуацию.",
          description: "Суть вопроса, обстоятельства дела, статус участника (собственник, покупатель, участник сделки и др.)"
        },
        {
          title: "Укажите текущую стадию дела или вопроса.",
          description: "Проверка, оформление документов, судебное разбирательство или обжалование решения."
        },
        {
          title: "Отправьте обращение онлайн.",
          description: "Сообщения принимаются круглосуточно, без необходимости личного визита, что позволяет получить помощь в любое удобное время, не выходя из дома."
        },
        {
          title: "Проверяйте ответ либо на сайте.",
          description: "Либо на указанной электронной почте, чтобы быть в курсе всех рекомендаций и действий по вашему делу."
        }
      ],
      price: "от 20 000 рублей"
    },
    {
      name: "Анализ ситуации юристом",
      image: "/design/step2woman.png",
      steps: [
        {
          title: "Анализ ситуации юристом.",
          description: "Ваше обращение рассматривает профильный юрист, специализирующийся на гражданских делах и вопросах недвижимости."
        },
        {
          title: "Правовой анализ обстоятельств.",
          description: "Мы изучаем предоставленную информацию, оцениваем возможные риски и последствия для вашей ситуации."
        },
        {
          title: "Определение применимых норм.",
          description: "Определяются действующие нормы гражданского законодательства РФ, которые влияют на ваш вопрос или сделку."
        },
        {
          title: "Уточнение информации.",
          description: "Если данных недостаточно для точного заключения, мы связываемся с вами для уточнения деталей и дополнительных документов."
        }
      ],
      price: "от 15 000 рублей"
    },
    {
      name: "Подготовка ответа",
      image: "/design/step3.png",
      steps: [
        {
          title: "Формирование правовой позиции.",
          description: "Юрист на основе анализа вашей ситуации разрабатывает рекомендации и стратегию решения вопроса."
        },
        {
          title: "Подготовка документов.",
          description: "Составляются необходимые письма, обращения, договоры или иные юридические документы в соответствии с вашей ситуацией."
        },
        {
          title: "Проверка соответствия законодательству.",
          description: "Юрист проверяет, чтобы все подготовленные материалы соответствовали нормам гражданского законодательства РФ и требованиям к сделкам с недвижимостью."
        },
        {
          title: "Передача и пояснение ответа.",
          description: "Вы получаете готовый ответ или пакет документов с подробными разъяснениями, а при необходимости — рекомендации по дальнейшим действиям."
        }
      ],
      price: "от 5 000 рублей"
    },
    {
      name: "Получение результата",
      image: "/design/step4.png",
      steps: [
        {
          title: "Направление готового ответа.",
          description: "Готовый ответ отправляется вам онлайн — на страницу консультации и на указанный e-mail."
        },
        {
          title: "Удобное изучение.",
          description: "Вы можете внимательно ознакомиться с рекомендациями в удобное для Вас время."
        },
        {
          title: "Доступ к ответу.",
          description: "Ответ сохраняется и остаётся доступным — к нему можно вернуться при необходимости."
        },
        {
          title: "Дальнейшая консультация.",
          description: "При возникновении дополнительных вопросов вы можете продолжить общение с юристом."
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
            Как это работает.
          </h2>
          <p className="text-xl text-[#29282b]/70 max-w-3xl">
            Прозрачный и понятный процесс <span className="text-[#8faaba]">онлайн-консультации</span>
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