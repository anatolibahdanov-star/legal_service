import {ValidationErrorI, ValidationFormReplyI, RegisterFormI} from "@/src/interfaces/form"
import { EmailValidator, emptyValidator } from "@/src/app/components/forms/validation/common";

export const validateRegisterForm = (data: RegisterFormI): ValidationFormReplyI => {
    const newErrors: ValidationErrorI[] | null = []
    let isValid = true;

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

    // Валидация пароля
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

    // Валидация подтверждения пароля
    if (!data.confirmPassword) {
        newErrors.push({
            field: "confirmPassword",
            error: ["Пожалуйста, введите повторный пароль."]
        });
        isValid = false;
    } else if (data.password !== data.confirmPassword) {
        newErrors.push({
            field: "confirmPassword",
            error: ["Пароли не совпадают."]
        });
        isValid = false;
    }

    return {
        is_success: isValid,
        errors: newErrors
    };
};