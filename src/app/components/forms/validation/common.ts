export const EmailValidator = (value: string): boolean => {
    if (!emptyValidator(value) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
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