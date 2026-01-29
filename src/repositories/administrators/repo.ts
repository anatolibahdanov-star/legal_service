import {User} from "next-auth"
import pool from '@/src/libs/db';
import { RowDataPacket } from 'mysql2/promise';

export interface DBAdminUser extends RowDataPacket, User {
  id: string;
  name: string;
  email: string;
  password: string;
  admin_id: number;
  username: string;
  is_super: boolean;
  status: number;
}

export async function getAdministrators(page: string = '1', _limit: string = '10'): Promise<DBAdminUser[] | null> {
    const sql: string =  `SELECT u.id as id, u.name as name, u.email as email, ad.id as admin_id, ad.username as username, 
    ad.password as password, ad.is_super as is_super, ad.status as status 
    FROM user u JOIN administrator ad ON u.id=ad.user_id
    ORDER BY ad.id DESC
    LIMIT ?
    OFFSET ?`;
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const [rows] = await pool.query<DBAdminUser[]>({sql: sql, values: [limit, offset]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getAdministratorsByIds(ids: string[]): Promise<DBAdminUser[] | null> {
    const sql: string =  `SELECT u.id as id, u.name as name, u.email as email, ad.id as admin_id, ad.username as username, 
    ad.password as password, ad.is_super as is_super, ad.status as status 
    FROM user u JOIN administrator ad ON u.id=ad.user_id
    WHERE ad.id IN (?)`;
    const [rows] = await pool.query<DBAdminUser[]>({sql: sql, values: ids.join(",")});
    if (rows.length === 0) {
        return []
    }
    return rows
}