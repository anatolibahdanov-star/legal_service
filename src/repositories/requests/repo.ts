import {User} from "next-auth"
import pool from '@/src/libs/db';
import { RowDataPacket } from 'mysql2/promise';
import { DateTime } from "next-auth/providers/kakao";

export interface DBQuestions extends RowDataPacket, User {
  id: string;
  username: string;
  question: string;
  status: number;
  created_at: DateTime;
}

interface CountResult extends RowDataPacket {
  counter: number; // The alias from the SQL query
}

export async function getQuestions(page: string = '1', _limit: string = '10'): Promise<DBQuestions[] | null> {
    const sql: string =  `SELECT q.id as id, u.name as username, q.question as question,
    q.status as status, q.created_at as created_at
    FROM question q JOIN user u ON q.user_id=u.id
    ORDER BY q.id DESC
    LIMIT ?
    OFFSET ?`;
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    console.log('sql ', sql)
    const [rows] = await pool.query<DBQuestions[]>({sql: sql, values: [limit, offset]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getTotalQuestions(): Promise<number> {
    const sql: string =  `SELECT COUNT(q.id) as counter
    FROM question q JOIN user u ON q.user_id=u.id`;
    const [rows] = await pool.query<CountResult[]>({sql: sql});
    console.log('sql counter ', rows)
    if (rows.length === 0) {
        return 0
    }
    const totalCount = rows[0].counter;
    return totalCount
}