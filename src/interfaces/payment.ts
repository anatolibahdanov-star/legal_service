import { User } from "next-auth";
import { DBOrder } from "./db";

export enum OrderTypeE {
  OneTime = 0,
  Balance = 1,
}

export enum OrderStatusE {
  Unknown = 0,
  New = 1,
  InProgress = 2,
  Error = 3,
  Paid = 4,
  Unpaid = 5,
  FinalFailed = 6,
}

export enum BalanceTypeE {
  Increase = 0,
  Decrease = 1,
}

export enum BalanceStatusE {
  Unknown = 0,
  Success = 1,
  Error = 2,
}

export enum TransTypeE {
  Manual = 0,
  Auto = 1,
}

export enum TransStatusE {
  Unknown = 0,
  Success = 1,
  Error = 2,
}

export enum AlfaOrderStatusE {
  Register = 0,
  Hold = 1,
  Auth = 2,  // final status - success
  CancelAuth = 3,  // final status - bad
  Returned = 4,  // final status - bad
  ACS = 5,  // final status - bad
  DeclineAuth = 6,  // final status - bad
  New = 7,
}

export interface BalanceTransactionI {
  user_id: number;
  order_id: number|null;
  balance_type: BalanceTypeE;
  amount: number;
  status: BalanceStatusE;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface TransactionI {
  order_id: number;
  trans_type: TransTypeE;
  status: TransStatusE;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface BalanceI {
  amount: number;
  user: User;
  order: DBOrder|null;
  balance_type: BalanceTypeE;
  status: BalanceStatusE|null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface ServiceResponse {
  status: boolean;
  errors: string[]|null;
}

export interface newOrderResponse extends ServiceResponse {
  order: DBOrder|null;
}

export interface checkOrderResponse extends ServiceResponse {
  order: DBOrder|null;
}

export enum PaymentOperationE {
  Payment = "payment",
  Topup = "topup",
  Charge = "charge",
}

export enum PaymentMethodE {
  Card = "card",
  Sbp = "sbp",
  AlfaPay = "alfapay",
  YandexPay = "yandexpay",
  Balance = "balance",
}

export enum PaymentDisplayStatusE {
  Success = "success",
  Processing = "processing",
  Error = "error",
  Cancelled = "cancelled",
}

export interface PaymentHistoryItemI {
  id: string;
  displayId: string;
  createdAt: string;
  amount: number;
  operation: PaymentOperationE;
  method: PaymentMethodE;
  status: PaymentDisplayStatusE;
  questionId: number | null;
  questionUuid: string | null;
}

export interface PaymentHistoryResponseI {
  items: PaymentHistoryItemI[];
  count: number;
  totalSpent: number;
  totalExpenses: number;
  totalTopups: number;
}

export enum AdminOperationTypeE {
  Payment = "payment",
  Charge = "charge",
  Refund = "refund",
  Manual = "manual",
  FreeAccrual = "free_accrual",
  FreeCharge = "free_charge",
}

export enum FreeQuestionOpTypeE {
  Accrual = 1,
  Charge = 2,
}

export interface AdminBalanceOperationI {
  id: string;
  createdAt: string;
  type: AdminOperationTypeE;
  amount: number;
  comment: string | null;
  actor: string;
  questionId: number | null;
  questionUuid: string | null;
}

export interface AdminOperationsResponseI {
  items: AdminBalanceOperationI[];
}