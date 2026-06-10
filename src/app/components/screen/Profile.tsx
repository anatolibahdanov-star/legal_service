import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"
import { User } from "next-auth";
import { useRedirect } from 'react-admin';
import { redirect } from 'next/navigation';
import Image from 'next/image'
import Link from 'next/link';
import Swal from 'sweetalert2'
import { toast } from 'sonner'

import { Upload, Eye, EyeOff, Star, Edit, Trash2, StarOff, Share2, Check, CreditCard, Link as LucideLink } from "lucide-react";

import { CustomGetRequest, CustomRequest } from "@/src/libs/request";
import { emitBalanceRefresh } from "@/src/libs/balanceEvents";
import { isPhoneEmail } from "@/src/libs/phoneIdentity";
import { DBQuestion, DBUser } from "@/src/interfaces/db";
import { profileDataQuestionsI } from '@/src/interfaces/component';
import { QuestionStatusesE, dFormat } from "@/src/interfaces/data";
import { format } from 'date-fns';
import RequestFormWindow from "@/src/app/components/popups/RequestFormWindow";
import PayQuestionWindow from "@/src/app/components/popups/PayQuestionWindow";
import {ProfileBalance} from "@/src/app/components/screen/profile/ProfileBalance"
import { PaginationApp } from '@/src/app/components/data/pagination';
import { Tooltip } from "@/src/app/components/Tooltip";
import { CaseModal } from "@/src/app/components/popups/CaseModal";
import {
  PdfActionsModal,
  PdfIcon,
  PdfSuccessModal,
  type PdfShareChannel,
} from "@/src/app/components/popups/pdf";
import { AlfaOrderStatusE, OrderStatusE } from "@/src/interfaces/payment";

export const detectOrderStatusByAlpha = (status: number): OrderStatusE => {
    let finalStatus = OrderStatusE.New
    switch(status) {
        case AlfaOrderStatusE.New:
            finalStatus = OrderStatusE.New
        case AlfaOrderStatusE.Hold:
        case AlfaOrderStatusE.Register:
            finalStatus = OrderStatusE.InProgress
        case AlfaOrderStatusE.Returned:
        case AlfaOrderStatusE.DeclineAuth:
        case AlfaOrderStatusE.CancelAuth:
            finalStatus = OrderStatusE.Unpaid
        case AlfaOrderStatusE.Auth:
            finalStatus = OrderStatusE.Paid
        default:
            finalStatus = OrderStatusE.Unknown
    }
    return finalStatus
}

interface AdminJobComponentPropsI {
    jobId: string
}

const AdminJobComponent = ({jobId}: AdminJobComponentPropsI) => {
    const redirect = useRedirect();
    const handleButtonClick = () => {
        redirect('/requests/' + jobId);
    };

    return (
        <button onClick={handleButtonClick} className="flex items-center gap-1 text-xs text-[#2196f3] hover:underline">
            <Edit className="w-3 h-3" /> EDIT
        </button>
    );
};

interface FormDataI {
  name: string|null;
  username: string|null;
  email: string|null;
  phone: string|null;
}

interface ProfileAccountPropsI {
  data: DBUser|null;
  is_user?: boolean;
  setData: (data: DBUser) => void;
  user: User;
}

const ProfileAccount = ({data, is_user, setData, user}: ProfileAccountPropsI) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({old_password: "", new_password: "", repeat_new_password: "",});
  const [showPasswords, setShowPasswords] = useState({current: false, new: false, confirm: false,});
  const [formData, setFormData] = useState<FormDataI>({name: null, username: null, email: null, phone: null,});

  const name = formData?.name ?? data?.name ?? user?.name ?? ''
  const username = formData?.username ?? data?.username ?? user?.username ?? ''
  // Телефон из phone-регистрации. Редактируется без СМС/подтверждений —
  // ввёл и сохранил. Пустая строка в formData (после ручной очистки) берётся
  // как есть; иначе показываем телефон из data/session.
  const phone = formData?.phone ?? data?.phone ?? ''
  // При phone-OTP регистрации бэк генерирует placeholder вида
  // <phone>@phone.local. В LK его показывать не нужно — поле должно быть
  // пустым, пока пользователь сам не введёт реальный email. Если в formData
  // уже что-то есть (включая пустую строку после ручной очистки) — берём её
  // как есть; иначе фильтруем placeholder из data/session.
  const rawEmail = formData?.email ?? data?.email ?? user?.email ?? ''
  const email = formData?.email !== null && formData?.email !== undefined
    ? formData.email
    : (isPhoneEmail(rawEmail) ? '' : rawEmail)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {setAvatarUrl(null);};

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const entity = is_user ? "users" : "administrators"

  const handleSave = async () => {
    const path = "/" + entity + "/" + user.id
    // Если в поле пусто (юзер ещё не ввёл свой email после phone-OTP
    // регистрации), отправляем исходный placeholder из БД, чтобы не
    // затереть колонку email пустой строкой.
    const emailToSave = email || rawEmail
    const adminUpdatedData = {
        name: name,
        email: emailToSave,
        username: username,
        phone: phone,
        status: data?.status,
        is_super: data?.is_super,
    }
    const adminData = await CustomRequest(path, adminUpdatedData, "PUT")
    if(adminData.status) {
        console.log("Profile account after save adminData.data", adminData.data)
        setData(adminData.data)
        setFormData({name: adminData.data.name, username: adminData.data.username, email: adminData.data.email, phone: adminData.data.phone ?? '',})
        Swal.fire({
          title: "Данные о пользователе обновлены.",
          icon: "success",
          draggable: true
        });
        return true;
    }
    Swal.fire({
      icon: "error",
      title: "Ошибка при сохранении",
      text: "Не удалось сохранить данные о пользователе."
    });
    return false;
  };

  const handleChangePassword = async () => {
    // "Текущий пароль" скрыт из UI; в guard его не требуем (на сервер он и так не уходит).
    if (!passwordData.new_password || !passwordData.repeat_new_password) {
      alert("Не все поля формы смены пароля заполнены.");
      return;
    }
    if (passwordData.new_password !== passwordData.repeat_new_password) {
      alert("Новый пароль и Подтвержденный пароль не совпадают.");
      return;
    }
    const path = "/" + entity + "/" + user.id
    const adminUpdatedData = {
        name: name,
        // То же, что в handleSave — не затираем placeholder пустой строкой.
        email: email || rawEmail,
        username: username,
        // Телефон передаём и при смене пароля, иначе saveUser затрёт его в NULL.
        phone: phone,
        new_password: passwordData.new_password,
        status: data?.status,
        is_super: data?.is_super,
    }
    const adminData = await CustomRequest(path, adminUpdatedData, "PUT")
    if(adminData.status) {
        setData(adminData.data)
        setPasswordData({old_password: "", new_password: "", repeat_new_password: "",});
        alert("Пароль изменен");
        return true;
    }

    alert("Не удалось изменить пароль. Ошибка на сервере.")
    setPasswordData({old_password: "", new_password: "", repeat_new_password: "",});
  };

  const handleCancel = () => { console.log("Cancelled");};

  const entityName = is_user ? 'Вы' : "Юрист"

  return (
    <>
      {/* Profile and Password Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Change Profile */}
        <div className="bg-white rounded shadow-sm border border-[#e0e0e0] p-6">
          <h2 className="text-base text-[#333] mb-1">Изменить фото профиля</h2>
          <p className="text-xs text-[#757575] mb-4">Загрузите новое фото</p>

          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-[#2196f3] flex items-center justify-center text-white text-xl mb-3 overflow-hidden">
              {avatarUrl ? (<Image src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />) : (entityName)}
            </div>

            {/* Name and Rating */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-[#333]">{data?.name}</span>
              {!is_user && (<div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-[#fbc02d] fill-[#fbc02d]" />
                <span className="text-sm text-[#333]">{data?.rating}</span>
              </div>)}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-3">
              <label className="px-4 py-1.5 bg-[#2196f3] text-white rounded hover:bg-[#1976d2] transition-colors text-sm cursor-pointer">
                Загрузить
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              <button onClick={handleReset}
                className="px-4 py-1.5 border border-[#e0e0e0] text-[#f44336] rounded hover:bg-[#f5f5f5] transition-colors text-sm"
              >Сбросить</button>
            </div>

            <p className="text-xs text-[#757575] text-center">
              Допустимы JPG, GIF или PNG. Макс. размер 800К
            </p>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded shadow-sm border border-[#e0e0e0] p-6">
          <h2 className="text-base text-[#333] mb-1">Изменить пароль</h2>
          <p className="text-xs text-[#757575] mb-4">Для изменения пароля подтвердите здесь</p>

          <div className="space-y-3">
            {/* "Текущий пароль" скрыто из UI per product spec; логика скоро вернётся — JSX оставлен. */}
            <div className="hidden">
              <label className="block text-xs text-[#757575] mb-1.5">Текущий пароль</label>
              <div className="relative">
                <input type="password" name="old_password" value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-10 border border-[#e0e0e0] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2196f3] focus:border-[#2196f3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#757575] mb-1.5">Новый пароль</label>
              <div className="relative">
                <input type="password" name="new_password" value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-10 border border-[#e0e0e0] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2196f3] focus:border-[#2196f3]"
                />
                <button type="button" onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#333]"
                >{showPasswords.new ? (<EyeOff className="w-4 h-4" />) : (<Eye className="w-4 h-4" />)}</button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#757575] mb-1.5">Подтвердите пароль</label>
              <div className="relative">
                <input type="password" name="repeat_new_password" value={passwordData.repeat_new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, repeat_new_password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-10 border border-[#e0e0e0] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2196f3] focus:border-[#2196f3]"
                />
                <button type="button" onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#333]"
                >{showPasswords.confirm ? (<EyeOff className="w-4 h-4" />) : (<Eye className="w-4 h-4" />)}</button>
              </div>
            </div>

            <div className="pt-2">
              <button type="button" onClick={async () => {await handleChangePassword()}}
                className="px-6 py-2 bg-[#2196f3] text-white rounded hover:bg-[#1976d2] transition-colors text-sm"
              >Изменить пароль</button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="bg-white rounded shadow-sm border border-[#e0e0e0] p-6 mb-6">
        <h2 className="text-base text-[#333] mb-4">Личные данные</h2>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {/* Your Name */}
          <div>
            <label className="block text-xs text-[#757575] mb-1.5">Ваше имя</label>
            <input type="text" name="name" value={name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Введите ваше имя"
              className="w-full px-3 py-2 border border-[#e0e0e0] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2196f3] focus:border-[#2196f3]"
            />
          </div>

          {/* Username */}
          {!is_user && (<div>
            <label className="block text-xs text-[#757575] mb-1.5">Username</label>
            <input type="text" name="username" value={username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="ivanov_lawyer"
              className="w-full px-3 py-2 border border-[#e0e0e0] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2196f3] focus:border-[#2196f3]"
            />
          </div>)}

          {/* Email */}
          <div>
            <label className="block text-xs text-[#757575] mb-1.5">E-mail</label>
            <input type="email" name="email" value={email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="info@example.com"
              className="w-full px-3 py-2 border border-[#e0e0e0] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2196f3] focus:border-[#2196f3]"
            />
          </div>

          {/* Phone — для пользователей, зарегистрированных по телефону.
              Редактируется напрямую: ввёл → Сохранить → сохранилось, без СМС. */}
          {is_user && (<div>
            <label className="block text-xs text-[#757575] mb-1.5">Телефон</label>
            <input type="tel" name="phone" value={phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+7 900 000-00-00"
              className="w-full px-3 py-2 border border-[#e0e0e0] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#2196f3] focus:border-[#2196f3]"
            />
          </div>)}
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-end gap-3">
        <button onClick={handleCancel}
          className="px-6 py-2 border border-[#e0e0e0] text-[#f44336] rounded hover:bg-[#f5f5f5] transition-colors text-sm"
        >Отмена </button>
        <button onClick={async () => {await handleSave()}}
          className="px-6 py-2 bg-[#2196f3] text-white rounded hover:bg-[#1976d2] transition-colors text-sm"
        >Сохранить</button>
      </div>
    </>
  )
}

interface ProfileJobListPropsI {
  is_user?: boolean;
  user: User;
}

const ProfileJobList = ({is_user, user}: ProfileJobListPropsI) => {
  const [jobsData, setJobsData] = useState<profileDataQuestionsI | null>(null);
  const [totalItem, setTotalItem] = useState(0);
  const [activeForm, setActiveForm] = useState<"new-question" | null>(null);
  const [isRefresh, setIsRefresh] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState<DBQuestion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openRatingSection, setOpenRatingSection] = useState(false);
  const [copiedLink, setCopiedLink] = useState("");
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  /** id вопроса, для которого открыто окно оплаты; null — окно закрыто. */
  const [payingQuestionId, setPayingQuestionId] = useState<string | number | null>(null);
  /** Question the PDF actions modal is open for; null when closed. */
  const [pdfCase, setPdfCase] = useState<DBQuestion | null>(null);
  /** Cached-PDF flag for the currently-open question — toggles the modal's
   *  download button label between "Загружаем…" and "Генерируем…". */
  const [pdfHasCached, setPdfHasCached] = useState(false);
  /** Payload for the post-share success modal; null when closed. */
  const [pdfSuccess, setPdfSuccess] = useState<{
    questionId: string | number;
    questionDate: string;
    channel: PdfShareChannel;
  } | null>(null);

  const getStatusBadge = (status: number) => {
      const isValidColor = (value: number): value is QuestionStatusesE => {
          return Object.values(QuestionStatusesE).includes(value as QuestionStatusesE);
      }

      let key: keyof typeof QuestionStatusesE = "Disabled"
      if(isValidColor(status)) {
          key = QuestionStatusesE[status] as keyof typeof QuestionStatusesE
      }

      const statusMap = {
          Approved: { label: "Отвечено", color: "bg-[#10b981] text-white" },
          New: { label: "В ожидании", color: "bg-[#f59e0b] text-white" },
          Disabled: { label: "Ошибка", color: "bg-[#ef4444] text-white" },
          Spam: { label: "СПАМ", color: "bg-[#ef4444] text-white" },
          InProgress: { label: "В работе", color: "bg-[#3b82f6] text-white" },
          Unpaid: { label: "Не оплачен", color: "bg-[#94a3b8] text-white" },
      };

      const statusInfo = statusMap[key];

      return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
      );
  };

  const itemsPerPage = 10
  const domainUrl = process.env.NEXT_PUBLIC_URL
  useEffect(() => {
      const path = "/requests"
      const sort = is_user ? ['id', 'DESC'] : ['updated_at', 'DESC']
      const filter = is_user ? {user_id: user.id} : {admin_id: user.id}
      const request = {
          page: currentPage,
          limit: itemsPerPage,
          sort: JSON.stringify(sort),
          filter: JSON.stringify(filter)
      }
      // Define an asynchronous function inside the effect
      const fetchData = async () => {
          const questionData = await CustomGetRequest(path, request)
          if(questionData.status) {
              const count = questionData.count ?? 0
              setJobsData({data: questionData.data, count: count})
              setTotalItem(count)
          }
      };

      // Call the async function
      fetchData();
  }, [currentPage, is_user, user.id, isRefresh]);

  const setCloseProfileWindow = () => {
    console.log('setCloseProfileWindow')
    setActiveForm(null)
  }

  const openNewQuestionWindow = () => {
    console.log('openNewQuestionWindow')
    setActiveForm('new-question')
  }

  const openNewQuestionWindowInner = () => {
    console.log('openNewQuestionWindowInner')
    openNewQuestionWindow()
  }

  const setCurrentCommom = (newCurrent: number) => {
    console.log('setCurrentCommom newCurrent', newCurrent)
    setCurrentPage(newCurrent)
  }

  const handleCaseClick = (caseItem: DBQuestion, openRating?: boolean) => {
    setSelectedCase(caseItem);
    setIsModalOpen(true);
    setOpenRatingSection(openRating || false);
  };

  const handleShareLink = (caseNumber: string) => {
    const link = domainUrl + '/consultation/' + caseNumber + '/';
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setShowLinkCopied(true);
    setTimeout(() => setShowLinkCopied(false), 3000);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOpenRatingSection(false);
    // Toggle через функциональный сеттер — иначе если isRefresh уже true,
    // React пропустит обновление и useEffect рефетча списка не сработает
    // (рейтинг не появится в списке после закрытия модалки).
    setIsRefresh(prev => !prev)
    setTimeout(() => setSelectedCase(null), 300);
  };

  const jobs = jobsData?.count && jobsData?.count > 0 ? jobsData?.data : []
  

  return (
    <>
      {is_user && (
        <div className="bg-white rounded shadow-sm border border-[#e0e0e0] overflow-hidden px-4 mb-6">
          <div className="flex items-center justify-between mb-[24px]">
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-foreground">Мои вопросы</h2>
                <p className="mt-4 text-sm font-semibold text-foreground">Всего обращений: {totalItem}</p>
              </div>
              <Link href="#" onClick={openNewQuestionWindowInner}
                  className="mt-5 inline-block rounded-lg bg-[#EE2A23] px-6 py-2.5 text-sm font-medium text-alfa-red-foreground transition-opacity hover:opacity-90"
              >Задать новый вопрос юристу</Link>
          </div>
        </div>
      )}
      {/* Recent Cases Table */}
      <div className="bg-white rounded shadow-sm border border-[#e0e0e0] overflow-hidden">
        <div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e0e0e0]">
                <th className="text-left p-4 text-xs text-[#757575] font-normal">
                  <input type="checkbox" className="cursor-pointer" />
                </th>
                <th className="text-left p-4 text-xs text-[#757575] font-normal">Id</th>
                {!is_user && (<th className="text-left p-4 text-xs text-[#757575] font-normal">Пользователь</th>)}
                <th className="text-left p-4 text-xs text-[#757575] font-normal">Категория</th>
                <th className="text-left p-4 text-xs text-[#757575] font-normal">Вопрос</th>
                <th className="text-left p-4 text-xs text-[#757575] font-normal">Статус</th>
                <th className="text-left p-4 text-xs text-[#757575] font-normal">Дата</th>
                <th className="text-left p-4 text-xs text-[#757575] font-normal">Действия</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((caseItem) => (
                <tr key={caseItem.id} className="border-b border-[#e0e0e0] hover:bg-[#f5f5f5]">
                  <td className="p-4"><input type="checkbox" className="cursor-pointer" /></td>
                  <td className="p-4 text-sm text-[#333]">{caseItem.id}</td>
                  {!is_user && (<td className="p-4 text-sm text-[#333]">{caseItem.username}</td>)}
                  <td className="p-4 text-sm text-[#2196f3]">{caseItem.category_name}</td>
                  <td className="p-4 text-sm text-[#333] max-w-xs truncate">
                    <Link href={domainUrl + '/consultation/' + caseItem.uuid + '/'} target="_blank" rel="noopener noreferrer" 
                        className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[#87b7ce] hover:text-[#6fa2b8] transition-colors line-clamp-2"
                    >{caseItem.question}</Link>
                  </td>
                  <td className="p-4 text-sm text-[#333] min-w-[180px]">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(caseItem.job_status)}
                      {is_user && caseItem.job_status === QuestionStatusesE.Unpaid && (
                        <button
                          type="button"
                          onClick={() => setPayingQuestionId(caseItem.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#323c54] hover:bg-[#3d4b5e] text-white text-xs font-medium px-3 py-1.5 transition-colors"
                        >
                          <CreditCard className="size-4" />
                          Оплатить
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-[#333]">{format((new Date(caseItem.updated_at)), dFormat)}</td>
                  <td className="p-4 flex items-center justify-center gap-2"> 
                    {!is_user ? (
                      <AdminJobComponent jobId={caseItem.id} />
                    ) : (
                      <>
                        <Tooltip content="Открыть дело">
                          <button
                            onClick={() => handleCaseClick(caseItem)}
                            className="p-2 rounded-lg border-2 border-[#8faaba] text-[#8faaba] hover:bg-[#8faaba] hover:text-white transition-colors"
                          >
                            <Eye className="size-5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={caseItem.rating ? `Изменить оценку (${caseItem.rating})` : "Оценить"}>
                          <button
                            onClick={() => handleCaseClick(caseItem, true)}
                            className={`p-2 rounded-lg transition-colors relative ${
                              caseItem.rating 
                                ? 'border-2 border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white' 
                                : 'border-2 border-[#8faaba] text-[#8faaba] hover:border-[#8faaba] hover:text-[#8faaba]'
                            }`}
                          >
                            {caseItem.rating ? (
                              <>
                                <Star className="size-5 fill-[#10b981]" />
                                {/* Rating badge */}
                                <span className="absolute -top-2 -right-2 bg-[#10b981] text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[24px] flex items-center justify-center shadow-md">
                                  {caseItem.rating}
                                </span>
                              </>
                            ) : (
                              <StarOff className="size-5" />
                            )}
                          </button>
                        </Tooltip>
                        <Tooltip content="Поделиться ссылкой">
                          <button
                            onClick={() => handleShareLink(caseItem.uuid)}
                            className="p-2 rounded-lg border-2 border-[#8faaba] text-[#8faaba] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors"
                          >
                            <Share2 className="size-5" />
                          </button>
                        </Tooltip>
                        {(() => {
                          const isAnswered = caseItem.job_status === QuestionStatusesE.Approved;
                          const tooltip = isAnswered
                            ? "Действия с PDF"
                            : "PDF будет доступен после ответа юриста";
                          return (
                            <Tooltip content={tooltip}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isAnswered) return;
                                  setPdfHasCached(false);
                                  setPdfCase(caseItem);
                                  // Best-effort cache probe; if it fails the
                                  // modal stays on "Генерируем…" which is the
                                  // safe default.
                                  fetch(`/api/pdf/${caseItem.short_id ?? caseItem.uuid}/exists`)
                                    .then((r) => r.ok ? r.json() : null)
                                    .then((d) => setPdfHasCached(!!d?.exists))
                                    .catch(() => {});
                                }}
                                disabled={!isAnswered}
                                aria-label={tooltip}
                                className={`p-2 rounded-lg border-2 transition-colors ${
                                  isAnswered
                                    ? "border-[#8faaba] text-[#8faaba] hover:border-[#ef4444] hover:text-[#ef4444]"
                                    : "border-[#e0e0e0] text-[#c0c0c0] cursor-not-allowed opacity-60"
                                }`}
                              >
                                <PdfIcon />
                              </button>
                            </Tooltip>
                          );
                        })()}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {is_user && (
                  <tr className="border-b border-[#e0e0e0] hover:bg-[#f5f5f5]">
                    <td className="p-4" colSpan={7}>
                      <PaginationApp activePage={currentPage} itemsPerPage={itemsPerPage} onPageChange={setCurrentCommom} totalItems={totalItem} />
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {is_user && (<RequestFormWindow isOpen={activeForm === "new-question"} onClose={setCloseProfileWindow}
        setCurrent={setIsRefresh} setPage={setCurrentCommom}/>)}

      {is_user && (
        <PayQuestionWindow
          isOpen={payingQuestionId !== null}
          questionId={payingQuestionId}
          onClose={() => setPayingQuestionId(null)}
          // Тоггл вместо `setIsRefresh(true)` — гарантирует, что useEffect
          // перезапустится и после второй/третьей оплаты подряд.
          onPaid={() => setIsRefresh((prev) => !prev)}
        />
      )}

      {/* Link copy notification */}
      {showLinkCopied && (
        <>
          {/* Dimmed background */}
          <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={() => setShowLinkCopied(false)} />

          {/* Notification modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-[#323c54] rounded-2xl shadow-2xl w-full max-w-md p-8 pointer-events-auto animate-in fade-in zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Large checkmark */}
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center justify-center size-20 rounded-full bg-[#8faaba]">
                  <Check className="size-12 text-white stroke-[2.5]" />
                </div>
              </div>

              {/* Header */}
              <h3 className="text-2xl text-white font-medium text-center mb-3">Ссылка скопирована</h3>

              {/* Link */}
              <div className="bg-[rgba(143,170,186,0.2)] rounded-lg p-4 mb-6 border border-[rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-3">
                  <LucideLink className="size-5 text-[#8faaba] shrink-0" />
                  <p className="text-sm text-[rgba(255,255,255,0.9)] break-all">{copiedLink}</p>
                </div>
              </div>

              {/* Close button */}
              <button onClick={() => setShowLinkCopied(false)}
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

      {pdfCase && (
        <PdfActionsModal
          open={pdfCase !== null}
          onOpenChange={(v) => { if (!v) setPdfCase(null); }}
          questionId={pdfCase.id}
          questionUuid={pdfCase.uuid}
          questionDate={format(new Date(pdfCase.created_at), dFormat)}
          questionText={pdfCase.question}
          hasPdf={pdfHasCached}
          shareLink={`${domainUrl ?? ''}/api/pdf/${pdfCase.short_id ?? pdfCase.uuid}`}
          onDownload={async () => {
            const url = `/api/pdf/${pdfCase.short_id ?? pdfCase.uuid}?download=1`;
            const a = document.createElement('a');
            a.href = url;
            a.download = `enki-answer-${pdfCase.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success('PDF загружается');
          }}
          onPreview={async () => {
            window.open(`/api/pdf/${pdfCase.short_id ?? pdfCase.uuid}`, '_blank', 'noopener,noreferrer');
            toast.success('Предпросмотр открыт в новой вкладке');
          }}
          onSendSms={async (phone) => {
            const res = await fetch(`/api/pdf/${pdfCase.short_id ?? pdfCase.uuid}/sms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => null);
              throw new Error(data?.message ?? 'Не удалось отправить SMS.');
            }
            toast.success('SMS отправлено');
          }}
          onSendEmail={async (email) => {
            const res = await fetch(`/api/pdf/${pdfCase.short_id ?? pdfCase.uuid}/email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => null);
              throw new Error(data?.message ?? 'Не удалось отправить email.');
            }
            toast.success('Email отправлен');
          }}
          onCopyLink={async () => {
            const url = `${domainUrl ?? ''}/api/pdf/${pdfCase.short_id ?? pdfCase.uuid}`;
            toast.success('Ссылка скопирована');
            return url;
          }}
          onShareSuccess={(channel) => {
            const successData = {
              questionId: pdfCase.id,
              questionDate: format(new Date(pdfCase.created_at), dFormat),
              channel,
            };
            // Close the actions modal first, then open the success modal in
            // a separate dialog instance — the small gap keeps the close
            // animation of one from overlapping the open animation of the other.
            setPdfCase(null);
            setTimeout(() => setPdfSuccess(successData), 200);
          }}
        />
      )}

      <PdfSuccessModal
        open={pdfSuccess !== null}
        onOpenChange={(v) => { if (!v) setPdfSuccess(null); }}
        questionId={pdfSuccess?.questionId ?? ""}
        questionDate={pdfSuccess?.questionDate}
        message="PDF успешно отправлен"
      />
    </>
  )
}

interface ProfileScreenPropsI {
  is_user?: boolean;
}

export function ProfileScreen({is_user = false}: ProfileScreenPropsI) {
    const { data: session } = useSession()
    if(!session || !session?.user) {
        redirect('/')
    }
    const user = session.user
    const [activeTab, setActiveTab] = useState<"account" | "cases" | "balance">(() => {
        // Инициализируем синхронно из URL, иначе таб «прыгает» — сначала
        // рендерится дефолтный, потом через эффект подменяется на нужный.
        // Дефолт — «Ваши заявки» (первый таб по новому порядку).
        if (typeof window === "undefined") return "cases";
        const t = new URLSearchParams(window.location.search).get("tab");
        return t === "balance" || t === "cases" || t === "account" ? t : "cases";
    });
    const [data, setData] = useState<DBUser | null>(null);
    
    const entity = is_user ? "users" : "administrators"
    const requestTabName = is_user ? "Ваши заявки" : "Последние 10 дел"
   
    useEffect(() => {
      const path = "/" + entity + "/" + user.id
      const fetchData = async () => {
          const userData = await CustomGetRequest(path)
          console.log('user data', userData)
          if(userData.status) {
              setData(userData.data as DBUser)
          }
      };

      fetchData();
    }, [user, entity]);
  
    const setUserBalance = (additionalBalance: number) => {
        if(additionalBalance && data) {
            const newData = { ...data };
            if(!newData.balance) newData.balance = 0
            const rub = Math.round(additionalBalance / 100);
            newData.balance += rub;
            Swal.fire({
              title: "Успешная операция",
              text: `Ваш баланс успешно пополнен на ${new Intl.NumberFormat("ru-RU").format(rub)} ₽.`,
              icon: "success",
              draggable: true
            });
            setData(newData)
            emitBalanceRefresh()
        }
    }
  // После того как мы прочитали ?tab= для инициализации activeTab, чистим URL,
  // чтобы дальнейший reload не цеплялся за устаревший таб.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "balance" || t === "cases" || t === "account") {
      history.replaceState(null, document.title, window.location.origin + window.location.pathname);
    }
  }, []);

  const windowWidth = is_user ? "max-w-7xl" : "max-w-5xl";

  return (
    <div className="p-6">
      <div className={`${windowWidth} mx-auto`}>
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-[#e0e0e0]">
            <div className="flex gap-8">
              <button onClick={() => setActiveTab("cases")}
                className={`pb-3 px-1 text-sm relative ${activeTab === "cases" ? "text-[#2196f3]" : "text-[#757575] hover:text-[#333]"}`}
              >{requestTabName} {activeTab === "cases" && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2196f3]"></div>)}</button>
              {is_user && (<button onClick={() => setActiveTab("balance")}
                className={`pb-3 px-1 text-sm relative ${activeTab === "balance" ? "text-[#2196f3]" : "text-[#757575] hover:text-[#333]"}`}
              >Баланс {activeTab === "balance" && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2196f3]"></div>)}</button>)}
              <button onClick={() => setActiveTab("account")}
                className={`pb-3 px-1 text-sm relative ${activeTab === "account" ? "text-[#2196f3]" : "text-[#757575] hover:text-[#333]"}`}
              >Аккаунт {activeTab === "account" && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2196f3]"></div>)}</button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "account" ? (
          <ProfileAccount data={data} is_user={is_user} setData={setData} user={user} />
        ) : activeTab === "balance" && is_user ? (
          <ProfileBalance data={data} setUserBalance={setUserBalance} />
        ) : (
          <ProfileJobList is_user={is_user} user={user} />
        )}
      </div>
    </div>
  );
}