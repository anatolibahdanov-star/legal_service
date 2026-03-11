import { Users, UserCheck, Clock } from "lucide-react";

export function StatsBar() {
  return (
    <div className="bg-[#fefdf9] pt-6 pb-4 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Блок 1: Специалисты онлайн */}
          <div className="bg-[#fefdf9] border border-[#89a3c6] rounded-lg px-3 py-2.5 flex items-center gap-3">
            <div className="flex-shrink-0">
              <Users className="w-7 h-7 text-[#576582]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[#455071] text-2xl font-bold">3</span>
                <span className="text-[#29282b] text-sm">специалиста</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8faaba] text-xs">Юристов онлайн</span>
                <div className="flex items-center gap-1 bg-[#4ade80] rounded-full px-1.5 py-0.5">
                  <div className="w-1 h-1 rounded-full bg-white"></div>
                  <span className="text-white text-[10px] font-medium">онлайн</span>
                </div>
              </div>
            </div>
          </div>

          {/* Блок 2: Консультируют */}
          <div className="bg-[#fefdf9] border border-[#89a3c6] rounded-lg px-3 py-2.5 flex items-center gap-3">
            <div className="flex-shrink-0">
              <UserCheck className="w-7 h-7 text-[#576582]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[#455071] text-2xl font-bold">7</span>
                <span className="text-[#29282b] text-sm">человек</span>
              </div>
              <div>
                <span className="text-[#8faaba] text-xs">сейчас консультируется</span>
              </div>
            </div>
          </div>

          {/* Блок 3: Среднее время */}
          <div className="bg-[#fefdf9] border border-[#89a3c6] rounded-lg px-3 py-2.5 flex items-center gap-3">
            <div className="flex-shrink-0">
              <Clock className="w-7 h-7 text-[#576582]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[#455071] text-2xl font-bold">4</span>
                <span className="text-[#29282b] text-sm">минуты</span>
              </div>
              <div>
                <span className="text-[#8faaba] text-xs">Среднее время ответа</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}