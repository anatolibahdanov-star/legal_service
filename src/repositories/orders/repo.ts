import logger from "@/src/libs/logger"
import {find, findOne, insert, queryTransactionWrapper, executeTransactionWrapper, update, remove} from '@/src/libs/db';
import { ResultSetHeader } from 'mysql2/promise';
import {DBOrder, CountResult} from '@/src/interfaces/db'
import { DBFilterOrders } from "@/src/interfaces/filters";
import { PaymentInfoRequest, PaymentStatusUpdateI, UserBalanceRequest } from "@/src/interfaces/api";
import { AlfaOrderStatusE, OrderStatusE } from "@/src/interfaces/payment";

const msgGlobal = "REPO ORDER "

export async function getOrders(
    page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC'], filter: DBFilterOrders | null = null
): Promise<DBOrder[] | null> {
    const msg = msgGlobal + "getOrders - "
    const orderBy = getAdminOrderOrder(_sorter);
    const where = getAdminOrderFilter(filter)
    const query =  `SELECT po.*, po.order_type ptype, u.name user_name FROM porder po INNER JOIN user u ON po.user_id=u.id `
     + where + ` ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`;
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const findFunc = find({ query, values: [limit, offset] });
    const executedQueries = await queryTransactionWrapper<DBOrder>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getTotalOrders(filter: DBFilterOrders | null = null): Promise<number> {
    const msg = msgGlobal + "getTotalOrders - ";
    const where = getAdminOrderFilter(filter)
    const query =  `SELECT COUNT(po.id) as counter FROM porder po INNER JOIN user u ON po.user_id=u.id ` + where;
    const calcFunc = findOne({ query: query, values: [] });
    const executedQueries = await queryTransactionWrapper<CountResult>([calcFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return 0
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        return 0
    }
    return rows[0].counter;
}

export async function getOrderById(id: string, isId: boolean = true): Promise<DBOrder | null> {
    const msg = msgGlobal + "getOrderById - ";
    let query =  `SELECT po.*, po.order_type ptype, u.name user_name FROM porder po INNER JOIN user u ON po.user_id=u.id WHERE `;
    query += (isId ? 'po.id=?' : 'po.alpha_id=?')
    const params = [id]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBOrder>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        return null
    }
    return rows[0]
}

export function getAdminOrderOrder(orderBy:string[]): string {
    if(orderBy && orderBy.length>0) {
        const field = orderBy[0] ?? "id"
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "id DESC"
}

export function getAdminOrderFilter(filter: DBFilterOrders | null = null): string {
    if(filter === null) {
        return ''
    }
    let result = 'WHERE ', isFilter = false;
    if (filter.published_at_lte) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'po.created_at<="' + filter.published_at_lte + '" ')
        isFilter = true
    }
    if (filter.published_at_gte) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'po.created_at>="' + filter.published_at_gte + '" ')
        isFilter = true
    }
    if (filter.user_id) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'po.user_id=' + filter.user_id + ' ')
        isFilter = true
    }
    if (filter.status || filter.status===0) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'po.status=' + filter.status + ' ')
        isFilter = true
    }
    if (filter.order_type || filter.order_type===0) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'po.order_type=' + filter.order_type + ' ')
        isFilter = true
    }
    if (filter.user_name) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'u.name LIKE "%' + filter.user_name + '%" ')
        isFilter = true
    }
    if (filter.user_email) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'u.email LIKE "%' + filter.user_email + '%" ')
        isFilter = true
    }
    if (filter.alpha_id) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'po.alpha_id LIKE "%' + filter.alpha_id + '%" ')
        isFilter = true
    }
    return isFilter ? result : ''
}

export async function deleteOrder(id: string): Promise<DBOrder | null> {
    const msg = msgGlobal + "deleteOrder - ";
    const order = await getOrderById(id)
    if(order === null) {
        logger.error(msg + 'Order not found', id)
        return null
    }
    const query = `DELETE FROM porder WHERE id=?`;
    const params = [order.id]
    const deleteFunc = remove({ query, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([deleteFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [result] = executedQueries;
    const deleted = result[0]?.affectedRows
    if (deleted > 0) {
        logger.info(msg + 'deleted', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }

    return order
}

export async function createEmptyOrder(userId: string, userOrder: UserBalanceRequest): Promise<DBOrder | null> {
    const msg = msgGlobal + "createEmptyOrder - ";
    const dataJson = userOrder.data ? JSON.stringify(userOrder.data) : null;
    const query = `INSERT INTO porder(user_id, amount, order_type, status, alpha_id, alpha_status, alpha_qr_url, alpha_form_url, data)
    VALUES(?, ?, ?, ?, '', ?, '', '', ?)`
    const params = [userId, userOrder.amount, userOrder.type, userOrder.status, AlfaOrderStatusE.New, dataJson]
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

    return getOrderById(insertedId.toString())
}

export async function updateClientOrder(orderInfo: PaymentInfoRequest): Promise<DBOrder | null> {
    const msg = msgGlobal + "updateClientOrder - ";
    const query = `UPDATE porder SET alpha_id=?, alpha_status=?, alpha_form_url=?, status=?, updated_at=NOW() WHERE id=?`
    const params = [orderInfo.alpha_id, orderInfo.alpha_status, orderInfo.alpha_form_url, orderInfo.status, orderInfo.order_id]
    const updateFunc = update({ query, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [result] = executedQueries;
    const updated = result[0]?.affectedRows
    if (updated > 0) {
        logger.info(msg + 'updated', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }

    return getOrderById(orderInfo.order_id)
}

export async function updateClientOrderQR(orderId: string, qr: string): Promise<DBOrder | null> {
    const msg = msgGlobal + "updateClientOrderQR - ";
    const query = `UPDATE porder SET alpha_qr_url=?, updated_at=NOW() WHERE id=?`
    const params = [qr, orderId]
    const updateFunc = update({ query, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [result] = executedQueries;
    const updated = result[0]?.affectedRows
    if (updated > 0) {
        logger.info(msg + 'updated', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }

    return getOrderById(orderId)
}

export async function updateOrderStatus(orderInfo: PaymentStatusUpdateI): Promise<DBOrder | null> {
    const msg = msgGlobal + "updateOrderStatus - ";
    const data = orderInfo.transaction_info ? JSON.stringify(orderInfo.transaction_info) : null
    const query = `UPDATE porder SET alpha_status=?, status=?, data=?, updated_at=NOW() WHERE id=?`
    const params = [orderInfo.alpha_status, orderInfo.status, data, orderInfo.order_id]
    const updateFunc = update({ query, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [result] = executedQueries;
    const updated = result[0]?.affectedRows
    if (updated > 0) {
        logger.info(msg + 'updated', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }

    return getOrderById(orderInfo.order_id)
}

/**
 * Links a payment order to a question. Used after wizard balance/card payments
 * to make the order traceable to the funded question (audit + future receipts).
 */
export async function updateOrderQuestionLink(
    orderId: string | number,
    questionId: string | number,
): Promise<boolean> {
    const msg = msgGlobal + "updateOrderQuestionLink - ";
    const query = `UPDATE porder SET question_id = ?, updated_at = NOW() WHERE id = ?`;
    const params = [questionId, orderId];
    const updateFunc = update({ query, values: params });
    const executed = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL failed', { order_id: orderId, question_id: questionId });
        return false;
    }
    const affected = executed[0]?.[0]?.affectedRows ?? 0;
    if (!affected) {
        logger.warn(msg + 'no rows updated', { order_id: orderId, question_id: questionId });
        return false;
    }
    logger.info(msg + 'linked', { order_id: orderId, question_id: questionId });
    return true;
}

export async function getActiveOrderByUserId(userId: string): Promise<DBOrder | null | undefined> {
    const msg = msgGlobal + "getActiveOrderByUserId - "
    const query =  `SELECT po.*, po.order_type ptype, u.name user_name FROM porder po INNER JOIN user u ON po.user_id=u.id 
        WHERE po.user_id=? AND po.status=? AND po.alpha_status IN (?) AND po.created_at > NOW() - INTERVAL 1 DAY`;
    const statuses = [AlfaOrderStatusE.New, AlfaOrderStatusE.Hold, AlfaOrderStatusE.Register]
    const params = [userId, OrderStatusE.InProgress, statuses]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBOrder>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        return null
    }
    if (rows.length > 1) {
        return undefined
    }
    return rows[0]
}
