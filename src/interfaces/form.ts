
import { DBCategory, DBQuestion, DBUser } from './db';
import { User } from 'next-auth';
import { Dispatch, SetStateAction } from 'react';

export interface SwitchToLoginPrefill {
  phone?: string;
  /** True when an OTP has already been sent to `phone`; the login form should
   * mount directly in the OTP code-entry step instead of asking for the
   * captcha + phone input again. */
  otpAlreadySent?: boolean;
}

export interface FormProps {
  onSwitchToLogin: (prefill?: SwitchToLoginPrefill) => void;
}

export interface FormContainerProps extends FormProps {
  onClose: () => void;
}

export interface FormWindowProps extends FormContainerProps {
  isOpen: boolean;
}

export interface AuthFormPropsI {
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
  onClose: () => void;
  prefillPhone?: string;
  /** When true (with `prefillPhone`), the form mounts directly in the OTP
   * code-entry step — used when the OTP was already issued upstream
   * (e.g. user tried to register a number that's already taken). */
  prefillPhoneOtpSent?: boolean;
}

export interface AuthWindowProps extends AuthFormPropsI  {
  isOpen: boolean;
}

export interface RequestFormPropsI {
  isOpen: boolean;
  onClose: () => void;
  setCurrent?:  Dispatch<SetStateAction<boolean>>;
  setPage?:  (page: number) => void;
}

export interface RequestListPropsI {
  question_id: number|null;
  isOpen: boolean;
  onClose: () => void;
}

export interface ValidationErrorI {
  field: string;
  error: string[];
}

export interface ValidationFormReplyI {
  is_success: boolean;
  errors: ValidationErrorI[] | null;
}

export interface ResetPasswordFormI {
  email: string;
}

export interface RegisterFormI {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RequestFormI {
  name: string;
  email: string;
  topic: string;
  question: string;
  agree: boolean;
  auth?: string;
  parent?: number;
}

export interface ContactFormI {
  phone: string;
  email: string;
  message: string;
  consent: boolean;
  user_id?: string;
}

export interface RatingFormI {
  id: string;
  rating: number;
  comment: string;
}

export interface RequestFormErrorI extends RequestFormI {
  common: string;
}

export interface ProfileFormI {
  name: string;
  password: string;
  oldPassword: string;
  confirmPassword: string;
}

export interface AuthFormI {
  email: string;
  password: string;
}

export interface MessagePropsI {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export interface PaginationControlI {
  itemsPerPage: number;
  isRefresh?: boolean; 
  onTotalItemChamge: (total: number) => void;
  currentPage: number;
  totalItems: number;
  id: number;
  handleShareLink: (uuid: string) => void;
  onCaseClick: (question: DBQuestion, openRating?: boolean) => void;
}

export interface CategoryDataI {
    data: DBCategory[];
    count: number;
}

export interface JobDataI {
    data: DBQuestion[];
    count: number;
}

export interface UserDataI {
    data: DBUser[];
    count: number;
}

export interface ProfileListWindowI {
    user: User;
}

export interface JobIdI {
    user_id: number;
    question_id: number;
}

export type FormDataObjectT = Record<string, string | number | boolean>;
