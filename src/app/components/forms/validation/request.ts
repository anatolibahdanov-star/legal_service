import {ValidationErrorI, ValidationFormReplyI, RequestFormI} from "@/src/interfaces/form"
import { EmailValidator, emptyValidator } from "@/src/app/components/forms/validation/common";

export const QUESTION_MIN_LENGTH = 30;
export const QUESTION_MAX_LENGTH = 2000;

export const validateQuestionText = (value: string): string | null => {
    const length = value.length;
    if (length === 0) return "Пожалуйста, введите текст вопроса";
    if (length < QUESTION_MIN_LENGTH) return `Вопрос должен содержать минимум ${QUESTION_MIN_LENGTH} символов`;
    if (length > QUESTION_MAX_LENGTH) return `Вопрос не может превышать ${QUESTION_MAX_LENGTH} символов`;
    return null;
};

export const validateRequestForm = (data: RequestFormI): ValidationFormReplyI => {
    const newErrors: ValidationErrorI[] | null = []
    let isValid = true;

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

    const questionError = validateQuestionText(data.question);
    if (questionError) {
        newErrors.push({
            field: "question",
            error: [questionError]
        });
        isValid = false;
    }

    return {
        is_success: isValid,
        errors: newErrors
    };
};
