import svgPaths from "./svg-jykfspex2r";
import StImage from 'next/image'

function Heading() {
  return (
    <div className="absolute content-stretch flex h-[60px] items-start left-0 top-0 w-[1280px]" data-name="Heading 2">
      <p className="css-4hzbpn flex-[1_0_0] font-['Inter:Bold',sans-serif] font-bold leading-[60px] min-h-px min-w-px not-italic relative text-[48px] text-white">Почему мы</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[56px] left-0 top-[76px] w-[768px]" data-name="Paragraph">
      <div className="absolute css-g0mm18 font-['Inter:Regular',sans-serif] font-normal leading-[0] left-0 not-italic text-[20px] text-[rgba(255,255,255,0.9)] top-0">
        <p className="css-ew64yg mb-0">
          <span className="leading-[28px]">Знаем все нюансы</span>
          <span className="font-['Inter:Regular',sans-serif] font-normal leading-[28px] not-italic"> </span>
          <span className="font-['Inter:Regular',sans-serif] font-normal leading-[28px] not-italic text-[#87b7ce]">уголовного процесса</span>
          <span className="leading-[28px]">, что позволяет обеспечить</span>
        </p>
        <p className="css-ew64yg leading-[28px]">{` максимальную защиту и успех в защите ваших прав и интересов   `}</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[132px] relative shrink-0 w-full" data-name="Container">
      <Heading />
      <Paragraph />
    </div>
  );
}

function Heading1() {
  return (
    <div className="absolute content-stretch flex h-[36px] items-start left-[48px] top-[48px] w-[1184px]" data-name="Heading 3">
      <p className="css-4hzbpn flex-[1_0_0] font-['Inter:Bold',sans-serif] font-bold leading-[36px] min-h-px min-w-px not-italic relative text-[#29282b] text-[30px]">О компании</p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="absolute h-[170px] left-[48px] top-[99px] w-[694px]" data-name="Paragraph">
      <p className="absolute css-4hzbpn font-['Inter:Regular',sans-serif] font-normal leading-[0] left-0 not-italic text-[#29282b] text-[18px] top-px w-[710px]">
        <span className="leading-[29.25px]">{`Мы – профессиональная юридическая компания с многолетним опытом работы в сфере уголовного права. Наша команда состоит из опытных адвокатов, которые помогли сотням клиентов защитить свои права и добиться справедливости. Мы гарантируем индивидуальный подход, полную конфиденциальность и профессиональную защиту на всех стадиях уголовного процесса. `}</span>
        <span className="decoration-solid leading-[29.25px] text-[#3d4b5e] underline">Подробнее</span>
      </p>
    </div>
  );
}

function Image() {
  return (
    <div className="absolute h-[267.703px] left-[759px] top-[17px] w-[448px]" data-name="Image (О компании)">
      <StImage
        src="/assets/43cf47f0ffe404b068e32bb2ded98cd50bbdd9d5.png"
        width={0}
        height={0}
        className="absolute inset-0 max-w-none object-contain pointer-events-none size-full"
        alt="LLLMS "
      />
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-[#fefdf9] h-[302.25px] overflow-clip relative rounded-[40px] shrink-0 w-full" data-name="Container">
      <Heading1 />
      <Paragraph1 />
      <Image />
    </div>
  );
}

function Heading2() {
  return (
    <div className="absolute h-[56px] left-[24px] top-[24px] w-[254px]" data-name="Heading 3">
      <p className="absolute css-4hzbpn font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[#29282b] text-[20px] top-[-0.25px] w-[185px]">Специализация — Уголовные Дела</p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute h-[144px] left-[24px] top-[91.75px] w-[243px]" data-name="Paragraph">
      <p className="absolute css-4hzbpn font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#29282b] text-[16px] top-[-1px] w-[238px]">Работаем только с уголовными делами. Сопровождаем от проверки до суда и обжалования. Узкая специализация — сильная защита.</p>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.pe2b6600} id="Vector" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p59aa3b2} id="Vector_2" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M7 21H17" id="Vector_3" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M12 3V21" id="Vector_4" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p6dc2e80} id="Vector_5" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[127px] p-[2px] rounded-[14px] size-[48px] top-[260px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-2 border-[#576280] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <Icon />
    </div>
  );
}

function Container3() {
  return (
    <div className="bg-[#fefdf9] col-[1] css-3foyfs relative rounded-[40px] row-[1] self-stretch shrink-0" data-name="Container">
      <Heading2 />
      <Paragraph2 />
      <Container2 />
    </div>
  );
}

function Heading3() {
  return (
    <div className="absolute h-[56px] left-[24px] top-[24px] w-[254px]" data-name="Heading 3">
      <p className="absolute css-4hzbpn font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[#29282b] text-[20px] top-0 w-[203px]">Подходим К Делу С Умом</p>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="absolute h-[144px] left-[24px] top-[92px] w-[254px]" data-name="Paragraph">
      <p className="absolute css-4hzbpn font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#29282b] text-[16px] top-[-1px] w-[211px]">Анализируем материалы и позицию следствия. Выстраиваем стратегию защиты с учётом рисков и сценариев.</p>
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.p199fee00} id="Vector" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p10e72800} id="Vector_2" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p2dfeeaef} id="Vector_3" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p191dbb80} id="Vector_4" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p30453a80} id="Vector_5" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p10ece300} id="Vector_6" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p1826df20} id="Vector_7" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p259d3500} id="Vector_8" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p2d1abb00} id="Vector_9" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[116px] p-[2px] rounded-[14px] size-[48px] top-[260px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-2 border-[#576280] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <Icon1 />
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-[#fefdf9] col-[2] css-3foyfs relative rounded-[40px] row-[1] self-stretch shrink-0" data-name="Container">
      <Heading3 />
      <Paragraph3 />
      <Container4 />
    </div>
  );
}

function Heading4() {
  return (
    <div className="absolute h-[28px] left-[24px] top-[24px] w-[254px]" data-name="Heading 3">
      <p className="absolute css-ew64yg font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[#29282b] text-[20px] top-0">Работаем На Результат</p>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="absolute h-[172px] left-[24px] top-[87.75px] w-[237px]" data-name="Paragraph">
      <p className="absolute css-4hzbpn font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#29282b] text-[16px] top-[-1px] w-[244px]">Наша цель — не формальное участие, а реальный результат для клиента: смягчение меры пресечения, прекращение дела, переквалификация обвинения.</p>
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.pace200} id="Vector" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p3c6311f0} id="Vector_2" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p3d728000} id="Vector_3" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[120px] p-[2px] rounded-[14px] size-[48px] top-[260px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-2 border-[#576280] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <Icon2 />
    </div>
  );
}

function Container7() {
  return (
    <div className="bg-[#fefdf9] col-[3] css-3foyfs relative rounded-[40px] row-[1] self-stretch shrink-0" data-name="Container">
      <Heading4 />
      <Paragraph4 />
      <Container6 />
    </div>
  );
}

function Heading5() {
  return (
    <div className="absolute h-[56px] left-[24px] top-[24px] w-[254px]" data-name="Heading 3">
      <p className="absolute css-4hzbpn font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[#29282b] text-[20px] top-[-0.25px] w-[211px]">Консультация Профессионалов</p>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="absolute h-[144px] left-[23px] top-[84.75px] w-[254px]" data-name="Paragraph">
      <p className="absolute css-4hzbpn font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#29282b] text-[16px] top-[-1px] w-[247px]">Онлайн-консультации опытных адвокатов по уголовным делам. Анализ ситуации и помощь в подготовке необходимых документов.</p>
    </div>
  );
}

function Icon3() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.p13253c0} id="Vector" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M16 7H22V13" id="Vector_2" stroke="var(--stroke-0, #576280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[119px] p-[2px] rounded-[14px] size-[48px] top-[260px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-2 border-[#576280] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <Icon3 />
    </div>
  );
}

function Container9() {
  return (
    <div className="bg-[#fefdf9] col-[4] css-3foyfs relative rounded-[40px] row-[1] self-stretch shrink-0" data-name="Container">
      <Heading5 />
      <Paragraph5 />
      <Container8 />
    </div>
  );
}

function Container10() {
  return (
    <div className="gap-[24px] grid grid-cols-[repeat(4,_minmax(0,_1fr))] grid-rows-[repeat(1,_minmax(0,_1fr))] h-[332px] relative shrink-0 w-full" data-name="Container">
      <Container3 />
      <Container5 />
      <Container7 />
      <Container9 />
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] h-[658.25px] items-start relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Container10 />
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-col gap-[30px] h-[820.25px] items-start relative shrink-0 w-full" data-name="Container">
      <Container />
      <Container11 />
    </div>
  );
}

function Container13() {
  return (
    <div className="bg-[#3d4b5e] h-[916.25px] relative rounded-[100px] shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start pt-[40px] px-[159px] relative size-full">
        <Container12 />
      </div>
    </div>
  );
}

export default function AboutUs() {
  return (
    <div className="bg-[#fefdf9] content-stretch flex flex-col items-start pt-[20px] relative size-full" data-name="AboutUs">
      <Container13 />
    </div>
  );
}