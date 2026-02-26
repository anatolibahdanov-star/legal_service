'use client';

export default function ProfileList({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#3d4b5e] rounded-[24px] p-[40px]">
        <div className="flex items-center justify-between mb-[24px]">
            <h2 className="font-['Inter:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-white">
                Мои вопросы
            </h2>
            <button
                className="bg-[#87b7ce] h-[50px] px-[32px] rounded-[12px] font-['Inter:Medium',sans-serif] font-medium text-[16px] text-white hover:bg-[#6fa2b8] transition-colors"
            >
                Задать новый вопрос юристу
            </button>
        </div>
        {children}

    </div>
  );
}