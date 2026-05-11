import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/app/components/ui/select";
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation';
import { validateRequestForm } from "@/src/app/components/forms/validation/request";
import { submitRequestFormAction } from "@/src/app/components/forms/action/request";
import { FormDataObjectT } from "@/src/interfaces/form";
import { DBQuestion } from "@/src/interfaces/db";
import { SelectCategories } from "@/src/app/components/data/select-category";
import { RecaptchaCheckbox } from "@/src/app/components/forms/RecaptchaCheckbox";

interface RequestFormOptionsI {
    parent?: number|null;
    setCurrent?: (page: boolean) => void;
    setPage?: (page: number) => void;
    onClose?: () => void;
    isProfile?: boolean;
}

export default function RequestForm({parent = null, setCurrent, setPage, onClose, isProfile = false}: RequestFormOptionsI) {

    const router = useRouter();
    const { data: session, status } = useSession()
    const [errors, setErrors] = useState<FormDataObjectT>({ name: "", email: "", topic: "", question: "", agree: false, common: "", auth: "", parent: 0});
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        topic: "",
        question: "",
        agree: false,
        auth: "",
        parent: 0,
    });
    if (status === 'loading') {
        return <p>Загружается...</p>; // Status is "loading" while fetching the session
    }
    let user = null
    if(session && session?.user) user = session?.user

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: FormDataObjectT = { name: "", email: "", topic: "", question: "", agree: false, common: "", auth: "" };

        if (!captchaToken) {
            newErrors.common = "Подтвердите, что вы не робот.";
            setErrors(newErrors);
            return false;
        }

        const dataRequest = {...formData}
        if(user) {
            dataRequest.email = user.email ?? ""
            dataRequest.name = user.name ?? ""
            dataRequest.auth = "1"
            dataRequest.agree = true
        }
        if(parent) {
            dataRequest.parent = parent
        }
        const validResult = validateRequestForm(dataRequest)
        if (validResult.is_success) {
            console.log("Client request", dataRequest);
            setSubmitting(true);
            const responseData = await submitRequestFormAction(dataRequest, captchaToken)
            setSubmitting(false);
            setCaptchaToken(null);
            if(!responseData.status) {
                newErrors.common = responseData.error;
                setErrors(newErrors);
                return false
            }

            const request: DBQuestion = responseData.data
            console.log('handleSubmit request', request)
            if(!user || (user && !isProfile)) {
                router.push('/consultation/' + request.uuid);
            } else {
                if(setPage) setPage(1)
                if(setCurrent) setCurrent(true)
                if(onClose) onClose()
            }

        } else {
            const _errors = validResult.errors
            console.log('handleSubmit request error', _errors)
            if(_errors !== null) {
                newErrors.common = "Вы ввели не корректные данные.";
                for (const error of _errors) {
                    if(Object.hasOwn(newErrors, error.field)) {
                        newErrors[error.field] = error.error.join('<br />');
                    }
                }
                
                setErrors(newErrors);
            }
        }
    };
    
    return (
        <>
            <div className="bg-[#3d4b5e] rounded-3xl p-10 shadow-2xl">
                <div className="mb-8">
                    {!parent && (<div className="flex items-center justify-between mb-3">
                        <h2 className="text-2xl font-bold text-white">Задать вопрос юристу</h2>
                        
                        {/* Иконка Онлайн */}
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-[#323c54] text-base font-medium">ОНЛАЙН</span>
                        </div>
                    </div>)}
                
                    {!parent && (<p className="text-white/80 text-sm leading-relaxed">
                        Опишите проблему → Получите бесплатный анализ ситуации и варианты решений от юриста. Если потребуется подготовка документов или представительство в суде, вы обсудите условия напрямую со специалистом.
                    </p>)}
                    {errors.common && (
                        <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                            {errors.common}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                
                    {!user && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">Электронная почта</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="example@example.com"
                                    className={`w-full px-5 py-4 bg-transparent border-2 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-[#8faaba] transition-colors ${
                                    errors.email 
                                        ? "border-red-400 focus:border-red-500" 
                                        : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                                    }`}
                                    required
                                />
                                {errors.email && (
                                <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                                    {errors.email}
                                </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">Ваше имя</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Имя"
                                    className={`w-full px-5 py-4 bg-transparent border-2 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-[#8faaba] transition-colors ${
                                    errors.name 
                                        ? "border-red-400 focus:border-red-500" 
                                        : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                                    }`}
                                    required
                                />
                                {errors.name && (
                                <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                                    {errors.name}
                                </p>
                                )}
                            </div>
                        </div>
                    )}

                    {!parent && (<div>
                        <label htmlFor="topic" className="block text-sm font-medium text-white/90 mb-2">Тема вопроса</label>
                        <Select name="topic" aria-label="topic" required onValueChange={(value) => setFormData({ ...formData, topic: value })}>
                            <SelectTrigger className={`SelectTrigger ${
                            errors.topic 
                                ? "border-red-400 focus:border-red-500" 
                                : ""
                            }`} aria-label="Food">
                                <SelectValue placeholder="Выберите тему вопроса…" />
                            </SelectTrigger>
                            <SelectContent className="SelectContent">
                                <SelectGroup>
                                    <SelectLabel className="SelectLabel">Недвижимость</SelectLabel>
                                    <SelectCategories />
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        {errors.topic && (
                        <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                            {errors.topic}
                        </p>
                        )}
                    </div>)}

                    <div>
                        <label htmlFor="question" className="block text-sm font-medium text-white/90 mb-2">Описание проблемы</label>
                        <textarea
                            id="question"
                            name="question"
                            rows={6}
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            placeholder="Опишите вашу ситуацию"
                            className={`w-full px-5 py-4 bg-transparent border-2 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-[#8faaba] transition-colors resize-none ${
                            errors.question 
                                ? "border-red-400 focus:border-red-500" 
                                : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                            }`}
                            required
                        />
                        {errors.question && (
                        <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                            {errors.question}
                        </p>
                        )}
                    </div>

                <div>
                    <RecaptchaCheckbox
                        action="submit_question"
                        token={captchaToken}
                        onChange={setCaptchaToken}
                        disabled={submitting}
                    />
                </div>

                <button type="submit"
                    disabled={!captchaToken || submitting}
                    className={`w-full font-medium py-4 px-6 rounded-2xl transition-colors text-lg ${
                        !captchaToken || submitting
                            ? "bg-[#8faaba]/50 text-white/70 cursor-not-allowed"
                            : "bg-[#8faaba] hover:bg-[#7a98a7] text-white"
                    }`}
                >{submitting ? "Отправляем…" : "Оставить заявку"}</button>

                {!user && (
                    <>
                        <div className="flex items-start gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="agree"
                                checked={formData.agree}
                                onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                                className={`mt-1 w-4 h-4 rounded border-white/30 bg-transparent text-[#8faaba] focus:ring-[#8faaba] focus:ring-offset-0 ${
                                    errors.agree 
                                        ? "border-red-400 focus:border-red-500" 
                                        : "border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.4)]"
                                    }`}
                                required
                            />
                            <label htmlFor="agree" className="text-xs text-white/60 leading-relaxed">
                                Нажимая кнопку «Оставить заявку», я принимаю условия Пользовательского соглашения и условия Политики конфиденциальности.
                            </label>
                        </div>
                        {errors.agree && (
                        <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">
                            {errors.agree}
                        </p>
                        )}
                    </>
                )}
                </form>
            </div>
        </>
    )
}