'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PaginationApp } from './pagination';
import { ProfileListData } from './profile-list-data';
import { ProfileListWindowI } from '@/src/interfaces/form';
import { Check, Link as LucideLink } from "lucide-react";
import { DBQuestion } from '@/src/interfaces/db';
import { CaseModal } from "@/src/app/components/popups/CaseModal";
import RequestFormWindow from "@/src/app/components/popups/RequestFormWindow";

export function ProfileQuestionList({user}: ProfileListWindowI) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItem, setTotalItem] = useState(0);
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState("");
  const [selectedCase, setSelectedCase] = useState<DBQuestion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openRatingSection, setOpenRatingSection] = useState(false);
  const [activeForm, setActiveForm] = useState<"new-question" | null>(null);
  const [isRefresh, setIsRefresh] = useState(false);

  const itemsPerPage = 3
  console.log('ProfileQuestionList totalItem', totalItem)

  const setCloseProfileWindow = () => {
    console.log('setCloseProfileWindow')
    setActiveForm(null)
  }

  const openNewQuestionWindow = () => {
    console.log('openNewQuestionWindow')
    setActiveForm('new-question')
  }

  const setTotalItemCommom = (newTotal: number) => {
    console.log('setTotalItemCommom newTotal', newTotal)
    setTotalItem(newTotal)
  }

  const setCurrentCommom = (newCurrent: number) => {
    console.log('setCurrentCommom newCurrent', newCurrent)
    setCurrentPage(newCurrent)
  }

  const openNewQuestionWindowInner = () => {
    console.log('openNewQuestionWindowInner')
    openNewQuestionWindow()
  }

  const handleCaseClick = (caseItem: DBQuestion, openRating?: boolean) => {
    setSelectedCase(caseItem);
    setIsModalOpen(true);
    setOpenRatingSection(openRating || false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOpenRatingSection(false);
    setTimeout(() => setSelectedCase(null), 300);
  };

  const domainUrl = process.env.NEXT_PUBLIC_URL
  
  const handleShareLink = (caseNumber: string) => {
    const link = domainUrl + '/consultation/' + caseNumber + '/';
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setShowLinkCopied(true);
    setTimeout(() => setShowLinkCopied(false), 3000);
  };
    
  return (
    <div className="bg-[#3d4b5e] rounded-[24px] p-[40px]">
        <div className="flex items-center justify-between mb-[24px]">
            <h2 className="font-['Inter:Bold',sans-serif] font-bold leading-[32px] text-[24px] text-white enki-profile-list-h2">Мои вопросы</h2>
            <Link href="#" onClick={openNewQuestionWindowInner}
                className="bg-[#87b7ce] h-[50px] px-[32px] rounded-[12px] font-['Inter:Medium',sans-serif] font-medium text-[16px] text-white hover:bg-[#6fa2b8] transition-colors enki-profile-btn"
            >Задать новый вопрос юристу</Link>
        </div>
        <div className="overflow-x-auto enki-profile-list">
          <div className="grid grid-cols-[100px_1fr_150px_150px_150px_150px_140px] gap-4 px-6 py-4 border-b border-[rgba(255,255,255,0.1)]">
            <div className="text-sm text-[rgba(255,255,255,0.9)] font-medium">ID</div>
            <div className="text-sm text-[rgba(255,255,255,0.9)] font-medium">Вопрос</div>
            <div className="text-sm text-[rgba(255,255,255,0.9)] font-medium">Дата</div>
            <div className="text-sm text-[rgba(255,255,255,0.9)] font-medium">Ответ</div>
            <div className="text-sm text-[rgba(255,255,255,0.9)] font-medium">Статус</div>
            <div className="text-sm text-[rgba(255,255,255,0.9)] font-medium">Последняя активность</div>
            <div className="text-sm text-[rgba(255,255,255,0.9)] font-medium text-center">Действия</div>
          </div>

          <ProfileListData totalItems={totalItem} currentPage={currentPage} id={parseInt(user.id)} itemsPerPage={itemsPerPage}
                onTotalItemChamge={setTotalItemCommom} handleShareLink={handleShareLink} isRefresh={isRefresh}
                onCaseClick={handleCaseClick} />
          <PaginationApp activePage={currentPage} itemsPerPage={itemsPerPage} onPageChange={setCurrentCommom} totalItems={totalItem} />
        </div>

        {/* Информация внизу */}
        <div className="mt-4 text-sm text-[rgba(255,255,255,0.6)]">Всего обращений: {totalItem}</div>

        {/* Уведомление о копировании ссылки */}
        {showLinkCopied && (
          <>
            {/* Затемненный фон */}
            <div
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={() => setShowLinkCopied(false)}
            />

            {/* Модальное окно уведомления */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div
                className="bg-[#323c54] rounded-2xl shadow-2xl w-full max-w-md p-8 pointer-events-auto animate-in fade-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Большая галочка */}
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center justify-center size-20 rounded-full bg-[#8faaba]">
                    <Check className="size-12 text-white stroke-[2.5]" />
                  </div>
                </div>

                {/* Заголовок */}
                <h3 className="text-2xl text-white font-medium text-center mb-3">
                  Ссылка скопирована
                </h3>

                {/* Ссылка */}
                <div className="bg-[rgba(143,170,186,0.2)] rounded-lg p-4 mb-6 border border-[rgba(255,255,255,0.1)]">
                  <div className="flex items-center gap-3">
                    <LucideLink className="size-5 text-[#8faaba] shrink-0" />
                    <p className="text-sm text-[rgba(255,255,255,0.9)] break-all">
                      {copiedLink}
                    </p>
                  </div>
                </div>

                {/* Кнопка закрыть */}
                <button
                  onClick={() => setShowLinkCopied(false)}
                  className="w-full py-3 px-4 rounded-lg bg-[#8faaba] hover:bg-[#7a8fa0] text-white font-medium transition-colors"
                >Закрыть</button>
              </div>
            </div>
          </>
        )}

        {selectedCase && (
          <CaseModal
            user={user}
            caseItem={selectedCase}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            openRatingSection={openRatingSection}
            openNewQuestionWindow={openNewQuestionWindowInner}
          />
        )}

        <RequestFormWindow isOpen={activeForm === "new-question"} onClose={setCloseProfileWindow} setCurrent={setIsRefresh} setPage={setCurrentCommom}/>
    </div>
  )
}