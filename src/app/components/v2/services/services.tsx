import { SERVICES } from './services.data'

export function Services() {
  return (
    <section
      id="services"
      className="w-full flex flex-col gap-10"
      style={{ background: '#F9F9F9', padding: '72px 0' }}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-[100px]">
        <div className="flex flex-col gap-4">
        <h2 className="text-[48px] font-semibold leading-[56px] tracking-tight text-[#12161B]">
          Какие услуги мы предоставляем
        </h2>
        <p className="text-[22px] leading-[28px] tracking-tight text-[#12161B] mb-[40px]">
          Комплексная правовая защита на{' '}
          <span className="font-semibold text-[#34347C]">каждом этапе</span>{' '}
          любого дела
        </p>
      </div>

      <div className="flex items-stretch justify-between gap-6">
        {SERVICES.map((service) => (
          <div
            key={service.num}
            className="flex flex-col gap-[54px] flex-1"
            style={{
              padding: 12,
              borderRadius: 21.32,
              background: '#fff',
              border: '0.38px solid rgba(18,22,27,0.1)',
              boxShadow: '0px 2px 6px 0px rgba(30,47,72,0.06)',
              minHeight: 352,
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 80,
                height: 80,
                borderRadius: 10,
                background: 'rgba(18,22,27,0.15)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <span
                className="font-semibold"
                style={{ fontSize: 48, lineHeight: '56px', color: 'rgba(18,22,27,0.5)' }}
              >
                {service.num}
              </span>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <h3 className="text-[22px] font-semibold leading-7 tracking-tight text-[#12161B]">
                {service.title}
              </h3>
              <p className="text-[16px] leading-[22px] tracking-tight text-[rgba(18,22,27,0.7)]">
                {service.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}
