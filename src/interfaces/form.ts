
import { Dispatch, SetStateAction } from 'react';

export interface FormProps {
  onSwitchToLogin: () => void;
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
}

export interface AuthWindowProps extends AuthFormPropsI  {
  isOpen: boolean;
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