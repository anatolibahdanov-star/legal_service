import logger from "@/src/libs/logger"
import {insert, executeTransactionWrapper, update} from '@/src/libs/db';
import { ResultSetHeader } from 'mysql2/promise';
import { BalanceTransactionI } from "@/src/interfaces/payment";

const msgGlobal = "REPO BALANCE "

export async function addBalance(trans: BalanceTransactionI): Promise<boolean | null> {
    const msg = msgGlobal + "addBalance - "
    trans.data = trans.data ? JSON.stringify(trans.data) : null;
    const query = `INSERT INTO 
        balance(user_id, order_id, balance_type, amount, status, data, created_at, updated_at) 
        VALUES(?, ?, ?, ?, ?, ?, NOW(), NOW())`
    const params = [trans.user_id, trans.order_id, trans.balance_type, trans.amount, trans.status, trans.data];
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

export async function addBalanceTransaction(trans: BalanceTransactionI): Promise<boolean | null> {
    const msg = msgGlobal + "addBalanceTransaction - "
    trans.data = trans.data ? JSON.stringify(trans.data) : null;

    const insertSQL = `
        INSERT INTO 
        balance(user_id, order_id, balance_type, amount, status, data, created_at, updated_at) 
        VALUES(?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const insertData = [trans.user_id, trans.order_id, trans.balance_type, trans.amount, trans.status, trans.data]
    const insertFunc = insert({ query: insertSQL, values: insertData});
    const updateSQL = `UPDATE user SET balance=balance + ? WHERE id=?`;
    const updateData = [trans.amount, trans.user_id]
    const updatedFunc = update({ query: updateSQL, values: updateData});

    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([insertFunc, updatedFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", insertSQL, updateSQL)
        return null
    }
    const [results] = executedQueries;
    logger.info(msg + "transaction results", results)

    return true
}
