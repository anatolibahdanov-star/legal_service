import {ValidationErrorI, ValidationFormReplyI, ResetPasswordFormI} from "@/src/interfaces/form"
import { EmailValidator } from "@/src/app/components/forms/validation/common";

export const validateResetPasswordForm = (data: ResetPasswordFormI): ValidationFormReplyI => {
    let newErrors: ValidationErrorI[] | null = null;
    let isValid = true;

    if (!EmailValidator(data.email)) {
        if (newErrors === null) newErrors = []
        newErrors.push({
            field: "email",
            error: ["Пожалуйста, введите корректный адрес электронной почты"]
        });
        isValid = false;
    }

    return {
        is_success: isValid,
        errors: newErrors
    };
};

