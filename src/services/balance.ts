import logger from "@/src/libs/logger"
import { BalanceI, BalanceStatusE, BalanceTransactionI, BalanceTypeE, OrderStatusE } from "@/src/interfaces/payment";
import { addBalanceTransaction } from "@/src/repositories/balances/repo";

export const balanceIncrement = async (balance: BalanceI): Promise<boolean | null> => {
    const msg = "SERVICE BALANCE balanceIncrement - "
    const balanceType = balance.amount > 0 ? BalanceTypeE.Increase : BalanceTypeE.Decrease;
    let orderId = null;
    let orderStatus = balance.status ?? BalanceStatusE.Unknown
    if(balance.order) {
        orderId = parseInt(balance.order.id)
        if(balance.order.status === OrderStatusE.Error) {
            orderStatus = BalanceStatusE.Error
        }
    }
    const data = balance.data ? JSON.stringify(balance.data) : null;
    const trans: BalanceTransactionI = {
        amount: balance.amount,
        balance_type: balanceType,
        order_id: orderId,
        status: orderStatus,
        user_id: parseInt(balance.user.id),
        data: data,
    }
    logger.info(msg + "data for DB balance", trans)
    return await addBalanceTransaction(trans)
}