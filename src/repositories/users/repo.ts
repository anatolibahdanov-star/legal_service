import {find, findOne, insert, queryTransactionWrapper, executeTransactionWrapper, update, remove} from '@/src/libs/db';
import { ResultSetHeader } from 'mysql2/promise';
import logger from "@/src/libs/logger"
import {CountResult, DBUser} from "@/src/interfaces/db"
import {DBFilterUsers} from "@/src/interfaces/filters"
import {RegUser} from "@/src/interfaces/api"
import {md5, passGenerator} from "@/src/helpers/tools"

const msgGlobal = "REPO USER "

export async function getUsers(
    page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC'], filter: DBFilterUsers | null = null
): Promise<DBUser[] | null> {
    const msg = msgGlobal + "getUsers - "
    const orderBy = getAdminUserOrder(_sorter);
    const where = getAdminUserFilter(filter);
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const query =  `SELECT * FROM user `+ where +` ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`;
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

export async function getTotalUsers(filter: DBFilterUsers | null = null): Promise<number> {
    const msg = msgGlobal + "getTotalUsers - ";
    const where = getAdminUserFilter(filter)
    const query =  `SELECT COUNT(id) as counter FROM user ` + where;
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

export async function getUsersByIds(ids: string[]): Promise<DBUser | null> {
    const msg = msgGlobal + "getUsersByIds - ";
    const query =  `SELECT * FROM user WHERE id IN (?)`;
    const params = [ids]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBUser>([findFunc], msg);
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

export async function getUserByEmail(email: string): Promise<DBUser | null> {
    const msg = msgGlobal + "getUserByEmail - ";
    const query =  `SELECT * FROM user WHERE email=?`;
    const params = [email]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBUser>([findFunc], msg);
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

export function getAdminUserOrder(orderBy:string[]): string {
    if(orderBy && orderBy.length>0) {
        const field = orderBy[0] ?? "id"
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "id DESC"
}

export function getAdminUserFilter(filter: DBFilterUsers | null = null): string {
    if(filter === null) {
        return ''
    }
    let result = 'WHERE ', isFilter = false;
    if (filter.published_at_lte) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'created_at<="' + filter.published_at_lte + '" ')
        isFilter = true
    }
    if (filter.published_at_gte) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'created_at>="' + filter.published_at_gte + '" ')
        isFilter = true
    }
    if (filter.name) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'name LIKE "%' + filter.name + '%" ')
        isFilter = true
    }
    if (filter.email) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'email LIKE "%' + filter.email + '%" ')
        isFilter = true
    }
    if (filter.status || filter.status === 0) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'status=' + filter.status + ' ')
        isFilter = true
    }
    if (filter.is_register || filter.is_register === 0) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'is_register=' + filter.is_register + ' ')
        isFilter = true
    }
    return isFilter ? result : ''
}

export async function addAnonymousUser(user: DBUser): Promise<DBUser | null> {
    const msg = msgGlobal + "addAnonymousUser - ";
    const userByEmail = await getUserByEmail(user.email)
    if(userByEmail === null) {
        const query = `INSERT INTO user(name, email) VALUES(?, ?)`
        const params = [user.name, user.email];
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
        return await getUsersByIds([insertedId.toString()])
    }
    return userByEmail
}

export async function addUser(user: RegUser): Promise<DBUser | null> {
    const msg = msgGlobal + "addUser - ";
    const query = `INSERT INTO user(name, email, password, is_register) VALUES(?, ?, MD5(?), 1)`
    const params = [user.name, user.email, user.password]
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
    return await getUsersByIds([insertedId.toString()])
}

export async function saveUser(id: string, user: DBUser): Promise<DBUser | null> {
    const msg = msgGlobal + "saveUser - ";
    let query = `UPDATE user SET name=?, email=?, status=? `
    const params = [user.name, user.email, user.status]
    if(user.new_password) {
        query += ', password=MD5(?)'
        params.push(user.new_password)
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

    return user
}

export async function deleteUser(id: string): Promise<DBUser | null> {
    const msg = msgGlobal + "deleteUser - ";
    const user = await getUsersByIds([id])
    if(user === null) {
        logger.warn(msg + "User not found", id)
        return null
    }
    const query = `DELETE FROM user WHERE id=?`;
    const params = [id]
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

    return user
}

export async function login(email: string, password: string): Promise<DBUser | null | undefined> {
    const msg = msgGlobal + "login - "
    const query =  `SELECT * FROM user WHERE email=?`;
    const params = [email]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBUser>([findFunc], msg);
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
    if (rows[0].status === 2) {
        logger.error(msg + 'User blocked', email, password)
        return null
    }
    const user = rows[0]
    if(md5(password) !== user.password) {
        logger.error(msg + 'Incorrect login/password', email, password, user)
        return undefined
    }
    return user
}

export async function profile(id: string, name: string, password: string, oldPassword: string): Promise<DBUser | null | undefined> {
    const msg = msgGlobal + "profile - "
    const query =  `SELECT * FROM user WHERE id=?`;
    const params = [id];
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBUser>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        logger.warn(msg + 'User not found by id', id, name)
        return null
    }

    const user = rows[0]
    if(oldPassword && md5(oldPassword) !== user.password) {
        logger.error(msg + 'Incorrect login/password', id, name, oldPassword, user)
        return undefined
    }

    let userUpdateSQL: string = 'UPDATE user SET name=?'
    const userUpdateData = [name]
    if(password) {
        userUpdateSQL += ', password=MD5(?)'
        userUpdateData.push(password)
    }
    userUpdateSQL += ' WHERE id=?'
    userUpdateData.push(id)

    const updateFunc = update({ query: userUpdateSQL, values: userUpdateData});
    const executedQueries2 = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executedQueries2) {
        logger.error(msg + "SQL not results from execution", userUpdateSQL)
        return null
    }
    const [result] = executedQueries2;
    const updated = result[0]?.affectedRows
    if (updated > 0) {
        logger.info(msg + 'updated', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }

    return user
}

export async function register(name: string, email: string, password: string): Promise<DBUser | null | undefined> {
    const msg = msgGlobal + "register - ";
    const user = await getUserByEmail(email)
    if (user !== null) {
        logger.error(msg + 'User exists', email, name)
        return undefined
    }
    const regUser: RegUser = {name: name, email: email, password: password,}

    const userInserted = await addUser(regUser)
    if(userInserted === null) {
        logger.error(msg + 'Can not add user', regUser)
        return null
    }

    return userInserted
}

export async function reset(email: string): Promise<DBUser | undefined | null> {
    const msg = msgGlobal + "reset - ";
    const user = await getUserByEmail(email)
    if(user === null) {
        logger.error(msg + 'User not found by email', email)
        return undefined
    }
    const newPass = passGenerator(10)
    const query = 'UPDATE user SET password=MD5(?) WHERE id=?'
    const params = [newPass, user.id];
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
    user.password = newPass

    return user
}