'use client'; 

import { useState } from "react";
import { Send, Clock, Users, CheckCircle } from "lucide-react";
import Image from 'next/image'

export function Hero() {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    topic: "",
    question: "",
    agree: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.agree) {
      // Переход на страницу подтверждения
      window.location.hash = "success";
    }
  };

  return (
    <section className="bg-[#fefdf9] pt-[20px] pb-[20px] lg:pt-[20px] lg:pb-[20px] rounded-b-[60px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-5 items-center">
          {/* Левая часть - описание */}
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#252623] leading-[1.1]">
              Задавайте вопросы юристам по <span className="text-[#8faaba] whitespace-nowrap">Уголовным делам</span>
            </h1>
            
            <p className="text-xl text-[#29282b]">
              Бесплатная юридическая помощь в сложных и экстренных ситуациях
            </p>
            
            <p className="text-2xl text-[#8faaba] font-semibold">
              Анонимно, безопасно и без личного визита к юристу
            </p>

            <div className="bg-[#fefdf9] rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <Image
                    src="/assets/0712ad56d911edb4b949befba2fb4b1a0f147575.png"
                    width={56}
                    height={0}
                    className="w-56 h-auto"
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
                        Консультации при задержании, допросе, обыске и иных следственных действиях
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#8faaba] text-2xl font-bold flex-shrink-0 leading-none">
                        /
                      </span>
                      <span className="text-[#29282b] text-base leading-relaxed">
                        Разъяснение прав подозреваемых, обвиняемых, свидетелей и потерпевших
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#8faaba] text-2xl font-bold flex-shrink-0 leading-none">
                        /
                      </span>
                      <span className="text-[#29282b] text-base leading-relaxed">
                        Первичная правовая оценка ситуации и рекомендации по дальнейшим действиям
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Правая часть - форма */}
          <div className="bg-[#3d4b5e] rounded-3xl p-10 shadow-2xl">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-bold text-white">
                  Задать вопрос юристу
                </h2>
                
                {/* Иконка Онлайн */}
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-[#323c54] text-base font-medium">ОНЛАЙН</span>
                </div>
              </div>
              
              <p className="text-white/80 text-sm leading-relaxed">
                Опишите проблему → Получите бесплатный анализ ситуации и варианты решений от юриста. Если потребуется подготовка документов или представительство в суде, вы обсудите условия напрямую со специалистом.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                    Электронная почта
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@example.com"
                    className="w-full px-5 py-4 bg-transparent border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-[#8faaba] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">
                    Ваше имя
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Имя"
                    className="w-full px-5 py-4 bg-transparent border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-[#8faaba] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-white/90 mb-2">
                  Тема вопроса
                </label>
                <input
                  type="text"
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="Тема вопроса"
                  className="w-full px-5 py-4 bg-transparent border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-[#8faaba] transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="question" className="block text-sm font-medium text-white/90 mb-2">
                  Описание проблемы
                </label>
                <textarea
                  id="question"
                  rows={6}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Опишите вашу ситуацию"
                  className="w-full px-5 py-4 bg-transparent border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-[#8faaba] transition-colors resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#8faaba] hover:bg-[#7a98a7] text-white font-medium py-4 px-6 rounded-2xl transition-colors text-lg"
              >
                Оставить заявку
              </button>

              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="agree"
                  checked={formData.agree}
                  onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded border-white/30 bg-transparent text-[#8faaba] focus:ring-[#8faaba] focus:ring-offset-0"
                  required
                />
                <label htmlFor="agree" className="text-xs text-white/60 leading-relaxed">
                  Нажимая кнопку «Далее», я принимаю условия Пользовательского соглашения и условия Политики конфиденциальности.
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}