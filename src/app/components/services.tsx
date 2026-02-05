export function Services() {
  const services = [
    {
      title: "Консультации и правовой анализ",
      description: "Онлайн- и очные консультации по уголовным делам",
      cases: [
        "Первичная оценка ситуации и правовых рисков",
        "Разбор перспектив дела и возможных последствий",
        "Рекомендации по действиям при проверке, допросе, обыске",
        "Разъяснение прав и обязанностей клиента",
      ],
    },
    {
      title: "Защита на всех стадиях уголовного процесса",
      description: "Защита на стадии доследственной проверки",
      cases: [
        "Участие в допросах, обысках и следственных действиях",
        "Защита подозреваемых и обвиняемых",
        "Представительство в судах всех инстанций",
        "Обжалование приговоров и мер пресечения",
        "Защита прав потерпевших",
      ],
    },
    {
      title: "Подготовка и сопровождение документов",
      description: "Подготовка жалоб, ходатайств и заявлений",
      cases: [
        "Составление апелляционных и кассационных жалоб",
        "Обжалование действий и решений следственных органов",
        "Правовое сопровождение клиента на всех этапах дела",
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
                Комплексная правовая защита <span className="text-[#8faaba]">по уголовным делам</span> на каждом этапе
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