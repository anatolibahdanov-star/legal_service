
export default function App() {
  return (
      <>
      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1216px] mx-auto px-[159px] py-[48px]">
        <div className="mb-[32px]">
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[48px] leading-[48px] text-[#29282b] text-center mb-[24px]">
            Политика конфиденциальности
          </h1>
        </div>

        <div className="bg-white rounded-[16px] p-[48px]">
          <div className="space-y-[32px]">
            <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
              Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сайта [название сайта] (далее — «Сайт»), предоставляемых при использовании сервисов онлайн-консультаций.
            </p>
            
            <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
              Используя Сайт, вы подтверждаете согласие с условиями настоящей Политики конфиденциальности.
            </p>

            {/* Section 1 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                1. Общие положения
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  1.1. Оператором персональных данных является [ФИО юриста / наименование], осуществляющий юридическую деятельность в соответствии с законодательством Российской Федерации.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  1.2. Обработка персональных данных осуществляется в соответствии с Федеральным законом РФ № 152-ФЗ «О персональных данных».
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  1.3. Оператор принимает все необходимые организационные и технические меры для защиты персональных данных пользователей.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                2. Персональные данные, которые обрабатываются
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  В рамках работы Сайта могут обрабатываться следующие персональные данные:
                </p>
                <ul className="space-y-[8px]">
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    фамилия, имя, отчество;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    номер телефона;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    адрес электронной почты;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    сведения, содержащиеся в обращении или описании юридической ситуации;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    иные данные, добровольно предоставленные пользователем.
                  </li>
                </ul>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  Сайт не обрабатывает специальные категории персональных данных, за исключением случаев, когда такие сведения добровольно сообщаются пользователем в рамках обращения за юридической консультацией.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                3. Цели обработки персональных данных
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  Персональные данные обрабатываются исключительно в следующих целях:
                </p>
                <ul className="space-y-[8px]">
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    предоставление онлайн-консультаций и юридической помощи;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    обратная связь с пользователем;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    уточнение деталей обращения;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    подготовка правовой позиции и рекомендаций;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    исполнение требований законодательства Российской Федерации.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                4. Правовые основания обработки данных
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  Оператор обрабатывает персональные данные на следующих основаниях:
                </p>
                <ul className="space-y-[8px]">
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    добровольное согласие пользователя;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    необходимость исполнения договора оказания юридических услуг;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    требования законодательства Российской Федерации.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                5. Порядок хранения и передачи данных
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  5.1. Персональные данные хранятся в течение срока, необходимого для достижения целей их обработки.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  5.2. Персональные данные не передаются третьим лицам, за исключением случаев, предусмотренных законодательством РФ.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  5.3. Доступ к данным имеют только уполномоченные лица, соблюдающие режим конфиденциальности.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                6. Конфиденциальность и адвокатская тайна
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  Вся информация, полученная в ходе онлайн-консультации, рассматривается как конфиденциальная и не подлежит разглашению.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  Оператор соблюдает принципы профессиональной тайны и действует в интересах защиты прав и законных интересов клиента.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                7. Права пользователя
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  Пользователь имеет право:
                </p>
                <ul className="space-y-[8px]">
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    получать информацию об обработке своих персональных данных;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    требовать уточнения, блокировки или удаления персональных данных;
                  </li>
                  <li className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(41,40,43,0.8)] flex items-start">
                    <span className="inline-block w-[8px] h-[8px] rounded-full bg-[#8faaba] mr-[12px] mt-[8px] shrink-0"></span>
                    отозвать согласие на обработку персональных данных.
                  </li>
                </ul>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  Отзыв согласия может быть направлен через контактные данные, указанные на Сайте.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                8. Использование файлов cookie
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  Сайт может использовать файлы cookie для улучшения работы сервиса и удобства пользователей.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  Пользователь может отключить cookie в настройках своего браузера.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[30px] leading-[36px] text-[#29282b] mb-[16px]">
                9. Заключительные положения
              </h2>
              <div className="space-y-[12px] pl-[28px] border-l-4 border-[#8faaba]">
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  9.1. Оператор вправе вносить изменения в настоящую Политику конфиденциальности без предварительного уведомления.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  9.2. Актуальная версия Политики всегда доступна на Сайте.
                </p>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[26px] text-[rgba(41,40,43,0.9)]">
                  9.3. Все вопросы, связанные с обработкой персональных данных, можно направлять через форму обратной связи на Сайте.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      </>
  );
}