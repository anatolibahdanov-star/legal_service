import {ValidationErrorI, ValidationFormReplyI, ContactFormI} from "@/src/interfaces/form"
import { EmailValidator, emptyValidator, phoneValidator } from "@/src/app/components/forms/validation/common";

export const validateContactForm = (data: ContactFormI): ValidationFormReplyI => {
    const newErrors: ValidationErrorI[] | null = []
    let isValid = true;

    console.log("validateRequestForm data", data)
    if (!emptyValidator(data.phone)) {
        newErrors.push({
            field: "phone",
            error: ["Пожалуйста, введите номер телефона."]
        });
        isValid = false;
    }
    if (!phoneValidator(data.phone)) {
        newErrors.push({
            field: "phone",
            error: ["Пожалуйста, введите корректный номер телефона."]
        });
        isValid = false;
    }

    if (!EmailValidator(data.email)) {
        newErrors.push({
            field: "email",
            error: ["Пожалуйста, введите корректный адрес электронной почты."]
        });
        isValid = false;
    }

    if (data.consent !== true) {
        newErrors.push({
            field: "consent",
            error: ["Пожалуйста, примите условия для обработкой персональных данных."]
        });
        isValid = false;
    }

    if (!emptyValidator(data.message)) {
        newErrors.push({
            field: "message",
            error: ["Пожалуйста, введите ваше сообщение."]
        });
        isValid = false;
    }

    if (data.message.length >= 500) {
        newErrors.push({
            field: "message",
            error: ["Пожалуйста, сократите ваше сообщение до 500 символов."]
        });
        isValid = false;
    }

    return {
        is_success: isValid,
        errors: newErrors
    };
};