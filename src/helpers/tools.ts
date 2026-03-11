import { createHash } from 'crypto';
export interface StringArrays {
  [key: string]: string;
}

export const md5 = (str: string): string => {
  return createHash('md5').update(str).digest('hex');
};

export const passGenerator = (length: number = 12): string => {
    const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=";
    let password = "";
    for (let i = 0; i < length; i++) {
        const ind = Math.floor(Math.random() * char.length);
        password += char[ind];
    }
    return password;
}
