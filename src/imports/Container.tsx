import StImage from 'next/image'

function Text() {
  return (
    <div className="absolute content-stretch flex h-[59px] items-start left-0 top-[101.59px] w-[441.641px]" data-name="Text">
      <p className="css-4hzbpn font-['Inter:Bold',sans-serif] font-bold leading-[52.8px] not-italic relative shrink-0 text-[#87b7ce] text-[48px] w-[438px]">Уголовным делам</p>
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[158.391px] relative shrink-0 w-full" data-name="Heading 1">
      <p className="absolute css-4hzbpn font-['Inter:Bold',sans-serif] font-bold leading-[52.8px] left-0 not-italic text-[#252623] text-[48px] top-[-1.8px] w-[530px]">{`Задавайте вопросы юристам  по`}</p>
      <Text />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute css-4hzbpn font-['Inter:Regular',sans-serif] font-normal leading-[28px] left-0 not-italic text-[#29282b] text-[20px] top-0 w-[587px]">Бесплатная юридическая помощь в сложных и экстренных ситуациях</p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[100px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute css-4hzbpn font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[32px] left-0 not-italic text-[#87b7ce] text-[24px] top-[-1px] w-[543px]">Анонимно, безопасно и без личного визита к юристу</p>
    </div>
  );
}

function Image() {
  return (
    <div className="h-[281px] relative shrink-0 w-[210px]" data-name="Image (Фемида)">
      <StImage
        src="/assets/02cd76a773936ea659f1b34bce60e3771528f8c6.png"
        width={210}
        height={281}
        className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-cover pointer-events-none size-full"
        alt="LLLMS Фемида"
      />
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[24px] relative shrink-0 w-[9.328px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute css-ew64yg font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-0 not-italic text-[#87b7ce] text-[24px] top-[-1px]">/</p>
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="flex-[1_0_0] h-[78px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute css-4hzbpn font-['Inter:Regular',sans-serif] font-normal leading-[26px] left-[-0.33px] not-italic text-[#29282b] text-[16px] top-[-1.19px] w-[286px]">Консультации при задержании, допросе, обыске и иных следственных действиях</p>
      </div>
    </div>
  );
}

function ListItem() {
  return (
    <div className="content-stretch flex gap-[12px] h-[78px] items-start relative shrink-0 w-full" data-name="List Item">
      <Text1 />
      <Text2 />
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[24px] relative shrink-0 w-[9.328px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute css-ew64yg font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-0 not-italic text-[#87b7ce] text-[24px] top-[-1px]">/</p>
      </div>
    </div>
  );
}

function Text4() {
  return (
    <div className="flex-[1_0_0] h-[78px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute css-4hzbpn font-['Inter:Regular',sans-serif] font-normal leading-[26px] left-0 not-italic text-[#29282b] text-[16px] top-[-1px] w-[279px]">Разъяснение прав подозреваемых, обвиняемых, свидетелей и потерпевших</p>
      </div>
    </div>
  );
}

function ListItem1() {
  return (
    <div className="content-stretch flex gap-[12px] h-[78px] items-start relative shrink-0 w-full" data-name="List Item">
      <Text3 />
      <Text4 />
    </div>
  );
}

function Text5() {
  return (
    <div className="h-[24px] relative shrink-0 w-[9.328px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute css-ew64yg font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-0 not-italic text-[#87b7ce] text-[24px] top-[-1px]">/</p>
      </div>
    </div>
  );
}

function Text6() {
  return (
    <div className="flex-[1_0_0] h-[78px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute css-4hzbpn font-['Inter:Regular',sans-serif] font-normal leading-[26px] left-0 not-italic text-[#29282b] text-[16px] top-[-1px] w-[231px]">Первичная правовая оценка ситуации и рекомендации по дальнейшим действиям</p>
      </div>
    </div>
  );
}

function ListItem2() {
  return (
    <div className="content-stretch flex gap-[12px] h-[78px] items-start relative shrink-0 w-full" data-name="List Item">
      <Text5 />
      <Text6 />
    </div>
  );
}

function List() {
  return (
    <div className="h-[266px] relative shrink-0 w-[322px]" data-name="List">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[16px] items-start relative size-full">
        <ListItem />
        <ListItem1 />
        <ListItem2 />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex gap-[24px] h-[314px] items-start relative shrink-0 w-[598px]" data-name="Container">
      <Image />
      <List />
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-[#fefdf9] h-[314px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start pr-[24px] relative size-full">
        <Container />
      </div>
    </div>
  );
}

export default function Container2() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative size-full" data-name="Container">
      <Heading />
      <Paragraph />
      <Paragraph1 />
      <Container1 />
    </div>
  );
}