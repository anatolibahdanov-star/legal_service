import {User} from "next-auth"
import pool from '@/src/libs/db';
import { OkPacket, RowDataPacket, FieldPacket } from 'mysql2/promise';
import { DateTime } from "next-auth/providers/kakao";

export interface DBAdminUser extends RowDataPacket, User {
  id: string;
  name: string;
  email: string;
  password: string;
  admin_id: number;
  username: string;
  is_super: boolean;
  is_super_bool: string;
  status: number;
  user_id: string;
  created_at: DateTime;
}

interface CountResult extends RowDataPacket {
  counter: number; // The alias from the SQL query
}

export async function getAdministrators(page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC']): Promise<DBAdminUser[] | null> {
    const orderBy = getAdminAdministratorOrder(_sorter);
    const sql: string =  `SELECT u.name as name, u.email as email, ad.id as id, ad.username as username, 
    ad.password as password, IF(ad.is_super=1, 'true', 'false') as is_super_bool, ad.is_super as is_super,ad.status as status, 
    ad.created_at as created_at, u.id as user_id 
    FROM user u JOIN administrator ad ON u.id=ad.user_id
    ORDER BY ` + orderBy +
    ` LIMIT ?
    OFFSET ?`;
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const [rows] = await pool.query<DBAdminUser[]>({sql: sql, values: [limit, offset]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getTotalAdministrators(): Promise<number> {
    const sql: string =  `SELECT COUNT(ad.id) as counter
    FROM user u JOIN administrator ad ON u.id=ad.user_id
    ORDER BY ad.id DESC`;
    const [rows] = await pool.query<CountResult[]>({sql: sql});
    if (rows.length === 0) {
        return 0
    }
    const totalCount = rows[0].counter;
    return totalCount
}

export async function getAdministratorsByIds(ids: string[]): Promise<DBAdminUser[] | null> {
    const sql: string =  `SELECT u.name as name, u.email as email, ad.id as id, ad.username as username, 
    ad.password as password, ad.is_super as is_super, ad.status as status, ad.created_at as created_at, u.id as user_id 
    FROM user u JOIN administrator ad ON u.id=ad.user_id
    WHERE ad.id IN (?)`;
    console.log("getAdministratorsByIds params", ids)
    const [rows] = await pool.query<DBAdminUser[]>({sql: sql, values: [ids]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export function getAdminAdministratorOrder(orderBy:string[]): string {
    console.log('orderBy ', orderBy)
    const tablesFields: { [key: string]: string } = {
        "id": "ad.id",
        "admin_id": "ad.id",
        "name": "u.name",
        "username": "ad.username",
        "email": "u.email",
        "is_super": "ad.is_super",
        "created_at": "ad.created_at",
    }
    if(orderBy && orderBy.length>0) {
        const field = orderBy[0] in tablesFields ? tablesFields[orderBy[0]] : "ad.id"
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "ad.id DESC"
}

export async function addAdministrator(admin: DBAdminUser): Promise<DBAdminUser[] | null> {

    const userInsertSQL = `INSERT INTO user(name, email) VALUES(?, ?)`
    const [resultUserInsert, ufields] = await pool.execute(userInsertSQL, [admin.name, admin.email]) as [OkPacket, FieldPacket[]];
    console.log('inserted data ', resultUserInsert, ufields)
    const insertedUserId = resultUserInsert?.insertId
    if (!insertedUserId) {
        console.log("ADMIN repo INSERT User: empty inserted user id", admin, ufields)
        return null
    }

    const adminInsertSQL = `INSERT INTO administrator(username, password, created_admin_id, user_id, status, is_super) VALUES(?, MD5(?), ?, ?, ?, ?)`
    const [resultAdminInsert, afields] = await pool.execute(adminInsertSQL, 
        [admin.username, admin.password, 2, insertedUserId, admin.status, admin.is_super]) as [OkPacket, FieldPacket[]];
    console.log('inserted data2 ', resultAdminInsert, afields)
    const insertedAdminId = resultAdminInsert.insertId
    if (!insertedAdminId) {
        console.log("ADMIN repo INSERT Admin: empty inserted admin id", admin, afields)
        return null
    }
    return getAdministratorsByIds([insertedAdminId.toString()])
}

export async function saveAdministrator(id: string, admin: DBAdminUser): Promise<DBAdminUser[] | null> {

    const userUpdateSQL = `UPDATE user SET name=?, email=? WHERE id=?`
    const [resultUserUpdate, ufields] = await pool.execute(userUpdateSQL, [admin.name, admin.email, admin.user_id]);
    console.log('Updated data user ', resultUserUpdate, ufields)

    const adminUpdateSQL = `UPDATE administrator SET username=?, password=MD5(?), status=?, is_super=? WHERE id=?`
    const [resultAdminUpdate, afields] = await pool.execute(adminUpdateSQL, [
        admin.username, admin.password, admin.status, admin.is_super, id
    ]);
    console.log('Updated data admin ', resultAdminUpdate, afields)

    return [admin]
}

export async function deleteAdministrator(id: string): Promise<DBAdminUser[] | null> {

    const admins = await getAdministratorsByIds([id])
    if(admins === null) {
        console.log('DELETE admin: admin not found ', id)
        return null
    }
    const admin: DBAdminUser = admins[0]

    const adminDeleteSQL = `DELETE FROM administrator WHERE id=?`
    const [resultAdminDelete] = await pool.execute(adminDeleteSQL, [admin.id]);
    console.log('delete data admin ', resultAdminDelete)

    const userDeleteSQL = `DELETE FROM user WHERE id=?`
    const [resultUserDelete] = await pool.execute(userDeleteSQL, [admin.user_id]);
    console.log('delete data user ', resultUserDelete)

    return [admin]
}