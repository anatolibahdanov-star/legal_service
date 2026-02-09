export function Services() {
  const services = [
    {
      title: "Консультации и правовой анализ.",
      description: "",
      cases: [
        "Очные и дистанционные консультации по административным, гражданским делам.",
        "Первичная оценка ситуации и правовых рисков.",
        "Разбор перспектив дела и возможных последствий.",
        "Рекомендации по действиям при проверках, переговорах и спорных ситуациях.",
      ],
    },
    {
      title: "Защита на всех стадиях процесса.",
      description: "",
      cases: [
        "Представительство клиента при проверках, переговорах и иных действиях.",
        "Защита интересов участников сделки, собственников, арендаторов и других сторон.",
        "Представительство в судах всех инстанций.",
        "Обжалование решений и действий государственных органов.",
      ],
    },
    {
      title: "Сопровождение документов.",
      description: "",
      cases: [
        "Подготовка жалоб, ходатайств и заявлений.",
        "Составление апелляционных и кассационных жалоб.",
        "Обжалование действий и решений административных и судебных органов.",
        "Полное правовое сопровождение клиента на всех этапах дела.",
      ],
    },
  ];

  return (
    <section className="pt-[20px] pb-[20px] lg:pt-[20px] lg:pb-[20px] bg-[#fefdf9]">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-[#3d4b5e] rounded-[50px] p-8 lg:p-12 w-full">
          <div className="max-w-7xl mx-auto">
            <div className="mb-[30px]">
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Какие услуги мы предоставляем
              </h2>
              <p className="text-xl text-white/90 max-w-3xl">
                Комплексная правовая защита на <span className="text-[#8faaba]">каждом этапе</span> любого дела.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-[#fefdf9] rounded-xl p-6 hover:shadow-lg transition-all"
                >
                  <h4 className="font-bold text-lg text-[#29282b] mb-3">{service.title}</h4>
                  <p className="text-sm text-[#29282b]/70 mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.cases.map((caseItem, caseIndex) => (
                      <li key={caseIndex} className="flex items-start gap-2 text-sm text-[#29282b]/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#8faaba] mt-1.5 flex-shrink-0" />
                        <span>{caseItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}