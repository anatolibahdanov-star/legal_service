import type { NextApiRequest, NextApiResponse } from 'next';

const ALFA_API_URL = 'https://pay.alfabank.ru/payment/rest'; // Или тестовый URL
const USERNAME = process.env.ALFA_USERNAME;
const PASSWORD = process.env.ALFA_PASSWORD;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { amount, orderNumber } = req.body;

  try {
    // 1. Запрос к Альфа API для создания СБП заказа
    const response = await fetch(`${ALFA_API_URL}/register.do`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        userName: USERNAME!,
        password: PASSWORD!,
        amount: String(amount),
        orderNumber: orderNumber,
        returnUrl: 'https://your-site.com/success',
        currency: '643', // Рубли
        paymentType: 'SBP', // Обязательно для QR
      }),
    });

    const data = await response.json();

    if (data.errorCode) {
      return res.status(400).json({ error: data.errorMessage });
    }

    // 2. Получение данных для QR (например, URL на оплату)
    // Банк возвращает orderId, нужно запросить qr-код отдельно, если не пришел сразу
    res.status(200).json({ qrUrl: data.qrUrl, orderId: data.orderId });

  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}
