import logger from "@/src/libs/logger"
import {find, findOne, insert, update, remove, queryTransactionWrapper, executeTransactionWrapper} from '@/src/libs/db';
import { ResultSetHeader } from 'mysql2/promise';
import {CountResult, DBContact} from '@/src/interfaces/db'
import { DBFilterContacts } from "@/src/interfaces/filters";
import { UserContactRequest } from "@/src/interfaces/api";
import { EmailStatusesE } from "@/src/interfaces/data";

const msgGlobal = "REPO CONTACT "

export async function getContacts(
    page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC'], filter: DBFilterContacts | null = null
): Promise<DBContact[] | null> {
    const msg = msgGlobal + "getContacts - "
    const orderBy = getAdminContactOrder(_sorter);
    const where = getAdminContactFilter(filter);
    const query =  `SELECT c.*, u.name user_name FROM contact c LEFT JOIN user u ON c.user_id=u.id `
        + where + ` ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`;
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const findFunc = find({ query, values: [limit, offset] });
    const executedQueries = await queryTransactionWrapper<DBContact>([findFunc], msg);
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

export async function getTotalContacts(filter: DBFilterContacts | null = null): Promise<number> {
    const msg = msgGlobal + "getTotalContacts - ";
    const where = getAdminContactFilter(filter)
    const query = `SELECT COUNT(c.id) as counter FROM contact c LEFT JOIN user u ON c.user_id=u.id ` + where;
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

export async function getContactById(id: number): Promise<DBContact | null> {
    const msg = msgGlobal + "getContactById - ";
    const query = `SELECT c.*, u.name user_name FROM contact c LEFT JOIN user u ON c.user_id=u.id WHERE c.id=?`;
    const findFunc = find({ query, values: [id] });
    const executedQueries = await queryTransactionWrapper<DBContact>([findFunc], msg);
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

export function getAdminContactOrder(orderBy:string[]): string {
    if(orderBy && orderBy.length>0) {
        const field = orderBy[0] ?? "id"
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "id DESC"
}

export function getAdminContactFilter(filter: DBFilterContacts | null = null): string {
    if(filter === null) {
        return ''
    }
    let result = 'WHERE ', isFilter = false;
    if (filter.published_at_lte) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'с.created_at<="' + filter.published_at_lte + '" ')
        isFilter = true
    }
    if (filter.published_at_gte) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'с.created_at>="' + filter.published_at_gte + '" ')
        isFilter = true
    }
    if (filter.user_id) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'с.user_id=' + filter.user_id + ' ')
        isFilter = true
    }
    if (filter.email_status || filter.email_status===0) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'c.email_status=' + filter.email_status + ' ')
        isFilter = true
    }
    if (filter.user_name) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'u.name LIKE "%' + filter.user_name + '%" ')
        isFilter = true
    }
    if (filter.email) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'c.email LIKE "%' + filter.email + '%" ')
        isFilter = true
    }
    if (filter.phone) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'c.phone LIKE "%' + filter.phone + '%" ')
        isFilter = true
    }
    if (filter.message) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'c.message LIKE "%' + filter.message + '%" ')
        isFilter = true
    }
    return isFilter ? result : ''
}

export async function deleteContact(id: string): Promise<DBContact | null> {
    const msg = msgGlobal + "deleteContact - ";
    const contact = await getContactById(parseInt(id))
    if(contact === null) {
        logger.error(msg + 'Contact not found', id)
        return null
    }

    const query = `DELETE FROM contact WHERE id=?`;
    const params = [contact.id]
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

    return contact
}

export async function createClientContact(contactInfo: UserContactRequest): Promise<DBContact | null> {
    const msg = msgGlobal + "createClientContact - ";
    const query = `INSERT INTO contact(user_id, email, phone, message, email_status) VALUES(?, ?, ?, ?, ?)`
    const userId = contactInfo.user_id && contactInfo.user_id !== '' ? contactInfo.user_id : null 
    const params = [userId, contactInfo.email, contactInfo.phone, contactInfo.message, EmailStatusesE.None];
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

    return getContactById(insertedId)
}

export async function updateContactEmailStatus(id: number, email_status: EmailStatusesE): Promise<DBContact | null> {
    const msg = msgGlobal + "updateContactEmailStatus - ";
    const query = `UPDATE contact SET email_status=? WHERE id=?`
    const params = [email_status, id];
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
    
    return getContactById(id)
}
