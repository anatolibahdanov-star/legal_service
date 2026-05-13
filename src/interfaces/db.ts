import { RowDataPacket} from 'mysql2/promise';
import {User} from "next-auth"
import { DateTime } from "next-auth/providers/kakao";
import { EmailStatusesE, QuestionStatusesE, ReplyStatusesE } from './data';
import { AlfaOrderStatusE, OrderStatusE, OrderTypeE } from './payment';

export interface CountResult extends RowDataPacket {
  counter: number; // The alias from the SQL query
}

export interface DBQuestion extends RowDataPacket, User {
  id: string;
  parent_id: string;
  user_id: number;
  username: string;
  email: string;
  lawyer?: string;
  owner?: string;
  rating?: number;
  rating_date?: DateTime | null;
  comment?: string;
  question: string;
  job_status: QuestionStatusesE;
  status: QuestionStatusesE;
  email_status: number;
  uuid: string;
  category_id: string;
  category_name: string;
  reply_id: string;
  reply: string;
  reply_status: ReplyStatusesE;
  final_reply_id: string;
  final_reply_date?: DateTime;
  final_reply: string | null;
  final_reply_duration?: number;
  created_at: DateTime;
  updated_at: DateTime;
  chat?: number;
  isGenerate?: boolean;
  admin_id?: number|null;
  child_id?: number|null;
}

export interface DBUser extends RowDataPacket, User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  new_password?: string;
  password: string;
  username: string;
  admin_id?: number;
  balance: number;
  rating?:number;
  is_super?: boolean;
  is_super_bool?: string;
  is_register?: boolean;
  is_first_question_free?: number;
  status?: number;
  created_at: DateTime;
}

export interface DBCategory extends RowDataPacket {
  id: string;
  name: string;
  weight: number;
}

export interface DBOrder extends RowDataPacket {
  id: string;
  user_id: number;
  user_name: string;
  amount: number;
  ptype: OrderTypeE;
  question_id?: number | null;
  alpha_id: string;
  alpha_status: AlfaOrderStatusE;
  alpha_qr_url: string;
  alpha_form_url: string;
  data: string;
  status: OrderStatusE;
  reason: string;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface DBContact extends RowDataPacket {
  id: string;
  user_id: number|null;
  user_name: string|null;
  email: string;
  phone: string;
  message: string;
  email_status: EmailStatusesE;
  created_at: DateTime;
}

export interface DBStatistic extends RowDataPacket, User {
  id: string;
  st_date: DateTime;
  avg_llm_time: number;
  avg_manager_time: number;
  avg_request_time: number;
}