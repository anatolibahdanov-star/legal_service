import { Shield, Lock, Scale, CheckCircle } from 'lucide-react';

interface StatusPageProps {
  caseDescription?: string;
}

export function StatusPage({ caseDescription }: StatusPageProps) {
  const answerContent = {
    qualification: {
      title: "Возможная квалификация",
      text: "По описанным обстоятельствам ситуация может подпадать под ст. 158 УК РФ (Кража) — тайное хищение чужого имущества.",
      points: [
        "имущество принадлежит другому лицу",
        "изъятие произошло тайно",
        "был умысел на присвоение"
      ]
    },
    responsibility: {
      title: "От чего зависит ответственность",
      text: "Квалификация и тяжесть последствий зависят от:",
      points: [
        "стоимости имущества",
        "наличия значительного ущерба",
        "проникновения в помещение или жилище",
        "совершения деяния группой лиц",
        "наличия предыдущих судимостей"
      ]
    },
    consequences: {
      title: "Возможные последствия",
      text: "Ст. 158 УК РФ предусматривает ответственность от штрафа и обязательных работ до лишения свободы (в более тяжёлых случаях — до 10 лет)."
    },
    defense: {
      title: "Что важно для защиты",
      text: "Ключевое значение имеют:",
      points: [
        "доказанность умысла",
        "обстоятельства изъятия имущества",
        "возврат ущерба",
        "смягчающие обстоятельства (ст. 61 УК РФ)",
        "процессуальные нарушения со стороны следствия"
      ]
    },
    actions: {
      title: "Рекомендуемые действия сейчас",
      text: "До консультации с адвокатом:",
      points: [
        "не давайте показаний без защитника",
        "внимательно читайте документы перед подписью",
        "уточните свой процессуальный статус"
      ],
      footer: "Раннее участие адвоката существенно влияет на исход дела по ст. 158 УК РФ."
    }
  };

  const educationalLinks = [
    {
      title: 'Ваши права при допросе',
      description: 'Что можно и нельзя делать во время следственных действий'
    },
    {
      title: 'Что делать при обыске',
      description: 'Процедура обыска и ваши законные права'
    },
    {
      title: 'Как проходит защита по уголовному делу',
      description: 'Этапы уголовного процесса и роль адвоката'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fefdf9]">
      {/* Верхняя часть - заголовок и блок доверия */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#29282b] mb-4">
            Статус вашего обращения
          </h1>
          <p className="text-lg text-[#29282b]/70 max-w-3xl mx-auto">
            Персональная страница запроса на юридическую консультацию по уголовному делу.
          </p>
        </div>

        {/* Блок доверия */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-12">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#8faaba]" />
            <span className="text-sm font-medium text-[#29282b]">Конфиденциально</span>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#8faaba]" />
            <span className="text-sm font-medium text-[#29282b]">Адвокатская тайна</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#8faaba]" />
            <span className="text-sm font-medium text-[#29282b]">Информация защищена</span>
          </div>
        </div>
      </div>

      {/* Центральная зона - главный статусный блок */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-[#323c54] rounded-3xl p-8 lg:p-12 shadow-xl">
          {/* Номер обращения */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-[#8faaba]" />
              <span className="text-sm font-medium text-white/70">Ваше обращение:</span>
            </div>
            <p className="text-xl font-semibold text-white mb-6">
              № 145 от 28.01.2026
            </p>
            <p className="text-lg text-white/90">
              Ответ адвоката Михайлова Т.В. готов
            </p>
          </div>

          {/* Контент в зависимости от статуса */}
          <>
            {/* Заголовок ответа */}
            <h2 className="text-3xl font-bold text-white mb-8">
              Первичная правовая оценка вашей ситуации
            </h2>

            {/* Блок ответа юриста */}
            <div className="space-y-6 mb-8">
              <div className="border-l-4 border-[#8faaba] pl-6">
                <h3 className="text-lg font-bold text-white mb-3">
                  {answerContent.qualification.title}
                </h3>
                <p className="text-white/90 leading-relaxed">
                  {answerContent.qualification.text}
                </p>
                <ul className="space-y-2 mt-2">
                  {answerContent.qualification.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#8faaba] mt-2 flex-shrink-0" />
                      <span className="text-white/80">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-l-4 border-[#8faaba] pl-6">
                <h3 className="text-lg font-bold text-white mb-3">
                  {answerContent.responsibility.title}
                </h3>
                <p className="text-white/90 leading-relaxed">
                  {answerContent.responsibility.text}
                </p>
                <ul className="space-y-2 mt-2">
                  {answerContent.responsibility.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#8faaba] mt-2 flex-shrink-0" />
                      <span className="text-white/80">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-l-4 border-[#8faaba] pl-6">
                <h3 className="text-lg font-bold text-white mb-3">
                  {answerContent.consequences.title}
                </h3>
                <p className="text-white/90 leading-relaxed">
                  {answerContent.consequences.text}
                </p>
              </div>

              <div className="border-l-4 border-[#8faaba] pl-6">
                <h3 className="text-lg font-bold text-white mb-3">
                  {answerContent.defense.title}
                </h3>
                <p className="text-white/90 leading-relaxed">
                  {answerContent.defense.text}
                </p>
                <ul className="space-y-2 mt-2">
                  {answerContent.defense.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#8faaba] mt-2 flex-shrink-0" />
                      <span className="text-white/80">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-l-4 border-[#8faaba] pl-6">
                <h3 className="text-lg font-bold text-white mb-3">
                  {answerContent.actions.title}
                </h3>
                <p className="text-white/90 leading-relaxed">
                  {answerContent.actions.text}
                </p>
                <ul className="space-y-2 mt-2">
                  {answerContent.actions.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#8faaba] mt-2 flex-shrink-0" />
                      <span className="text-white/80">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-white/80 mt-4">
                  {answerContent.actions.footer}
                </p>
              </div>
            </div>

            {/* Блок "Что делать дальше" */}
            <div className="bg-[#fefdf9] rounded-2xl p-6">
              <h3 className="text-xl font-bold text-[#29282b] mb-4">
                Рекомендуемый следующий шаг
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button className="w-full bg-[#8faaba] hover:bg-[#7a8fa0] text-white font-semibold py-4 px-6 rounded-xl transition-colors">
                  Задать уточняющий вопрос по моему случаю
                </button>
                <button className="w-full bg-[#29282b] hover:bg-[#3d3c3f] text-white font-semibold py-4 px-6 rounded-xl transition-colors">
                  Связаться с адвокатом
                </button>
              </div>
            </div>
          </>
        </div>
      </div>

      {/* Блок "Пока вы здесь" */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-3xl font-bold text-[#29282b] mb-8 text-center">
          Пока вы здесь
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {educationalLinks.map((link, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-[#29282b]/10"
            >
              <h4 className="font-bold text-lg text-[#29282b] mb-2">
                {link.title}
              </h4>
              <p className="text-sm text-[#29282b]/70 mb-3">
                {link.description}
              </p>
              <a href="#" className="text-sm text-[#8faaba] hover:text-[#7a8fa0] font-medium transition-colors">
                Подробнее →
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Блок с хештегами */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#29282b]/10">
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#уголовноеправо</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#кража</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#уголовнаяответственность</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#адвокат</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#онлайнконсультация</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#защитаправ</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#уголовноедело</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#ст158УКРФ</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#правоваяподдержка</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#юридическаяконсультация</span>
          </div>
        </div>
      </div>
    </div>
  );
}