import { isValidPhoneNumber } from 'libphonenumber-js'

export const EmailValidator = (value: string): boolean => {
    if (!emptyValidator(value) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return false;
    }
    return true;
}

export const phoneValidator = (value: string): boolean => {
    if (!emptyValidator(value) || !isValidPhoneNumber(value, 'RU')) {
        return false;
    }
    return true;
}

export const emptyValidator = (value: string): boolean => {
    if (!value.trim()) {
        return false;
    }
    return true;
}

const PASSWORD_MIN_LENGTH = 6;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const HAS_LATIN_LETTER = /[a-zA-Z]/;

export const validatePasswordPolicy = (password: string): string | null => {
    if (password.length < PASSWORD_MIN_LENGTH) {
        return `Минимум ${PASSWORD_MIN_LENGTH} символов`;
    }
    // if (!HAS_LATIN_LETTER.test(password)) {
    //     return "There must be at least one Latin letter";
    // }
    return null;
};