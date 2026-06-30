import { useState, useEffect } from "react";
import { redirect } from 'next/navigation';
import Swal from 'sweetalert2'
import BalanceCard from "@/src/app/components/screen/profile/BalanceCard"
import PaymentAlfaBank from "@/src/app/components/screen/profile/PaymentAlfaBank"
import PaymentQRCode from "@/src/app/components/screen/profile/PaymentQRCode"
import { CustomGetRequest, CustomRequest } from "@/src/libs/request";
import type { DBOrder, DBUser } from "@/src/interfaces/db";
import { AlfaOrderStatusE, OrderTypeE } from "@/src/interfaces/payment";

export const isAlphaStatusFinal = (status: number): boolean => {
    return ![
        AlfaOrderStatusE.Register,
        AlfaOrderStatusE.New,
        AlfaOrderStatusE.Hold
    ].includes(status)
}

interface ProfileBalancePropsI {
  data: DBUser|null;
  setUserBalance: (balance: number) => void;
}

export const ProfileBalance = ({data, setUserBalance}: ProfileBalancePropsI) => {
    const [newOrder, setNewOrder] = useState<DBOrder|null>(null);

    const queryParams = new URLSearchParams(window.location.search);
    const msg = queryParams.get('msg');
    console.log("Params", msg)
    const [minTopupRub, setMinTopupRub] = useState(100)
    const topupKop = Math.round(minTopupRub * 100)

    useEffect(() => {
        const fetchMinTopup = async () => {
            const res = await CustomGetRequest("/orders/min-topup/")
            if(res.status && typeof res.data?.minTopupRub === "number") {
                setMinTopupRub(res.data.minTopupRub)
            }
        };
        fetchMinTopup();
    }, []);

    useEffect(() => {
        if(!newOrder) {
            const fetchData = async () => {
                const path = "/check/"
                const orderData = await CustomGetRequest(path)
                console.log('user empty order', orderData, )
                if(orderData.status) {
                    setNewOrder(orderData.data)
                    return true;
                }
            };
            fetchData();
        }
    }, [newOrder]);

    useEffect(() => {
        if(newOrder && !isAlphaStatusFinal(newOrder.alpha_status)) {
          const intervalId = setInterval(async () => {
              const path = "/status/"
              const orderData = await CustomRequest(path, {slug: newOrder.alpha_id})
              console.log('user status order', orderData, )
              if(orderData.status) {
                  if(isAlphaStatusFinal(orderData.data.alpha_status)) {
                      clearInterval(intervalId);
                      // Only credit the local balance UI for actual Balance top-ups.
                      // /api/check already filters to Balance orders, but keep the
                      // guard here so a stale/foreign order can't trigger the modal.
                      if(orderData.data.alpha_status === AlfaOrderStatusE.Auth
                          && orderData.data.ptype === OrderTypeE.Balance) {
                          setUserBalance(orderData.data.amount)
                      }
                      setNewOrder(null)
                  }
                  return true;
              }
          }, 2000); // Fetch every 2 seconds

          return () => clearInterval(intervalId); // Cleanup
        }
    }, [newOrder, setUserBalance]);

    const qrUrl = newOrder?.alpha_qr_url ?? null;
    const alfaUrl = newOrder?.alpha_form_url ?? null;
    
    const handleCreateOrder = async () => {
        const path = "/orders/"
        const orderSendData = { amount: topupKop }
        const orderData = await CustomRequest(path, orderSendData)
        console.log('handleCreateOrder orderData', orderData, )
        if(orderData.status) {
            setNewOrder(orderData.data)
            return true;
        }
    };

    const redirectToAlfa = () => {
      console.log("redirectToAlfa act")
      if(alfaUrl) redirect(alfaUrl)
      return false;
    }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4">
        {/* Balance */}
        <div className="mt-8">
          <BalanceCard data={data} handleCreateOrder={handleCreateOrder} minTopupRub={minTopupRub} />
        </div>

        {/* Payment methods */}
        {qrUrl && (<h2 className="mt-10 text-lg font-semibold text-foreground">Пополнение баланса</h2>)}
          
        {qrUrl && (
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <PaymentAlfaBank redirectToAlfa={redirectToAlfa} />
            <PaymentQRCode qrUrl={qrUrl} />
          </div>
        )}
      </div>
    </div>
  )
}