import { Shield, FileText, TrendingDown, Users, Award, Clock, Scale, Brain, Target, TrendingUp } from "lucide-react";
import Image from 'next/image'

export function AboutUs() {
  const advantages = [
    {
      icon: Shield,
      title: "Гарантия конфиденциальности",
      description: "Все ваши данные защищены и не передаются третьим лицам",
    },
    {
      icon: FileText,
      title: "Профессиональный подход",
      description: "Работаем только с опытными юристами по уголовным делам",
    },
    {
      icon: TrendingDown,
      title: "Списание долгов",
      description: "Помогаем законно списать долги от 250 000 рублей",
    },
    {
      icon: Users,
      title: "Индивидуальный подход",
      description: "Каждое дело рассматривается персонально",
    },
    {
      icon: Award,
      title: "Опыт более 10 лет",
      description: "Наши юристы имеют богатый опыт в уголовном праве",
    },
    {
      icon: Clock,
      title: "Быстрая консультация",
      description: "Ответ на ваш вопрос в течение 24 часов",
    },
  ];

  return (
    <section id="about" className="pt-[20px] pb-[20px] lg:pt-[20px] lg:pb-[20px] bg-[#fefdf9]">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-[#3d4b5e] rounded-[50px] p-8 lg:p-12 w-full">
          <div className="max-w-7xl mx-auto">
            <div className="mb-[30px]">
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">Почему мы?</h2>
              <p className="text-xl text-white/90 max-w-3xl">
                Знаем все нюансы <span className="text-[#8faaba]">рынка недвижимости</span>, что позволяет обеспечить максимальную защиту и успех в защите ваших прав и интересов.
              </p>
            </div>

            {/* Сетка блоков */}
            <div className="space-y-6">
              {/* Блок О компании вверху - на всю ширину */}
              <div className="bg-[#fefdf9] rounded-[40px] p-10 lg:p-12 relative overflow-hidden">
                <h3 className="text-2xl lg:text-3xl font-bold text-[#29282b] mb-6">
                  О компании
                </h3>
                <p className="text-[#29282b]/70 leading-relaxed text-base lg:text-lg max-w-3xl">
                  Мы — юридическая команда, оказывающая онлайн-помощь по широкому кругу правовых вопросов. Работаем с гражданскими, семейными и административными делами, в том числе с вопросами, связанными с недвижимостью и имущественными правами. Сопровождаем клиентов от первичной консультации до решения задачи,обеспечивая конфиденциальность.
                </p>
                <Image
                  src="/design/aboutcompany.png"
                  width={450}
                  height={0}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-[35%] max-w-[450px] h-auto object-contain"
                  alt="LLLMS О компании"
                />
              </div>

              {/* 4 блока внизу в ряд */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#fefdf9] rounded-[40px] p-6 flex flex-col">
                  <h3 className="text-lg lg:text-xl font-bold text-[#29282b] mb-3">
                    Экспертиза в юридических вопросах.
                  </h3>
                  <p className="text-[#29282b]/70 text-base mb-6 flex-grow">
                    Решаем широкий спектр задач: сделки с недвижимостью, имущественные права. Опыт позволяет сопровождать как стандартные, так и сложные операции.
                  </p>
                  <div className="mt-auto flex justify-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border-2 border-[#576280]">
                      <Scale className="w-6 h-6 text-[#576280]" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#fefdf9] rounded-[40px] p-6 flex flex-col">
                  <h3 className="text-lg lg:text-xl font-bold text-[#29282b] mb-3">
                    Взвешенный подход к каждому делу.
                  </h3>
                  <p className="text-[#29282b]/70 text-base mb-6 flex-grow">
                    Анализируем документы и риски, особенно при сделках с недвижимостью и правом собственности, чтобы надежно защитить ваши интересы.
                  </p>
                  <div className="mt-auto flex justify-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border-2 border-[#576280]">
                      <Brain className="w-6 h-6 text-[#576280]" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#fefdf9] rounded-[40px] p-6 flex flex-col">
                  <h3 className="text-lg lg:text-xl font-bold text-[#29282b] mb-3">
                    Работаем на результат.
                  </h3>
                  
                  <p className="text-[#29282b]/70 text-base mb-6 flex-grow">
                    <br />
                    Стремимся к практическому решению задач клиента: минимизируем риски, обеспечиваем правовую безопасность и защиту интересов.
                  </p>
                  <div className="mt-auto flex justify-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border-2 border-[#576280]">
                      <Target className="w-6 h-6 text-[#576280]" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#fefdf9] rounded-[40px] p-6 flex flex-col">
                  <h3 className="text-lg lg:text-xl font-bold text-[#29282b] mb-3">
                    Консультация профессионалов.
                  </h3>
                  <p className="text-[#29282b]/70 text-base mb-6 flex-grow">
                    Консультируем по сделкам с недвижимостью и спорам, включая жилищные вопросы. Онлайн-помощь — быстро, удобно, без визита в офис.
                  </p>
                  <div className="mt-auto flex justify-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border-2 border-[#576280]">
                      <TrendingUp className="w-6 h-6 text-[#576280]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}