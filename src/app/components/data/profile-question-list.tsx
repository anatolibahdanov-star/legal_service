import Link from 'next/link';
import { getQuestions } from "@/src/repositories/requests/repo";

interface IdI {
    id: number;
}

export async function ProfileQuestionList({id}: IdI) {
    const questions = await getQuestions("1", "30", ['id', 'DESC'], {user_id: id});
    if(questions === null) {
        return (
            <div className="text-center py-[60px]">
                <p className="font-['Inter:Regular',sans-serif] font-normal text-[16px] text-[rgba(255,255,255,0.6)]">
                    У вас пока нет вопросов
                </p>
            </div>
        )
    }

    const domainUrl = process.env.NEXTAUTH_URL
    return (
        <>
            {/* Таблица */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[rgba(255,255,255,0.1)]">
                    <th className="text-left py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      ID
                    </th>
                    <th className="text-left py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      Вопрос
                    </th>
                    <th className="text-left py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      Дата
                    </th>
                    <th className="text-left py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      Ответ
                    </th>
                    <th className="text-left py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      Статус
                    </th>
                    <th className="text-left py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      Последняя активность
                    </th>
                    <th className="text-center py-[16px] px-[12px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.7)]">
                      Открыть
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => (
                    <tr 
                      key={question.id} 
                      className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                    >
                      <td className="py-[16px] px-[12px] font-['Inter:Regular',sans-serif] font-normal text-[14px] text-white">
                        #{question.id}
                      </td>
                      <td className="py-[16px] px-[12px]">
                        <a 
                          href={domainUrl + '/consultation/' + question.uuid + '/'}
                          className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[#87b7ce] hover:text-[#6fa2b8] transition-colors line-clamp-2"
                        >
                          {question.question}
                        </a>
                      </td>
                      <td className="py-[16px] px-[12px] font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.8)]">
                        {(new Date(question.created_at)).toISOString().split('T')[0]}
                      </td>
                      <td className="py-[16px] px-[12px]">
                        {question.answer ? (
                          <a 
                            href={domainUrl + '/consultation/' + question.uuid + '/'}
                            className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[#87b7ce] hover:text-[#6fa2b8] transition-colors line-clamp-2"
                          >
                            {question.answer.substring(0, 50)}...
                          </a>
                        ) : (
                          <span className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-[16px] px-[12px]">
                        <span className={`px-[12px] py-[6px] rounded-[8px] font-['Inter:Medium',sans-serif] font-medium text-[12px] inline-block ${
                          question.status === 4 
                            ? "bg-[#4ade80]/20 text-[#4ade80]" 
                            : ( [1,2].includes(question.status) ? "bg-[#fbbf24]/20 text-[#fbbf24]" : "bg-[#800000]/20 text-[#800000]")
                        }`}>
                          {question.status === 4 ? "Отвечено" : ([1,2].includes(question.status) ? "В обработке" : "Отклонено")}
                        </span>
                      </td>
                      <td className="py-[16px] px-[12px] font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.8)]">
                        {(new Date(question.created_at)).toISOString().split('T')[0]}
                      </td>
                      <td className="py-[16px] px-[12px] text-center">
                        <Link href={domainUrl + '/consultation/' + question.uuid + '/'}
                          className="bg-[#87b7ce] px-[20px] py-[8px] rounded-[8px] font-['Inter:Medium',sans-serif] font-medium text-[14px] text-white hover:bg-[#6fa2b8] transition-colors"
                        >
                          Открыть
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </>
    )
}