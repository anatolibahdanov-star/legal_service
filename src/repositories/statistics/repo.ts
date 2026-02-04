import {User} from "next-auth"
import pool from '@/src/libs/db';
import { RowDataPacket } from 'mysql2/promise';
import { DateTime } from "next-auth/providers/kakao";

export interface DBStatistic extends RowDataPacket, User {
  id: string;
  st_date: DateTime;
  avg_llm_time: number;
  avg_manager_time: number;
  avg_request_time: number;
}

interface CountResult extends RowDataPacket {
  counter: number; // The alias from the SQL query
}

export async function getStatistics(page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC']): Promise<DBStatistic[] | null> {
    const orderBy = getStatisticOrder(_sorter);
    const sql: string =  `SELECT *  
    FROM statistic 
    ORDER BY ` + orderBy +
    ` LIMIT ?
    OFFSET ?`;
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const [rows] = await pool.query<DBStatistic[]>({sql: sql, values: [limit, offset]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getTotalStatistics(): Promise<number> {
    const sql: string =  `SELECT COUNT(id) as counter FROM statistic`;
    const [rows] = await pool.query<CountResult[]>({sql: sql});
    console.log('STATISTICS sql counter ', rows)
    if (rows.length === 0) {
        return 0
    }
    const totalCount = rows[0].counter;
    return totalCount
}

export function getStatisticOrder(orderBy:string[]): string {
    console.log('STATISTICS orderBy ', orderBy)
    if(orderBy && orderBy.length>0) {
        const field = orderBy[0] ?? "id"
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "id DESC"
}