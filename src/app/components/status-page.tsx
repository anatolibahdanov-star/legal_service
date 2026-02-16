'use client';

import { DBQuestions } from '@/src/interfaces/db';
import { Shield, Lock, Scale, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface StatusPageProps {
  caseDescription?: string;
}

let isStatus = false

export function StatusPage({ caseDescription }: StatusPageProps) {
  const [data, setData] = useState<DBQuestions|null>(null);
  const slug = caseDescription

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if(!isStatus) {
        const response = await fetch('/api/requests/' + slug + '/');
        const newData: DBQuestions = await response.json();
        if(newData.status === 4) {
          isStatus = true
        }
        setData(newData); // Updating state causes the component to re-render
      }
      
    }, 5000); // Fetch every 5 seconds

    return () => clearInterval(intervalId); // Cleanup
  }, []);

  console.log('Out interval status ', isStatus)
  console.log('Out interval data status ', data?.status)
  const answer = data && [4].includes(data.status) && data.final_reply ? 
    <>
      <h2 className="text-3xl font-bold text-white mb-8">
        Первичная правовая оценка вашей ситуации
      </h2>

      {/* Блок ответа юриста */}
      <div className="space-y-6 mb-8">
        <div className="border-l-4 border-[#8faaba] pl-6">
          <div className="text-white/90 leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: data.final_reply }} />
          </div>
        </div>
      </div>
    </> :
    ``;

  const status = data && data.id ? 
    ( '№ ' + data.id + ' от ' + format(new Date(data.created_at), "dd.mm.yyyy")) : 
    'Ваша заявка еще не взята в разработку.'
  
  const from = data && [3, 4].includes(data.status) ? 
    ('Ответ адвоката ' + data.lawyer + ' готов.') : 
    (data && data.status == 2 ? ('Над вашей заявкой работает адвокат ' + data.lawyer + '.') : '')


  const educationalLinks = [
    {
      title: 'Ваши права при допросе',
      description: 'Что можно и нельзя делать во время следственных действий'
    },
    {
      title: 'Что делать при обыске',
      description: 'Процедура обыска и ваши законные права'
    },
    {
      title: 'Как проходит защита по уголовному делу',
      description: 'Этапы уголовного процесса и роль адвоката'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fefdf9]">
      {/* Верхняя часть - заголовок и блок доверия */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#29282b] mb-4">
            Статус вашего обращения
          </h1>
          <p className="text-lg text-[#29282b]/70 max-w-3xl mx-auto">
            Персональная страница запроса на юридическую консультацию по уголовному делу.
          </p>
        </div>

        {/* Блок доверия */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-12">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#8faaba]" />
            <span className="text-sm font-medium text-[#29282b]">Конфиденциально</span>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#8faaba]" />
            <span className="text-sm font-medium text-[#29282b]">Адвокатская тайна</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#8faaba]" />
            <span className="text-sm font-medium text-[#29282b]">Информация защищена</span>
          </div>
        </div>
      </div>

      {/* Центральная зона - главный статусный блок */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-[#323c54] rounded-3xl p-8 lg:p-12 shadow-xl">
          {/* Номер обращения */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-[#8faaba]" />
              <span className="text-sm font-medium text-white/70">Ваше обращение:</span>
            </div>
            <p className="text-xl font-semibold text-white mb-6">
              {status}
            </p>
            <p className="text-lg text-white/90">
              {from}
            </p>
          </div>

          {/* Контент в зависимости от статуса */}
          <>
            {answer}
          </>
        </div>
      </div>

      {/* Блок "Пока вы здесь" */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-3xl font-bold text-[#29282b] mb-8 text-center">
          Пока вы здесь
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {educationalLinks.map((link, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-[#29282b]/10"
            >
              <h4 className="font-bold text-lg text-[#29282b] mb-2">
                {link.title}
              </h4>
              <p className="text-sm text-[#29282b]/70 mb-3">
                {link.description}
              </p>
              <a href="#" className="text-sm text-[#8faaba] hover:text-[#7a8fa0] font-medium transition-colors">
                Подробнее →
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Блок с хештегами */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#29282b]/10">
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#уголовноеправо</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#кража</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#уголовнаяответственность</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#адвокат</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#онлайнконсультация</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#защитаправ</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#уголовноедело</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#ст158УКРФ</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#правоваяподдержка</span>
            <span className="text-sm text-[#8faaba] hover:text-[#7a8fa0] transition-colors cursor-pointer">#юридическаяконсультация</span>
          </div>
        </div>
      </div>
    </div>
  );
}