export interface EmailDataI {
  recipient: string;
  username: string;
  url: string;
}

export interface EmailDataForgotI {
  recipient: string;
  username: string;
  password: string;
  url: string;
  url_about: string;
}

export interface EmailDataNewRequestI {
  email: string;
  username: string;
  id: string;
  admin_id?: number|null;
}

export interface EmailLawRatingDataI {
  user_id: number;
  user_name: string;
  admin_id: number|null;
  admin_name: string;
  question_id: string;
  question_rating: number;
  question_rating_comment: string;
  created_at: string;
}

export interface EmailContactDataI {
  id: number;
  user_id: number|null;
  user_name: string|null;
  email: string;
  phone: string;
  message: string;
  created_at: string;
}