import { AlfaOrderStatusE, OrderStatusE, OrderTypeE } from "./payment";

export interface UserRequest {
    name: string;
    email: string;
    topic: string;
    question: string;
    uuid: string;
    llm?: string;
    chat?: boolean;
    parent?: number;
}

export interface UserRatingRequest {
    id: number;
    rating: number;
    comment: string;
}

export interface UserContactRequest {
    user_id?: string;
    phone: string;
    email: string;
    message: string;
}

export interface RegUser {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

export interface CustomResponseDataI {
  status: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  techical_data?: any;
  count?: number;
  error: string;
}

export interface UserBalanceRequest {
    amount: number;
    orderNumber: string;
    type?: OrderTypeE;
    status?: OrderStatusE;
    /** Free-form payload stored in porder.data — used by wizard OneTime
     *  orders to carry the question text across the Alfa redirect. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: Record<string, any> | null;
}

export interface PaymentInfoRequest {
    order_id: string;
    status: OrderStatusE;
    alpha_id: string;
    alpha_status: AlfaOrderStatusE;
    alpha_form_url: string;
}

export interface PaymentStatusUpdateI {
    order_id: string;
    status: OrderStatusE;
    alpha_id: string;
    alpha_status: AlfaOrderStatusE;
    transaction_info: string;
}

export interface StandardActionResponeI {
    status: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
}