export interface UserRequest {
    name: string;
    email: string;
    topic: string;
    question: string;
    uuid: string;
    llm?: string;
    chat?: boolean;
}