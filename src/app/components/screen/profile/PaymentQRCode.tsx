import qrCode from "@/public/assets/qr-code.png";
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react';

interface PaymentQRCodePropsI {
    qrUrl: string;
}

const PaymentQRCode = ({qrUrl}: PaymentQRCodePropsI) => {
  return (
    <div className="flex h-full flex-col bg-white rounded shadow-sm border border-[#e0e0e0] bg-card p-6">
      <div className="min-h-[220px]">
        <h3 className="text-lg font-semibold text-foreground">
          Оплатить по QR-коду
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Отсканируйте код в мобильном приложении банка.
        </p>
        <div className="mt-4 flex justify-center">
            <QRCodeSVG value={qrUrl} size={140} />
          {/* <Image src={qrCode} alt="QR-код для оплаты через приложение Альфа-Банк"
            width={140} height={140} className="rounded-md border border-border"
          /> */}
        </div>
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">
          Откройте приложение банка и отсканируйте код
        </p>
        <ol className="mt-2 list-inside list-decimal space-y-0.5 text-sm text-muted-foreground">
          <li>Откройте приложение</li>
          <li>Выберите оплату по QR</li>
          <li>Наведите камеру</li>
          <li>Подтвердите платёж</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          Деньги поступят сразу после оплаты
        </p>
      </div>
    </div>
  );
};

export default PaymentQRCode;