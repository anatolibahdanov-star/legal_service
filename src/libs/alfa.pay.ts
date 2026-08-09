import logger from "@/src/libs/logger"
import { User } from "next-auth";
import { CustomResponseDataI } from "../interfaces/api";

const ALFA_API_URL = process.env.ALFA_API_URL || 'https://pay.alfabank.ru/payment/rest';
const ALFA_API_URL_DYN = `${ALFA_API_URL}/sbp/c2b/qr/dynamic/get.do`;
const USERNAME = process.env.ALFA_USERNAME;
const PASSWORD = process.env.ALFA_PASSWORD;
// Отдельный мерчант-логин для подписок (с включённым автоплатёжом/binding на
// контракте). Заказы, зарегистрированные под ним, и статус опрашивать нужно
// тоже под ним — балансовый ALFA_USERNAME их "не видит".
const SUB_USERNAME = process.env.ALFA_SUB_USERNAME;
const SUB_PASSWORD = process.env.ALFA_SUB_PASSWORD;

const msgGlobal = "LIBS ALFA.PAY "

// RBS отвечает errorCode "0" на успешный запрос, а строка "0" в JS истинна —
// поэтому код ошибки сравниваем явно.
const isAlfaError = (code: unknown): boolean =>
  code !== undefined && code !== null && String(code) !== '0'

const ALFA_TIMEOUT_MS = 20000

export const createAlfaOrder = async (amount: number, orderId: string, user: User): Promise<CustomResponseDataI> => {
  const msg = msgGlobal + "createAlfaOrder - "
  const domainUrl = process.env.NEXT_PUBLIC_URL
  const orderPrefix = process.env.NODE_ENV === 'development' ? 'dev-' : ''

  try {
    const response = await fetch(`${ALFA_API_URL}/register.do`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            userName: USERNAME!,
            password: PASSWORD!,
            amount: String(amount),
            orderNumber: orderPrefix + orderId,
            returnUrl: domainUrl + '/balance/success',
            failUrl: domainUrl + '/balance/unsuccess',
            // dynamicCallbackUrl: domainUrlApi + '/alfacallbacks',
            // currency: '643', // Rubles
            paymentType: 'SBP', // Required for QR
        }),
        signal: AbortSignal.timeout(ALFA_TIMEOUT_MS),
    });

    const data = await response.json();
    logger.info(msg + "Response from Alpha ", data)

    if (isAlfaError(data.errorCode)) {
        logger.error(msg + "Error during Alfa payment request create order: " + data.errorMessage, user.id, amount, orderId)
        return {
            status: false,
            data: null,
            techical_data: data,
            error: "Error during Alfa payment request create order: " + data.errorMessage,
        }
    }

    return {
        status: true,
        data: data,
        techical_data: data,
        error: "",
    }

  } catch (err) {
    logger.error(msg + "Technical Error during Alfa payment request create order", (err as Error).message)
    return {
        status: false,
        data: null,
        error: "Error during Alfa payment request create order: " + (err as Error).message,
    }
  }
  
}

export const getAlfaOrderQR = async (alfaOrderId: string, user: User): Promise<CustomResponseDataI> => {
    const msg = "SERVICE ALFA getAlfaOrderQR - "

    try {
        const responseQR = await fetch(`${ALFA_API_URL_DYN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                userName: USERNAME!,
                password: PASSWORD!,
                mdOrder: alfaOrderId,
            }),
            signal: AbortSignal.timeout(ALFA_TIMEOUT_MS),
        });

        const data = await responseQR.json();
        logger.info(msg + "Response from Alpha QR", data)

        if (isAlfaError(data.errorCode)) {
            logger.error(msg + "Error during Alfa payment request get order QR" + data.errorMessage, user.id, alfaOrderId)
            return {
                status: false,
                data: null,
                techical_data: data,
                error: "Error during Alfa payment request get order QR: " + data.errorMessage,
            }
        }

        return {
            status: true,
            data: data,
            techical_data: data,
            error: "",
        }
    } catch (err) {
        logger.error(msg + "Technical Error during Alfa payment request get order QR", (err as Error).message)
        return {
            status: false,
            data: null,
            error: "Technical Error during Alfa payment request get order QR: " + (err as Error).message,
        }
    }
}

export const createAlfaBindingOrder = async (
  amount: number,
  orderId: string,
  user: User,
  clientId: string,
): Promise<CustomResponseDataI> => {
  const msg = msgGlobal + "createAlfaBindingOrder - "
  const domainUrl = process.env.NEXT_PUBLIC_URL
  const orderPrefix = process.env.NODE_ENV === 'development' ? 'dev-' : ''

  const register = async (features: string | null) => {
    const params = new URLSearchParams({
        userName: SUB_USERNAME!,
        password: SUB_PASSWORD!,
        amount: String(amount),
        orderNumber: orderPrefix + orderId,
        returnUrl: domainUrl + '/balance/success',
        failUrl: domainUrl + '/balance/unsuccess',
        clientId: clientId,
    })
    if (features) params.set('features', features)
    if (user.email) params.set('email', user.email)
    const response = await fetch(`${ALFA_API_URL}/register.do`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
    });
    return response.json();
  }

  try {
    let data = await register('FORCE_CREATE_BINDING');
    if (isAlfaError(data.errorCode)) {
        logger.warn(msg + "FORCE_CREATE_BINDING rejected, falling back to plain register", user.id, orderId, data.errorMessage)
        data = await register(null);
    }
    logger.info(msg + "Response from Alfa", data)

    if (isAlfaError(data.errorCode)) {
        logger.error(msg + "Error during Alfa binding order register: " + data.errorMessage, user.id, amount, orderId)
        return {
            status: false,
            data: null,
            techical_data: data,
            error: "Error during Alfa binding order register: " + data.errorMessage,
        }
    }

    return {
        status: true,
        data: data,
        techical_data: data,
        error: "",
    }
  } catch (err) {
    logger.error(msg + "Technical Error during Alfa binding order register", (err as Error).message)
    return {
        status: false,
        data: null,
        error: "Error during Alfa binding order register: " + (err as Error).message,
    }
  }
}

export const chargeAlfaBinding = async (
  amount: number,
  orderId: string,
  user: User,
  clientId: string,
  bindingId: string,
): Promise<CustomResponseDataI> => {
  const msg = msgGlobal + "chargeAlfaBinding - "
  const domainUrl = process.env.NEXT_PUBLIC_URL
  const orderPrefix = process.env.NODE_ENV === 'development' ? 'dev-' : ''

  try {
    const registerResponse = await fetch(`${ALFA_API_URL}/register.do`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            userName: SUB_USERNAME!,
            password: SUB_PASSWORD!,
            amount: String(amount),
            orderNumber: orderPrefix + orderId,
            returnUrl: domainUrl + '/balance/success',
            clientId: clientId,
            features: 'AUTO_PAYMENT',
        }),
    });
    const registerData = await registerResponse.json();
    logger.info(msg + "register response", registerData)
    if (isAlfaError(registerData.errorCode) || !registerData.orderId) {
        logger.error(msg + "Error during recurring register: " + registerData.errorMessage, user.id, amount, orderId)
        return { status: false, data: null, techical_data: registerData, error: "recurring register failed: " + registerData.errorMessage }
    }

    const mdOrder = registerData.orderId;
    const bindingResponse = await fetch(`${ALFA_API_URL}/paymentOrderBinding.do`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            userName: SUB_USERNAME!,
            password: SUB_PASSWORD!,
            mdOrder: mdOrder,
            bindingId: bindingId,
        }),
    });
    const bindingData = await bindingResponse.json();
    logger.info(msg + "paymentOrderBinding response", bindingData)
    if (bindingData.errorCode && bindingData.errorCode !== "0") {
        logger.error(msg + "Error during paymentOrderBinding: " + bindingData.errorMessage, user.id, mdOrder)
        return { status: false, data: { ...bindingData, orderId: mdOrder }, techical_data: bindingData, error: "paymentOrderBinding failed: " + bindingData.errorMessage }
    }

    return {
        status: true,
        data: { ...bindingData, orderId: mdOrder },
        techical_data: bindingData,
        error: "",
    }
  } catch (err) {
    logger.error(msg + "Technical Error during recurring charge", (err as Error).message)
    return {
        status: false,
        data: null,
        error: "Technical Error during recurring charge: " + (err as Error).message,
    }
  }
}

export const getAlfaOrderStatus = async (alfaOrderId: string, user: User, useSubCredentials: boolean = false): Promise<CustomResponseDataI> => {
  const msg = "SERVICE ALFA getAlfaOrderStatus - "

  const query = new URLSearchParams({
    userName: (useSubCredentials ? SUB_USERNAME : USERNAME)!,
    password: (useSubCredentials ? SUB_PASSWORD : PASSWORD)!,
    orderId: alfaOrderId,
  })

  try {
    const response = await fetch(`${ALFA_API_URL}/getOrderStatusExtended.do?${query}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();
    logger.info(msg + "Response from Alpha", data)

    if (data.errorCode && data.errorCode !== "0") {
        logger.error(msg + "Error during Alfa payment request create order: " + data.errorMessage, user.id, alfaOrderId)
        return {
            status: false,
            data: null,
            techical_data: data,
            error: "Error during Alfa payment request create order: " + data.errorMessage,
        }
    }

    return {
        status: true,
        data: data,
        techical_data: data,
        error: "",
    }

  } catch (err) {
    logger.error(msg + "Technical Error during Alfa payment request create order", (err as Error).message)
    return {
        status: false,
        data: null,
        error: "Error during Alfa payment request create order: " + (err as Error).message,
    }
  }

}

export const unBindAlfaCard = async (bindingId: string): Promise<CustomResponseDataI> => {
  const msg = msgGlobal + "unBindAlfaCard - "
  try {
    const response = await fetch(`${ALFA_API_URL}/unBindCard.do`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            userName: SUB_USERNAME!,
            password: SUB_PASSWORD!,
            bindingId: bindingId,
        }),
    });
    const data = await response.json();
    logger.info(msg + "Response from Alfa", data)
    if (data.errorCode && data.errorCode !== "0") {
        return { status: false, data: null, techical_data: data, error: data.errorMessage ?? 'unBindCard failed' }
    }
    return { status: true, data: data, techical_data: data, error: "" }
  } catch (err) {
    logger.error(msg + "Technical Error during unBindCard", (err as Error).message)
    return { status: false, data: null, error: "unBindCard: " + (err as Error).message }
  }
}
