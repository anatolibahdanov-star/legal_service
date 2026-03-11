export interface UserRequest {
    name: string;
    email: string;
    topic: string;
    question: string;
    uuid: string;
    llm?: string;
    chat?: boolean;
}

export interface RegUser {
  name: string;
  email: string;
  password: string;
}

export interface CustomResponseDataI {
  status: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  error: string;
}