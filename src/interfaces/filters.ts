import { DateTime } from "next-auth/providers/kakao";
import { UserStatusesE } from "./data";

export interface DBFilterQuestions {
  user_id?: number;
  username?: string;
  published_at_gte?: DateTime;
  published_at_lte?: DateTime;
  category?: number;
  question?: string;
  status?: number;
  email?: string;
  email_status?: number;
  question_id?: number;
  lost?: number;
  is_child?:boolean;
  admin_id?:number;
  is_rating?:boolean;
}

export interface DBFilterUsers {
    id?:number;
    name?: string;
    email?: string;
    q?: string;
    is_register?: number;
    status?: number;
    published_at_gte?: DateTime;
    published_at_lte?: DateTime;
}

export interface DBFilterAdministrators extends DBFilterUsers {
    username?: string;
    is_super?: number;
    is_active?: UserStatusesE;
}

export interface DBFilterOrders {
    user_id?: number;
    status?: number;
    order_type?: number;
    user_name?: string;
    user_email?: string;
    alpha_id?: string;
    published_at_gte?: DateTime;
    published_at_lte?: DateTime;
}

export interface DBFilterContacts {
    user_id?: number;
    email_status?: number;
    user_name?: string;
    email?: string;
    phone?: string;
    message?: string;
    published_at_gte?: DateTime;
    published_at_lte?: DateTime;
}