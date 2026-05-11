import {ValidationErrorI, ValidationFormReplyI, RegisterFormI} from "@/src/interfaces/form"
import { EmailValidator, emptyValidator, validatePasswordPolicy } from "@/src/app/components/forms/validation/common";

export const validateRegisterForm = (data: RegisterFormI): ValidationFormReplyI => {
    const newErrors: ValidationErrorI[] | null = []
    let isValid = true;

    if (!emptyValidator(data.name)) {
        newErrors.push({ field: "name", error: ["Пожалуйста, введите ваше имя."] });
        isValid = false;
    }

    if (!EmailValidator(data.email)) {
        newErrors.push({ field: "email", error: ["Некорректный формат email"] });
        isValid = false;
    }

    if (!data.password) {
        newErrors.push({ field: "password", error: ["Введите пароль"] });
        isValid = false;
    } else {
        const policy = validatePasswordPolicy(data.password);
        if (policy) {
            newErrors.push({ field: "password", error: [policy] });
            isValid = false;
        }
    }

    if (!data.confirmPassword) {
        newErrors.push({ field: "confirmPassword", error: ["Повторите пароль"] });
        isValid = false;
    } else if (data.password !== data.confirmPassword) {
        newErrors.push({ field: "confirmPassword", error: ["Пароли не совпадают."] });
        isValid = false;
    }

    return { is_success: isValid, errors: newErrors };
};