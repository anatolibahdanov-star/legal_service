import { createHash } from 'node:crypto';
import {LangItemsE} from "@/src/interfaces/data"
import { ReactAdminSelectI } from '@/src/interfaces/admin';
import { IconWithTooltip } from "@/src/app/components/admin/IconWithTooltip";

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

const isValidLang = (keylang: string): keylang is keyof typeof LangItemsE => {
    return Object.keys(LangItemsE).includes(keylang as keyof typeof LangItemsE);
}

export const getAdminChoices = <T extends Record<string, string | number>>(enumObj: T, hint: string, isWord: boolean = false): ReactAdminSelectI[] => {
  const result: ReactAdminSelectI[] = []
  const realKeys = Object.keys(enumObj).filter(key => typeof key === 'string' && isNaN(Number(key)));
  for (const key of realKeys as Array<keyof typeof enumObj>) {
    let trans: string = LangItemsE["Unknown"]
    let icon: React.ReactNode = ''
    if(typeof key === 'string') {
      if(isValidLang(key)) {
        trans = LangItemsE[key]
      }
      icon = IconWithTooltip(key, hint + trans)
    }
    result.push({id: enumObj[key], name: isWord ? trans : icon} as ReactAdminSelectI)
  }
  return result
}

export const getAdminQuestionUrl = (id: string): string => {
  const domainUrl = process.env.NEXT_PUBLIC_URL
  return domainUrl + '/admin#/requests/' + id + '/show'
}

export const getAdminAdminUrl = (id: number): string => {
  const domainUrl = process.env.NEXT_PUBLIC_URL
  return domainUrl + '/admin#/administrators/' + id + '/show'
}

export const getAdminUserUrl = (id: number): string => {
  const domainUrl = process.env.NEXT_PUBLIC_URL
  return domainUrl + '/admin#/users/' + id + '/show'
}

export const getAdminContactUrl = (id: number): string => {
  const domainUrl = process.env.NEXT_PUBLIC_URL
  return domainUrl + '/admin#/contacts/' + id + '/show'
}