import {ValidationErrorI, ValidationFormReplyI, AuthFormI} from "@/src/interfaces/form"
import { EmailValidator } from "@/src/app/components/forms/validation/common";

export const validateAuthForm = (data: AuthFormI): ValidationFormReplyI => {
    const newErrors: ValidationErrorI[] | null = []
    let isValid = true;

    if (!EmailValidator(data.email)) {
        newErrors.push({
            field: "email",
            error: ["Пожалуйста, введите корректный адрес электронной почты."]
        });
        isValid = false;
    }

    if (!data.password) {
        newErrors.push({
            field: "password",
            error: ["Пожалуйста, введите пароль."]
        });
        isValid = false;
    } else if (data.password.length < 6) {
        newErrors.push({
            field: "password",
            error: ["Пароль должен содержать минимум 6 символов."]
        });
        isValid = false;
    }

    return {
        is_success: isValid,
        errors: newErrors
    };
};