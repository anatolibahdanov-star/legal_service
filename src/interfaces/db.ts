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
  /** Short 4-char public alias for `uuid`, used in /api/pdf/<short_id> URLs.
   * Nullable for pre-migration rows; backfilled lazily on read. */
  short_id?: string | null;
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
  attachments?: AttachmentDTO[];
}

export interface DBQuestionAttachment extends RowDataPacket {
  id: number;
  question_id: number;
  user_id: number;
  source: 'user' | 'lawyer';
  uploaded_by_admin_id: number | null;
  filename: string;
  storage_key: string;
  file_size: number;
  extension: string;
  mime: string | null;
  created_at: DateTime;
}

export interface AttachmentDTO {
  id: number;
  question_id: number;
  source: 'user' | 'lawyer';
  filename: string;
  file_size: number;
  extension: string;
  url: string;
}

export interface DBUser extends RowDataPacket, User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  new_password?: string;
  password: string;
  temp_password?: string | null;
  email_verified?: number;
  email_verify_token?: string | null;
  username: string;
  admin_id?: number;
  balance: number;
  balance_kop?: number;
  rating?:number;
  is_super?: boolean;
  is_super_bool?: string;
  is_register?: boolean;
  is_first_question_free?: number;
  paid_questions?: number;
  free_questions?: number;
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

export interface DBEmailTemplate extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  subject: string;
  body: string;
  button_label: string | null;
  is_active: number;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface DBSetting extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  description: string | null;
  value: string;
  value_type: 'int' | 'decimal' | 'bool' | 'string' | 'text';
  grp: string;
  weight: number;
  is_active: number;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface DBSettingAudit extends RowDataPacket {
  id: number;
  setting_code: string;
  old_value: string | null;
  new_value: string | null;
  admin_id: number | null;
  admin_name?: string | null;
  admin_username?: string | null;
  created_at: DateTime;
}

export interface DBPromptVersion extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  body: string;
  is_active: number;
  admin_id: number | null;
  admin_name?: string | null;
  admin_username?: string | null;
  created_at: DateTime;
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

export interface DBQuestionPdf extends RowDataPacket {
  id: number;
  question_id: number;
  user_id: number;
  storage_key: string;
  file_size: number;
  content_hash: string;
  generated_at: DateTime;
  updated_at: DateTime;
}

export interface DBPdfShareLink extends RowDataPacket {
  id: number;
  question_id: number;
  user_id: number;
  token: string;
  revoked: number;
  created_at: DateTime;
  updated_at: DateTime;
}