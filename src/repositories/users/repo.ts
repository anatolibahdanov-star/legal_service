import pool from '@/src/libs/db';
import { OkPacket, FieldPacket } from 'mysql2/promise';
import {CountResult, DBUser} from "@/src/interfaces/db"

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

export async function getUsersByIds(ids: string[]): Promise<DBUser[] | null> {
    const msg = "REPO getUsersByIds: "
    const sql: string =  `SELECT * FROM user WHERE id IN (?)`;
    console.log(msg + "params", ids)
    const [rows] = await pool.query<DBUser[]>({sql: sql, values: [ids]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getUserByEmail(email: string): Promise<DBUser[] | null> {
    const msg = "REPO getUserByEmail: "
    const sql: string =  `SELECT * FROM user WHERE email=?`;
    console.log(msg + "params", email)
    const [rows] = await pool.query<DBUser[]>({sql: sql, values: [email]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export function getAdminUserOrder(orderBy:string[]): string {
    if(orderBy && orderBy.length>0) {
        const field = orderBy[0] ?? "id"
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "id DESC"
}

export async function addUser(user: DBUser): Promise<DBUser[] | null> {
    const msg = "REPO addUser: "
    const userByEmail = await getUserByEmail(user.email)
    if(userByEmail === null || userByEmail.length === 0) {
        const userInsertSQL = `INSERT INTO user(name, email) VALUES(?, ?)`
        const [resultUserInsert, ufields] = await pool.execute(userInsertSQL, 
            [user.name, user.email]) as [OkPacket, FieldPacket[]];
        const insertedUserId = resultUserInsert?.insertId
        if (!insertedUserId) {
            console.error("(ERROR)" + msg + "empty inserted user id", user, ufields)
            return null
        }
        console.log(msg + 'inserted', resultUserInsert, ufields)

        return getUsersByIds([insertedUserId.toString()])
    }
    return userByEmail
}

export async function saveUser(id: string, user: DBUser): Promise<DBUser[] | null> {
    const msg = "REPO getUserByEmail: "
    const userUpdateSQL = `UPDATE user SET name=?, email=? WHERE id=?`
    const [resultUserUpdate, ufields] = await pool.execute(userUpdateSQL, [user.name, user.email, id]);
    console.log(msg + 'updated', resultUserUpdate, ufields)

    return [user]
}

export async function deleteUser(id: string): Promise<DBUser[] | null> {
    const msg = "REPO deleteUser: "
    const users = await getUsersByIds([id])
    if(users === null) {
        console.error("(ERROR)" + msg + "user not found", id)
        return null
    }
    const user: DBUser = users[0]
    const userDeleteSQL = `DELETE FROM user WHERE id=?`
    const [resultUserDelete] = await pool.execute(userDeleteSQL, [id]);
    console.log(msg + 'deleted', resultUserDelete)

    return [user]
}