import logger from "@/src/libs/logger"
import {insert, executeTransactionWrapper} from '@/src/libs/db';
import { ResultSetHeader } from 'mysql2/promise';
import { TransactionI } from "@/src/interfaces/payment";

const msgGlobal = "REPO TRANSACTION "

export async function addTransaction(trans: TransactionI): Promise<boolean | null> {
    const msg = msgGlobal + "addTransaction - ";
    trans.data = trans.data ? JSON.stringify(trans.data) : null
    const query = `INSERT INTO ptransaction(order_id, trans_type, status, data, created_at) VALUES(?, ?, ?, ?, NOW())`
    const params = [trans.order_id, trans.trans_type, trans.status, trans.data]
    const insertFunc = insert({ query, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [resultInsert] = executedQueries;
    const insertedId = resultInsert[0]?.insertId
    if (!insertedId) {
        logger.error(msg + "Empty inserted id", resultInsert[0])
        return null
    }
    return true
}
