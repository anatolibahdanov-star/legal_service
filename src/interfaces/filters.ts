import { DateTime } from "next-auth/providers/kakao";

export interface DBFilterQuestions {
  user_id?: number;
  username?: string;
  published_at_gte?: DateTime;
  published_at_lte?: DateTime;
  category?: number;
  question?: string;
  status?: number;
  email?: number;
}

export interface DBFilterAdministrators {
    name?: string;
    username?: string;
    email?: string;
    is_super?: number;
    status?: number;
    published_at_gte?: DateTime;
    published_at_lte?: DateTime;
}