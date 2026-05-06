'use client'; 

import { useState } from 'react';
import { redirect } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

import { CustomRequest } from "@/src/libs/request";

export default function BalancePage() {
  const [qrUrl, setQrUrl] = useState<string>('');

  const handleCreateOrder = async () => {

    const path = "/orders/"
    const orderSendData = { amount: 2300, orderNumber: '123' }
    const orderData = await CustomRequest(path, orderSendData)
    console.log('orderData ', orderData, )
    if(orderData.status) {
        // redirect(orderData.data.alpha_form_url)
        setQrUrl(orderData.data.alpha_qr_url);
        return true;
    }
  };

  return (
    <div>
      <button onClick={handleCreateOrder}>Оплатить через СБП</button>
      {qrUrl && (
        <div>
          <p>Отсканируйте QR-код:</p>
          <QRCodeSVG value={qrUrl} size={256} />
        </div>
      )}
    </div>
  );
}