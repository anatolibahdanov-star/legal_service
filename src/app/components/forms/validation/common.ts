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