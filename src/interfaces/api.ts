import { DateTime } from "next-auth/providers/kakao";
export interface UserRequest {
    name: string;
    email: string;
    topic: string;
    question: string;
    uuid: string;
    llm?: string;
    chat?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password: string;
  username?: string;
  is_super: boolean;
  status?: number;
  role: 'admin' | 'lowyer' | 'user';
  created_at: DateTime;
}