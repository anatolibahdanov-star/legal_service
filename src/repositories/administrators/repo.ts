import pool from '@/src/libs/db';
import { OkPacket, FieldPacket } from 'mysql2/promise';
import {CountResult, DBUser} from "@/src/interfaces/db"
import {DBFilterAdministrators} from "@/src/interfaces/filters"
import {md5} from "@/src/helpers/tools"

export async function getAdministrators(
    page: string = '1', 
    _limit: string = '10', 
    _sorter: string[] = ['id', 'DESC'],
    filter: DBFilterAdministrators | null = null
): Promise<DBUser[] | null> {
    const orderBy = getAdminAdministratorOrder(_sorter);
    const where = getAdminAdministratorFilter(filter)
    const sql: string =  `SELECT name, email, id, username, password, 
    IF(is_super=1, 'true', 'false') as is_super_bool, is_super, status, created_at 
    FROM administrator `
    + where +
    ` ORDER BY ` + orderBy +
    ` LIMIT ?
    OFFSET ?`;
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const [rows] = await pool.query<DBUser[]>({sql: sql, values: [limit, offset]});
    console.log('sql ', sql)
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getTotalAdministrators(filter: DBFilterAdministrators | null = null): Promise<number> {
    const where = getAdminAdministratorFilter(filter)
    const sql: string =  `SELECT COUNT(id) as counter FROM administrator ` + where;
    const [rows] = await pool.query<CountResult[]>({sql: sql});
    if (rows.length === 0) {
        return 0
    }
    const totalCount = rows[0].counter;
    return totalCount
}

export async function getAdministratorsByIds(ids: string[]): Promise<DBUser[] | null> {
    const sql: string =  `SELECT name, email, id, username, password, is_super, status, created_at 
    FROM administrator WHERE id IN (?)`;
    console.log("REPO getAdministratorsByIds: params", ids)
    const [rows] = await pool.query<DBUser[]>({sql: sql, values: [ids]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getAdministratorByEmail(email: string, password: string): Promise<DBUser | null | undefined> {
    const msg = 'REPO getAdministratorByEmail: '
    const sql: string =  `SELECT name, email, id, username, password, is_super, status, created_at 
    FROM administrator WHERE email=?`;
    console.log(msg + "params", email, password)
    const [rows] = await pool.query<DBUser[]>({sql: sql, values: [email]});
    if (rows.length === 0) {
        console.error(msg + 'User with email/password not found', email, password)
        return null
    }
    if (rows.length > 1) {
        console.error(msg + 'Double User found', email, password)
        return null
    }
    const user = rows[0]
    if(md5(password) !== user.password) {
        console.error(msg + 'Incorrect login/password', email, password, user)
        return undefined
    }
    console.log(msg + "Successfull login", user)
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
    if (filter.status) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'status=' + filter.status + ' ')
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

export async function saveAdministrator(id: string, admin: DBUser): Promise<DBUser[] | null> {
    const adminUpdateSQL = `UPDATE administrator SET name=?, email=?, username=?, password=MD5(?), status=?, is_super=? WHERE id=?`
    const [resultAdminUpdate, afields] = await pool.execute(adminUpdateSQL, [
        admin.name, admin.email, admin.username, admin.password, admin.status, admin.is_super, id
    ]);
    console.log('REPO saveAdministrator: updated ', resultAdminUpdate, afields)

    return [admin]
}

export async function deleteAdministrator(id: string): Promise<DBUser[] | null> {
    const admins = await getAdministratorsByIds([id])
    if(admins === null) {
        console.error('(ERROR)REPO deleteAdministrator: admin not found ', id)
        return null
    }
    const admin: DBUser = admins[0]

    const adminDeleteSQL = `DELETE FROM administrator WHERE id=?`
    const [resultAdminDelete] = await pool.execute(adminDeleteSQL, [admin.id]);
    console.log('REPO deleteAdministrator: deleted', resultAdminDelete)

    return [admin]
}