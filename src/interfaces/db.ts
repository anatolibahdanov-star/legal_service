import { RowDataPacket} from 'mysql2/promise';
import {User} from "next-auth"
import { DateTime } from "next-auth/providers/kakao";

export interface CountResult extends RowDataPacket {
  counter: number; // The alias from the SQL query
}

export interface DBQuestions extends RowDataPacket, User {
  id: string;
  username: string;
  email: string;
  lawyer?: string;
  question: string;
  status: number;
  email_status: number;
  uuid: string;
  category_id: string;
  category_name: string;
  reply_id: string;
  reply: string;
  reply_status: number;
  final_reply_id: string;
  final_reply: string | null;
  final_reply_duration?: number;
  created_at: DateTime;
  chat?: number;
}

export interface DBUser extends RowDataPacket, User {
  id: string;
  name: string;
  email: string;
  password: string;
  username: string;
  admin_id?: number;
  is_super?: boolean;
  is_super_bool?: string;
  is_register?: boolean;
  status?: number;
  created_at: DateTime;
}

export interface DBCategory extends RowDataPacket {
  id: string;
  name: string;
  weight: number;
}