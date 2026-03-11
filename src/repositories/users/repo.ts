import pool from '@/src/libs/db';
import { OkPacket, FieldPacket } from 'mysql2/promise';
import logger from "@/src/services/logger"
import {CountResult, DBUser} from "@/src/interfaces/db"
import {RegUser} from "@/src/interfaces/api"
import {md5, passGenerator} from "@/src/helpers/tools"

export async function getUsers(page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC']): Promise<DBUser[] | null> {
    const orderBy = getAdminUserOrder(_sorter);
    const sql: string =  `SELECT * FROM user ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`;
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const [rows] = await pool.query<DBUser[]>({sql: sql, values: [limit, offset]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getTotalUsers(): Promise<number> {
    const sql: string =  `SELECT COUNT(id) as counter FROM user`;
    const [rows] = await pool.query<CountResult[]>({sql: sql});
    if (rows.length === 0) {
        return 0
    }
    const totalCount = rows[0].counter;
    return totalCount
}

export async function getUsersByIds(ids: string[]): Promise<DBUser | null> {
    const msg = "REPO getUsersByIds: "
    const sql: string =  `SELECT * FROM user WHERE id IN (?)`;
    logger.info(msg + "params", ids)
    const [rows] = await pool.query<DBUser[]>({sql: sql, values: [ids]});
    if (rows.length === 0) {
        return null
    }
    return rows[0]
}

export async function getUserByEmail(email: string): Promise<DBUser | null> {
    const msg = "REPO getUserByEmail: "
    const sql: string =  `SELECT * FROM user WHERE email=?`;
    // logger.info(msg + "params", email)
    const [rows] = await pool.query<DBUser[]>({sql: sql, values: [email]});
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

export async function addAnonymousUser(user: DBUser): Promise<DBUser | null> {
    const msg = "REPO addAnonymousUser: "
    const userByEmail = await getUserByEmail(user.email)
    if(userByEmail === null) {
        const userInsertSQL = `INSERT INTO user(name, email) VALUES(?, ?)`
        const [resultUserInsert, ufields] = await pool.execute(userInsertSQL, 
            [user.name, user.email]) as [OkPacket, FieldPacket[]];
        const insertedUserId = resultUserInsert?.insertId
        if (!insertedUserId) {
            logger.error("(ERROR)" + msg + "empty inserted user id", user, ufields)
            return null
        }
        logger.info(msg + 'inserted', resultUserInsert, ufields)

        return await getUsersByIds([insertedUserId.toString()])
    }
    return userByEmail
}

export async function addUser(user: RegUser): Promise<DBUser | null> {
    const msg = "REPO addUser: "
    const userInsertSQL = `INSERT INTO user(name, email, password, is_register) VALUES(?, ?, MD5(?), 1)`
    const [resultUserInsert, ufields] = await pool.execute(userInsertSQL, 
        [user.name, user.email, user.password]) as [OkPacket, FieldPacket[]];
    const insertedUserId = resultUserInsert?.insertId
    if (!insertedUserId) {
        logger.error("(ERROR)" + msg + "empty inserted user id", user, ufields)
        return null
    }
    logger.info(msg + 'inserted', resultUserInsert, ufields)

    return await getUsersByIds([insertedUserId.toString()])
}

export async function saveUser(id: string, user: DBUser): Promise<DBUser[] | null> {
    const msg = "REPO getUserByEmail: "
    const userUpdateSQL = `UPDATE user SET name=?, email=? WHERE id=?`
    const [resultUserUpdate, ufields] = await pool.execute(userUpdateSQL, [user.name, user.email, id]);
    logger.info(msg + 'updated', resultUserUpdate, ufields)

    return [user]
}

export async function deleteUser(id: string): Promise<DBUser | null> {
    const msg = "REPO deleteUser: "
    const user = await getUsersByIds([id])
    if(user === null) {
        logger.warn("(ERROR)" + msg + "user not found", id)
        return null
    }
    const userDeleteSQL = `DELETE FROM user WHERE id=?`
    const [resultUserDelete] = await pool.execute(userDeleteSQL, [id]);
    logger.info(msg + 'deleted', resultUserDelete)

    return user
}

export async function login(email: string, password: string): Promise<DBUser | null | undefined> {
    const msg = "REPO login - "
    const sql: string =  `SELECT * FROM user WHERE email=?`;
    const [rows] = await pool.query<DBUser[]>({sql: sql, values: [email]});
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
    logger.debug(msg + "Successfull login", user)
    return user
}

export async function profile(id: string, name: string, password: string, oldPassword: string): Promise<DBUser | null | undefined> {
    const msg = "REPO profile: "
    const sql: string =  `SELECT * FROM user WHERE id=?`;
    const [rows] = await pool.query<DBUser[]>({sql: sql, values: [id]});
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
    const params = [name]
    if(password) {
        userUpdateSQL += ', password=MD5(?)'
        params.push(password)
    }
    userUpdateSQL += ' WHERE id=?'
    params.push(id)

    const [resultUserUpdate, ufields] = await pool.execute(userUpdateSQL, params);
    logger.info(msg + 'updated', resultUserUpdate, ufields)

    return user
}

export async function register(name: string, email: string, password: string): Promise<DBUser | null | undefined> {
    const msg = "REPO register: "

    const user = await getUserByEmail(email)
    if (user !== null) {
        logger.error(msg + 'User exists', email, name)
        return undefined
    }
    const regUser: RegUser = {
        name: name,
        email: email,
        password: password,
    }

    const userInserted = await addUser(regUser)
    if(userInserted === null) {
        logger.error(msg + 'Can not add user', regUser)
        return null
    }

    return userInserted
}

export async function reset(email: string): Promise<DBUser | undefined> {
    const msg = "REPO reset - "
    const user = await getUserByEmail(email)
    if(user === null) {
        logger.error(msg + 'User not found by email', email)
        return undefined
    }
    const newPass = passGenerator(10)
    const userUpdateSQL: string = 'UPDATE user SET password=MD5(?) WHERE id=?'
    const [resultUserUpdate, ufields] = await pool.execute(userUpdateSQL, [newPass, user.id]);
    logger.info(msg + 'updated', resultUserUpdate, ufields)
    user.password = newPass

    return user
}