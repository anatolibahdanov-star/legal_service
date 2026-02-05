import Image from 'next/image'

export function BankruptcyConditions() {
  const conditions = [
    "Если вы понимаете, что доход хватает только на погашения долгов",
    "У вас нет возможности оплачивать кредиты и долги, что ведет к просрочке обязательных платежей",
    "Сумма задолженности по кредитам, ипотекам, коммунальным услугам, налогам превышает 250 000₽",
  ];

  return (
    <section className="py-16 lg:py-20 bg-[#3d4b5e]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Изображение Фемиды слева */}
          <div className="flex justify-center lg:justify-start">
            <Image
              src="/assets/0712ad56d911edb4b949befba2fb4b1a0f147575.png"
              width={450}
              height={0}
              className="w-full max-w-[380px] lg:max-w-[450px] h-auto"
              alt="LLLMS Фемида"
            />
          </div>

          {/* Текстовый контент справа */}
          <div>
            <h2 className="text-2xl lg:text-3xl font-semibold text-white mb-8 leading-tight">
              Когда можно банкротиться
              <br />
              через суд или МФЦ:
            </h2>
            <ul className="space-y-6">
              {conditions.map((condition, index) => (
                <li key={index} className="flex items-start gap-4">
                  <span className="text-[#8faaba] text-2xl font-light flex-shrink-0 leading-none mt-0.5">
                    /
                  </span>
                  <p className="text-white/80 text-base lg:text-lg leading-relaxed">
                    {condition}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}