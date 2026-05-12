'use client';

import { DBQuestion } from '@/src/interfaces/db';
import { Shield, Lock, Scale, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { JobDataI } from '@/src/interfaces/form';
import { StatusPagePropsI } from '@/src/interfaces/component';
import { CustomGetRequest } from "@/src/libs/request"
import { ChatMessage } from "@/src/app/components/data/ChatMessage";
import { statusesDesign, StatusColorI, QuestionStatusesE } from '@/src/interfaces/data';

let isStatus = false

export function StatusPage({ slug }: StatusPagePropsI) {
  const [data, setData] = useState<DBQuestion|null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMessages, setIsMessages] = useState(false);
  const [messages, setMessages] = useState<JobDataI | null>(null);
  const [caseFinalStatus, setCaseFinalStatus] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      setIsLoading(true);
      if(!isStatus) {
        setCaseFinalStatus(false)
        const response = await fetch('/api/requests/' + slug + '/');
        const newData: DBQuestion = await response.json();
        if([QuestionStatusesE.Spam, QuestionStatusesE.Approved].includes(newData.status)) {
          isStatus = true
          setIsLoading(false);
          setCaseFinalStatus(true)
        }
        setData(newData); // Updating state causes the component to re-render
      }
    }, 5000); // Fetch every 5 seconds

    return () => clearInterval(intervalId); // Cleanup
  }, [slug]);

  useEffect(() => {
    if(data && data.id) {
      const path = "/requests/" + data.id
      const request = {parent_id: data.id}
      
      const fetchData = async () => {
          const jobData = await CustomGetRequest(path, request)
          console.log('jobData', jobData)
          console.log('jobData count', jobData.count)
          if(jobData.status) {
              const count = jobData.count ?? 0
              setMessages({data: jobData.data, count: count})
              setIsMessages(true)
          }
      };

      fetchData();
    }
      
  }, [data, data?.id]);

  useEffect(() => {
    if(messages && isMessages) {

    }
  }, [messages, isMessages]);

  const description = caseFinalStatus ? 
    ('Ваш запрос был рассмотрен профильным специалистом. Ниже представлено подробное заключение и рекомендации, основанные на описанной вами ситуации. Мы рекомендуем внимательно ознакомиться с ответом — он содержит важные пояснения и возможные дальнейшие действия.') : 
    ('Персональная страница запроса на юридическую консультацию.')

  const title = caseFinalStatus ? 'Экспертное заключение по вашему вопросу' : 'Статус вашего обращения'
  const caseId = data && data.id ? data.id : ''

  const createdAt = data && data.created_at ? format(new Date(data.created_at), "dd.MM.yyyy hh:ii") : null
  const userQuestion = data && data.question ? data.question : null
  const lawyer = data && data.lawyer ? 
    (caseFinalStatus ? 
      ('Ответ адвоката ' + data.lawyer + ' готов.') : 
      'Над вашей заявкой работает адвокат ' + data.lawyer + '.') : 
    'Ваша заявка еще не взята в разработку.'
  const statusColor: StatusColorI = data && data.status && [0,1,2,3,4].includes(data.status) ? statusesDesign[data.status] : statusesDesign[1]


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
      {/* Top — header and trust block */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#29282b] mb-4">{title}</h1>
          <p className="text-lg text-[#29282b]/70 max-w-3xl mx-auto">{description}</p>
        </div>

        {/* Trust block */}
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

      {/* Center — main status block */}
      <div className="bg-[#323c54] max-w-5xl mx-auto rounded-t-[16px]">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative shrink-0">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
                <p className="font-['Inter:Medium',sans-serif] font-medium leading-[32px] not-italic relative shrink-0 text-[24px] text-white whitespace-nowrap">
                  Дело #{caseId}
                </p>
              </div>
            </div>
            {statusColor && (<div className={`bg-[${statusColor.color}] relative rounded-full shrink-0 px-4 py-1.5`}>
              <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] text-[13px] text-white whitespace-nowrap">
                {statusColor.name}
              </p>
            </div>)}
          </div>
          {createdAt && (<p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] text-[14px] text-[rgba(255,255,255,0.7)] mb-4">
            Дата обращения: {createdAt}
          </p>)}
          {lawyer && (<p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] text-[14px] text-[rgba(255,255,255,0.7)] mb-4">
            {lawyer}
          </p>)}
          {userQuestion && (<p className="font-['Inter:Regular',sans-serif] font-normal leading-[24px] text-[16px] text-white">
            {userQuestion}
          </p>)}
        </div>
      </div>

      {/* Replies */}
      <div className="max-w-5xl mx-auto bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <h2 className="font-['Inter:Medium',sans-serif] font-medium leading-[28px] text-[18px] text-[#29282b] mb-6">Ход вашего дела #{caseId}</h2>
          {messages && (<div className="max-h-[500px] overflow-y-auto space-y-0 pr-2" style={{scrollbarWidth: 'thin', scrollbarColor: '#8faaba #f1f1f1'}}>
            <style>{`
              div::-webkit-scrollbar {
                width: 8px;
              }
              div::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
              }
              div::-webkit-scrollbar-thumb {
                background: #8faaba;
                border-radius: 10px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #7a8fa0;
              }
            `}</style>
            
            {/* Messages */}
            {messages.data.map((message) => (
              <ChatMessage key={'user-reply-' + message.id} message={message} />
            ))}
            
          </div>)}
          
          
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="max-w-5xl mx-auto bg-white flex flex-col items-center gap-4 mt-8 pb-8">
        <div className="flex gap-4 w-full max-w-[800px]">
          <button className="bg-[#323c54] hover:bg-[#3f4b66] text-white font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[16px] px-8 py-4 rounded-[12px] transition-colors flex-1">
            Задать свой вопрос юристу
          </button>
          <button className="bg-[#87B7CE] hover:bg-[#72a3b8] text-white font-['Inter:Medium',sans-serif] font-medium leading-[20px] text-[16px] px-8 py-4 rounded-[12px] transition-colors flex-1">
            Зарегистрироваться бесплатно
          </button>
        </div>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[24px] text-[14px] text-[rgba(41,40,43,0.5)] text-center mt-2">
          Уже более 12 450 человек получили консультацию за последние 30 дней
        </p>
      </div>

      {/* "While you are here" block */}
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

      {/* Hashtags block */}
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