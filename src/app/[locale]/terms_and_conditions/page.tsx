
export default function App() {
  return (
    <>
      
      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1216px] mx-auto px-[159px] py-[48px]">
        <div className="mb-[32px]">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[48px] leading-[48px] text-[#29282b] text-center mb-[24px]">
            Пользовательское соглашение
          </h1>
          <p className="font-['Inter:Regular',sans-serif] text-[20px] leading-[28px] text-[rgba(41,40,43,0.7)] text-center">
            компании «ЮристПро»
          </p>
        </div>

        <div className="bg-white rounded-[16px] p-[48px]">
          <div className="space-y-[32px]">
            <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
              Настоящее Пользовательское соглашение (далее — Соглашение) регулирует порядок использования сайта компании «ЮристПро» (далее — Сайт) и условия предоставления онлайн-консультаций.
            </p>
            
            <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
              Используя Сайт, пользователь подтверждает, что ознакомился с условиями настоящего Соглашения и принимает их в полном объёме.
            </p>

            {/* Section 1 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                1. Общие положения
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  1.1. Компания «ЮристПро» оказывает юридические консультационные услуги в онлайн-формате в соответствии с законодательством Российской Федерации.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  1.2. Сайт предназначен для предоставления информации и предварительных юридических консультаций.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  1.3. Настоящее Соглашение является публичной офертой в соответствии со статьёй 437 Гражданского кодекса РФ.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                2. Термины и определения
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  <strong>Пользователь</strong> — физическое лицо, использующее Сайт.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  <strong>Онлайн-консультация</strong> — устная или письменная консультация, предоставляемая через формы Сайта, мессенджеры, телефон или иные электронные средства связи.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  <strong>Контент</strong> — тексты, материалы и информация, размещённые на Сайте.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                3. Предмет соглашения
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  3.1. Компания «ЮристПро» предоставляет Пользователю доступ к Сайту и возможность получения онлайн-консультаций.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  3.2. Информация, размещённая на Сайте, носит справочный характер и не является публичным обещанием результата по делу.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  3.3. Окончательный объём и формат юридических услуг определяются индивидуально.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                4. Права и обязанности сторон
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  <strong>4.1. Пользователь имеет право:</strong>
                </p>
                <ul className="space-y-[8px]">
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    получать информацию об оказываемых услугах;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    обращаться за онлайн-консультацией;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    использовать Сайт в законных целях.
                  </li>
                </ul>
                
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)] mt-[16px]">
                  <strong>4.2. Пользователь обязуется:</strong>
                </p>
                <ul className="space-y-[8px]">
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    предоставлять достоверную информацию;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    не нарушать законодательство РФ при использовании Сайта;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    не использовать материалы Сайта без согласия правообладателя.
                  </li>
                </ul>
                
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)] mt-[16px]">
                  <strong>4.3. Компания «ЮристПро» вправе:</strong>
                </p>
                <ul className="space-y-[8px]">
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    запрашивать уточняющую информацию для консультации;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    отказать в оказании услуги при нарушении условий Соглашения;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    приостанавливать работу Сайта для технического обслуживания.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                5. Онлайн-консультации
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  5.1. Онлайн-консультация предоставляется на основании информации, сообщённой Пользователем.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  5.2. Компания «ЮристПро» не несёт ответственности за последствия, вызванные предоставлением неполных или недостоверных данных.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  5.3. Онлайн-консультация не заменяет полноценного правового сопровождения, если иное не согласовано сторонами отдельно.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                6. Конфиденциальность
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  6.1. Вся информация, полученная от Пользователя, является конфиденциальной.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  6.2. Обработка персональных данных осуществляется в соответствии с Политикой конфиденциальности компании «ЮристПро».
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  6.3. Компания соблюдает профессиональные стандарты юридической деятельности.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                7. Ограничение ответственности
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  7.1. Компания «ЮристПро» не гарантирует достижение конкретного результата по делу.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  7.2. Компания не несёт ответственности за действия Пользователя, совершённые на основании полученной консультации без дополнительного правового анализа.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  7.3. Сайт может содержать ссылки на сторонние ресурсы, за содержание которых Компания ответственности не несёт.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                8. Интеллектуальная собственность
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  8.1. Все материалы Сайта являются объектами авторского права.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  8.2. Копирование, распространение или использование материалов без письменного согласия правообладателя запрещено.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                9. Изменение условий соглашения
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  9.1. Компания «ЮристПро» вправе в любое время изменять настоящее Соглашение.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  9.2. Актуальная версия Соглашения размещается на Сайте и вступает в силу с момента публикации.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                10. Заключительные положения
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  10.1. Все споры подлежат разрешению в соответствии с законодательством Российской Федерации.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  10.2. Местом разрешения споров является город Москва.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  10.3. По всем вопросам Пользователь может обратиться через форму обратной связи на Сайте.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      </>
  );
}
