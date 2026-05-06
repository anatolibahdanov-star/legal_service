import { useState } from 'react';
import { useSession } from "next-auth/react"
import { AsYouType } from 'libphonenumber-js'
import { FormDataObjectT } from '@/src/interfaces/form';
import { validateContactForm } from "@/src/app/components/forms/validation/contact";
import { submitContactFormAction } from "@/src/app/components/forms/action/contact";
import { DBContact } from '@/src/interfaces/db';

export default function ContactForm() {
    const { data: session, status } = useSession()

    const [errors, setErrors] = useState<FormDataObjectT>({ phone: "", email: "", message: "", consent: false, common: ""});
    const [formData, setFormData] = useState({email: "", phone: "", message: "", consent: false, user_id: ""});
    const [submitted, setSubmitted] = useState(false);

    if (status === 'loading') return <p>Загружается...</p>;
    let user = null
    if(session && session?.user) user = session?.user

    const email = formData?.email ?? user?.email ?? ''
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: FormDataObjectT = {phone: "", email: "", message: "", consent: false, common: ""};
        const dataRequest = {...formData}

        if(user) {
            dataRequest.user_id = user.id ?? null
        }

        if (dataRequest.phone.startsWith('+')) {
            dataRequest.phone = dataRequest.phone.slice(1);
        }

        const validResult = validateContactForm(dataRequest)
        if (validResult.is_success) {
            const formatter = new AsYouType('RU');
            dataRequest.phone = formatter.input(dataRequest.phone);
            console.log("Client request", dataRequest);

            const responseData = await submitContactFormAction(dataRequest)
            if(!responseData.status) {
                newErrors.common = responseData.error;
                setErrors(newErrors);
                return false
            }

            const contact: DBContact = responseData.data
            console.log('Форма отправлена:', formData, contact);
            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                setFormData({phone: '', email: '', message: '', consent: false, user_id: ""});
                setErrors(newErrors);
            }, 3000);
            
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="flex items-stretch">
        <div className="bg-gradient-to-r from-[#3d4b5e] to-[#2a3542] rounded-[24px] p-8 w-full flex flex-col">
            <div className="text-center mb-6">
                <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[28px] text-white mb-3">Остались вопросы?</h3>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] text-white/80">
                    Не получилось получить консультацию или нужны уточнения?<br />
                    Напишите нам — мы свяжемся с вами.
                </p>
                {errors.common && (
                    <p className="font-['Inter:Regular',sans-serif] font-normal pt-2 text-[16px] text-red-400 ml-[4px]">
                        {errors.common}
                    </p>
                )}
            </div>

            {submitted ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-[16px] p-8 text-center flex-1 flex flex-col items-center justify-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h4 className="font-['Inter:Bold',sans-serif] font-bold text-[24px] text-white mb-2">Спасибо!</h4>
                <p className="font-['Inter:Regular',sans-serif] text-[14px] text-white/80">Ваше сообщение получено. Мы свяжемся с вами в ближайшее время.</p>
            </div>
            ) : (
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col" noValidate>
                <div className="space-y-3 mb-4 flex-1">
                <div>
                    <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] text-white/90 mb-1">Телефон</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+7 ___ ___-__-__" required
                    className={`w-full px-3 py-2.5 rounded-[10px] border bg-white/10 font-['Inter:Regular',sans-serif] text-[15px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#87b7ce]/20 transition-all ${
                        errors.phone 
                            ? "border-red-400 focus:border-red-500" 
                            : "border-white/20 focus:border-[#87b7ce]"
                        }`}
                    />
                    {errors.phone && (
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">{errors.phone}</p>
                    )}
                </div>

                <div>
                    <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] text-white/90 mb-1">Email</label>
                    <input type="email" name="email" value={email} onChange={handleChange} placeholder="example@mail.com" required
                    className={`w-full px-3 py-2.5 rounded-[10px] border bg-white/10 font-['Inter:Regular',sans-serif] text-[15px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#87b7ce]/20 transition-all ${
                        errors.email 
                            ? "border-red-400 focus:border-red-500" 
                            : "border-white/20 focus:border-[#87b7ce]"
                        }`}
                    />
                    {errors.email && (
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">{errors.email}</p>
                    )}
                </div>

                <div>
                    <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] text-white/90 mb-1">Сообщение</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Опишите ваш вопрос или проблему"
                    rows={3} required
                    className={`w-full px-3 py-2.5 rounded-[10px] border bg-white/10 font-['Inter:Regular',sans-serif] text-[15px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#87b7ce]/20 transition-all resize-none ${
                        errors.message 
                            ? "border-red-400 focus:border-red-500" 
                            : "border-white/20 focus:border-[#87b7ce]"
                        }`}
                    />
                    {errors.message && (
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">{errors.message}</p>
                    )}
                </div>

                <div className="flex items-center">
                    <input type="checkbox" name="consent" checked={formData.consent} onChange={handleChange} required className={`w-4 h-4 mr-2 border ${
                        errors.consent 
                            ? "border-red-400 focus:border-red-500" 
                            : "border-white/20 focus:border-[#87b7ce]"
                        }`} />
                    <label className="font-['Inter:Regular',sans-serif] text-[13px] text-white/90"> Я согласен с обработкой персональных данных</label>
                    {errors.consent && (
                    <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-red-400 ml-[4px]">{errors.consent}</p>
                    )}
                </div>
                </div>

                <div className="text-center">
                <button type="submit"
                    className="w-full px-8 py-3 bg-[#87b7ce] hover:bg-[#6fa3b4] rounded-[10px] font-['Inter:Medium',sans-serif] font-medium text-[15px] text-white transition-colors shadow-lg hover:shadow-xl"
                >Связаться с нами</button>
                <p className="mt-3 font-['Inter:Regular',sans-serif] text-[12px] text-white/60 italic">Ответим в ближайшее время удобным для Вас способом.</p>
                </div>
            </form>
            )}
        </div>
        </div>
    )
}