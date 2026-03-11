import {ValidationErrorI, ValidationFormReplyI, ProfileFormI} from "@/src/interfaces/form"
import { emptyValidator } from "@/src/app/components/forms/validation/common";

export const validateProfileForm = (data: ProfileFormI): ValidationFormReplyI => {
    const newErrors: ValidationErrorI[] | null = [];
    let isValid = true;

    if (!emptyValidator(data.name)) {
        newErrors.push({
            field: "name",
            error: ["Пожалуйста, введите ваше имя."]
        });
        isValid = false;
    }

    if (!data.oldPassword) {
        newErrors.push({
            field: "oldPassword",
            error: ["Пожалуйста, введите старый пароль."]
        });
        isValid = false;
    } else if (data.oldPassword.length < 6) {
        newErrors.push({
            field: "oldPassword",
            error: ["Старый пароль должен содержать минимум 6 символов."]
        });
        isValid = false;
    }
    
    if (!data.password) {
        newErrors.push({
            field: "password",
            error: ["Пожалуйста, введите новый пароль."]
        });
        isValid = false;
    } else if (data.password.length < 6) {
        newErrors.push({
            field: "password",
            error: ["Новый пароль должен содержать минимум 6 символов."]
        });
        isValid = false;
    }

    if (!data.confirmPassword) {
        newErrors.push({
            field: "confirmPassword",
            error: ["Пожалуйста, введите повторный пароль."]
        });
        isValid = false;
    } else if (data.password !== data.confirmPassword) {
        newErrors.push({
            field: "confirmPassword",
            error: ["Новые пароли не совпадают."]
        });
        isValid = false;
    }

    return {
        is_success: isValid,
        errors: newErrors
    };
};