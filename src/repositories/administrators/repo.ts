import {find, findOne, insert, queryTransactionWrapper, executeTransactionWrapper, update, remove} from '@/src/libs/db';
import { ResultSetHeader } from 'mysql2/promise';
import {CountResult, DBUser} from "@/src/interfaces/db"
import {DBFilterAdministrators} from "@/src/interfaces/filters"
import {md5} from "@/src/helpers/tools"
import logger from "@/src/libs/logger"

const msgGlobal = "REPO ADMINISTRATOR "

export async function getAdministrators(
    page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC'], filter: DBFilterAdministrators | null = null
): Promise<DBUser[] | null> {
    const msg = msgGlobal + "getAdministrators - "
    const orderBy = getAdminAdministratorOrder(_sorter);
    const where = getAdminAdministratorFilter(filter)
    const query =  `SELECT *, IF(is_super=1, 'true', 'false') as is_super_bool FROM administrator ` + where + ` ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`;
    
    const limit = parseInt(_limit) ?? 10;
    const offset = ((parseInt(page) ?? 1) - 1) * limit;
    const params = [limit, offset]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBUser>([findFunc], msg);
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

export async function getTotalAdministrators(filter: DBFilterAdministrators | null = null): Promise<number | null> {
    const msg = msgGlobal + "getTotalAdministrators - ";
    const where = getAdminAdministratorFilter(filter);
    const query = `SELECT COUNT(id) as counter FROM administrator ` + where;
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

export async function getAdministratorsByIds(ids: string[]): Promise<DBUser[] | null> {
    const msg = msgGlobal + "getAdministratorsByIds - ";
    const query =  `SELECT * FROM administrator WHERE id IN (?)`;
    const params = [ids]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBUser>([findFunc], msg);
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

export async function getAdministratorByEmailOnly(email: string): Promise<DBUser | null> {
    const msg = msgGlobal + "getAdministratorByEmailOnly - ";
    const query = `SELECT name, email, id, username, password, is_super, status, created_at FROM administrator WHERE email=?`;
    const findFunc = find({ query, values: [email] });
    const executed = await queryTransactionWrapper<DBUser>([findFunc], msg);
    if (!executed) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executed;
    if (rows.length === 0) return null;
    if (rows.length > 1) {
        logger.error(msg + 'Double admin found', email)
        return null;
    }
    return rows[0];
}

export async function getAdministratorByEmail(email: string, password: string): Promise<DBUser | null | undefined> {
    const msg = msgGlobal + "getAdministratorByEmail - ";
    const query =  `SELECT name, email, id, username, password, is_super, status, created_at FROM administrator WHERE email=?`;
    // logger.info(msg + "params", email, password)
    const findUserQueryFunction = find({ query, values: [email] });
    const executedQueries = await queryTransactionWrapper<DBUser>([findUserQueryFunction], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        logger.error(msg + 'User with email/password not found', email, password)
        return null
    }
    if (rows.length > 1) {
        logger.error(msg + 'Double User found', email, password)
        return null
    }
    const user = rows[0]
    if(md5(password) !== user.password) {
        logger.error(msg + 'Incorrect login/password', email, password, user)
        return undefined
    }
    logger.info(msg + "Successfull login", user)
    return user
}

export function getAdminAdministratorOrder(orderBy:string[]): string {
    if(orderBy && orderBy.length>0) {
        const field = orderBy[0] ?? "id"
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "id DESC"
}

export function getAdminAdministratorFilter(filter: DBFilterAdministrators | null = null): string {
    if(filter === null) {
        return ''
    }
    let result = 'WHERE ', isFilter = false;
    if (filter.published_at_lte) {
        result += 'created_at<="' + filter.published_at_lte + '" '
        isFilter = true
    }
    if (filter.published_at_gte) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'created_at>="' + filter.published_at_gte + '" ')
        isFilter = true
    }
    if (filter.username) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'username LIKE "%' + filter.username + '%" ')
        isFilter = true
    }
    if (filter.name) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'name LIKE "%' + filter.name + '%" ')
        isFilter = true
    }
    if (filter.status || filter.status===0) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'status=' + filter.status + ' ')
        isFilter = true
    }
    if (filter.id) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'id=' + filter.id + ' ')
        isFilter = true
    }
    if (filter.is_super || filter.is_super === 0) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'is_super=' + filter.is_super + ' ')
        isFilter = true
    }
    return isFilter ? result : ''
}

export async function addAdministrator(admin: DBUser): Promise<DBUser[] | null> {
    const msg = msgGlobal + "addAdministrator - ";
    const query = `INSERT INTO
        administrator(name, email, username, password, created_admin_id, status, is_super)
        VALUES(?, ?, ?, ?, ?, ?, ?)`
    const params = [admin.name, admin.email, admin.username, md5(admin.password), 2, admin.status, admin.is_super];
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
    return getAdministratorsByIds([insertedId.toString()])
}

export async function saveAdministrator(id: string, admin: DBUser): Promise<DBUser[] | null> {
    const msg = msgGlobal + "saveAdministrator - ";
    let query = 'UPDATE administrator SET name=?, email=?, username=?, status=?, is_super=? '
    const params = [admin.name, admin.email, admin.username, admin.status, admin.is_super];
    if(admin.new_password) {
        query += ', password=?'
        params.push(md5(admin.new_password))
    }
    query += ' WHERE id=?'
    params.push(id)

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

    return getAdministratorsByIds([id])
}

export async function deleteAdministrator(id: string): Promise<DBUser[] | null> {
    const msg = msgGlobal + "deleteAdministrator - ";
    const admins = await getAdministratorsByIds([id])
    if(admins === null) {
        logger.error(msg + 'Admin not found ', id)
        return null
    }
    const admin: DBUser = admins[0]

    const query = `DELETE FROM administrator WHERE id=?`;
    const params = [admin.id]
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

    return [admin]
}

export async function updateAdministratorRating(id: string, rating: string): Promise<boolean> {
    const msg = msgGlobal + "updateAdministratorRating - ";
    const query = `UPDATE administrator SET rating=? WHERE id=?`;
    const params = [rating, id]
    const userFunc = update({ query, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([userFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return false
    }
    const [result] = executedQueries;
    const updated = result[0]?.affectedRows
    if (updated > 0) {
        logger.info(msg + 'updated', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }
    return true
}