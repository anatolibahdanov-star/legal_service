import { createHash } from 'crypto';
export interface StringArrays {
  [key: string]: string;
}

export const md5 = (str: string): string => {
  return createHash('md5').update(str).digest('hex');
};
