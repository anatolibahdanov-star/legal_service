import {ValidationErrorI, ValidationFormReplyI, RequestFormI} from "@/src/interfaces/form"
import { EmailValidator, emptyValidator } from "@/src/app/components/forms/validation/common";

export const validateRequestForm = (data: RequestFormI): ValidationFormReplyI => {
    const newErrors: ValidationErrorI[] | null = []
    let isValid = true;

    console.log("validateRequestForm data", data)
    if (data.auth !== "1") {
        if (!emptyValidator(data.name)) {
            newErrors.push({
                field: "name",
                error: ["Пожалуйста, введите ваше имя."]
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

        if (data.agree !== true) {
            newErrors.push({
                field: "agree",
                error: ["Пожалуйста, примите условия Пользовательского соглашения и Политики конфиденциальности."]
            });
            isValid = false;
        }
    }

    if(!data.parent) {
        if (!emptyValidator(data.topic)) {
            newErrors.push({
                field: "topic",
                error: ["Пожалуйста, выберите категорию вопроса."]
            });
            isValid = false;
        }
    }

    if (!emptyValidator(data.question)) {
        newErrors.push({
            field: "question",
            error: ["Пожалуйста, введите ваш вопрос."]
        });
        isValid = false;
    }

    if (data.question.length >= 5000) {
        newErrors.push({
            field: "question",
            error: ["Пожалуйста, сократите ваш вопрос до 5000 символов."]
        });
        isValid = false;
    }

    return {
        is_success: isValid,
        errors: newErrors
    };
};