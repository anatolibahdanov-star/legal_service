import logger from "@/src/libs/logger"
import { User } from "next-auth";
import { CustomResponseDataI } from "../interfaces/api";

// const ALFA_API_URL = 'https://pay.alfabank.ru/payment/rest'; // Или тестовый URL
const ALFA_API_URL = 'https://alfa.rbsuat.com/payment/rest'; // Или тестовый URL
const ALFA_API_URL_DYN = 'https://alfa.rbsuat.com/payment/rest/sbp/c2b/qr/dynamic/get.do'
const USERNAME = process.env.ALFA_USERNAME;
const PASSWORD = process.env.ALFA_PASSWORD;

export const createAlfaOrder = async (amount: number, orderId: string, user: User): Promise<CustomResponseDataI> => {
  const msg = "SERVICE ALFA createAlfaOrder - "
  // const ALFA_API_URL = 'https://pay.alfabank.ru/payment/rest'; // Или тестовый URL
  const ALFA_API_URL = 'https://alfa.rbsuat.com/payment/rest';
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
            // currency: '643', // Рубли
            paymentType: 'SBP', // Обязательно для QR
        }),
    });

    const data = await response.json();
    logger.info(msg + "Response from Alpha ", data)

    if (data.errorCode) {
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
    const ALFA_API_URL_DYN = 'https://alfa.rbsuat.com/payment/rest/sbp/c2b/qr/dynamic/get.do'

    try {
        const responseQR = await fetch(`${ALFA_API_URL_DYN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                userName: USERNAME!,
                password: PASSWORD!,
                mdOrder: alfaOrderId,
            }),
        });

        const data = await responseQR.json();
        logger.info(msg + "Response from Alpha QR", data)

        if (data.errorCode) {
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

export const getAlfaOrderStatus = async (alfaOrderId: string,user: User): Promise<CustomResponseDataI> => {
  const msg = "SERVICE ALFA getAlfaOrderStatus - "
  const ALFA_API_URL = 'https://alfa.rbsuat.com/payment/rest/getOrderStatusExtended.do';

  const query = new URLSearchParams({
    userName: USERNAME!,
    password: PASSWORD!,
    orderId: alfaOrderId,
  })

  try {
    const response = await fetch(`${ALFA_API_URL}?${query}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();
    logger.info(msg + "Response from Alpha", data)

    if (data.errorCode) {
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
