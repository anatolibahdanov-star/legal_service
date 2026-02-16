import pool from '@/src/libs/db';
import { OkPacket, FieldPacket } from 'mysql2/promise';
import {CountResult, DBAdminUser} from "@/src/interfaces/db"


export async function getAdministrators(page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC']): Promise<DBAdminUser[] | null> {
    const orderBy = getAdminAdministratorOrder(_sorter);
    const sql: string =  `SELECT name, email, id, username, password, 
    IF(is_super=1, 'true', 'false') as is_super_bool, is_super, status, created_at 
    FROM administrator 
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
    const sql: string =  `SELECT COUNT(id) as counter FROM administrator ORDER BY id DESC`;
    const [rows] = await pool.query<CountResult[]>({sql: sql});
    if (rows.length === 0) {
        return 0
    }
    const totalCount = rows[0].counter;
    return totalCount
}

export async function getAdministratorsByIds(ids: string[]): Promise<DBAdminUser[] | null> {
    const sql: string =  `SELECT name, email, id, username, password, is_super, status, created_at 
    FROM administrator WHERE id IN (?)`;
    console.log("REPO getAdministratorsByIds: params", ids)
    const [rows] = await pool.query<DBAdminUser[]>({sql: sql, values: [ids]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export function getAdminAdministratorOrder(orderBy:string[]): string {
    if(orderBy && orderBy.length>0) {
        const field = orderBy[0] ?? "id"
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "id DESC"
}

export async function addAdministrator(admin: DBAdminUser): Promise<DBAdminUser[] | null> {
    const adminInsertSQL = `INSERT INTO 
        administrator(name, email, username, password, created_admin_id, status, is_super) 
        VALUES(?, ?, ?, MD5(?), ?, ?, ?)`
    const [resultAdminInsert, afields] = await pool.execute(adminInsertSQL, 
        [admin.name, admin.email, admin.username, admin.password, 2, admin.status, admin.is_super]) as [OkPacket, FieldPacket[]];
    console.log('REPO addAdministrator: inserted ', resultAdminInsert, afields)
    const insertedAdminId = resultAdminInsert.insertId
    if (!insertedAdminId) {
        console.error("(ERROR)REPO addAdministrator: empty inserted admin id", admin, afields)
        return null
    }
    return getAdministratorsByIds([insertedAdminId.toString()])
}

export async function saveAdministrator(id: string, admin: DBAdminUser): Promise<DBAdminUser[] | null> {
    const adminUpdateSQL = `UPDATE administrator SET name=?, email=?, username=?, password=MD5(?), status=?, is_super=? WHERE id=?`
    const [resultAdminUpdate, afields] = await pool.execute(adminUpdateSQL, [
        admin.name, admin.email, admin.username, admin.password, admin.status, admin.is_super, id
    ]);
    console.log('REPO saveAdministrator: updated ', resultAdminUpdate, afields)

    return [admin]
}

export async function deleteAdministrator(id: string): Promise<DBAdminUser[] | null> {
    const admins = await getAdministratorsByIds([id])
    if(admins === null) {
        console.error('(ERROR)REPO deleteAdministrator: admin not found ', id)
        return null
    }
    const admin: DBAdminUser = admins[0]

    const adminDeleteSQL = `DELETE FROM administrator WHERE id=?`
    const [resultAdminDelete] = await pool.execute(adminDeleteSQL, [admin.id]);
    console.log('REPO deleteAdministrator: deleted', resultAdminDelete)

    return [admin]
}