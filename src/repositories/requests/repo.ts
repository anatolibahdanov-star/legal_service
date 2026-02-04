import {User} from "next-auth"
import pool from '@/src/libs/db';
import { RowDataPacket } from 'mysql2/promise';
import { DateTime } from "next-auth/providers/kakao";

export interface DBQuestions extends RowDataPacket, User {
  id: string;
  username: string;
  question: string;
  reply: string;
  reply_id: string;
  final_reply: string | null;
  final_reply_id: string;
  status: number;
  created_at: DateTime;
}

interface CountResult extends RowDataPacket {
  counter: number; // The alias from the SQL query
}

export async function getQuestions(page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC']): Promise<DBQuestions[] | null> {
    const orderBy = getAdminQuestionOrder(_sorter);
    const sql: string =  `SELECT q.id as id, u.name as username, q.question as question,
    q.status as status, q.created_at as created_at
    FROM question q JOIN user u ON q.user_id=u.id
    ORDER BY ` + orderBy +
    ` LIMIT ?
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

export async function getQuestionsByIds(ids: string[]): Promise<DBQuestions[] | null> {
    const sql: string =  `SELECT q.id as id, u.name as username, q.question as question,
    q.status as status, q.created_at as created_at, r.reply as reply, fr.final_reply as final_reply,
    r.id as reply_id, fr.id as final_reply_id 
    FROM question q JOIN user u ON q.user_id=u.id 
    LEFT JOIN reply r ON q.id=r.question_id 
    LEFT JOIN final_reply fr ON r.id=fr.reply_id 
    WHERE q.id IN (?)`;
    console.log("getQuestionsByIds params", ids)
    const [rows] = await pool.query<DBQuestions[]>({sql: sql, values: [ids]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export function getAdminQuestionOrder(orderBy:string[]): string {
    console.log('orderBy ', orderBy)
    const tablesFields: { [key: string]: string } = {
        "id": "q.id",
        "username": "u.name",
        "question": "q.question",
        "reply": "r.reply",
        "final_reply": "fr.final_reply",
        "status": "q.status",
        "created_at": "q.created_at",
    }
    if(orderBy && orderBy.length>0) {
        const field = orderBy[0] in tablesFields ? tablesFields[orderBy[0]] : "q.id"
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "q.id DESC"
}

export async function saveQuestion(id: string, questionIn: DBQuestions): Promise<DBQuestions[] | null> {

    const questions = await getQuestionsByIds([id])
    if(questions === null) {
        console.error('UPDATED DATA question not found ', id)
        return null
    }
    const question = questions[0]

    let fr_status: number = 1
    let q_status: number = 2
    if(question.final_reply === null && questionIn.final_reply!==null) {
        fr_status = 2
        q_status = 4
    } else if(question.final_reply !== questionIn.final_reply) {
        fr_status = 3
        q_status = 4
    }
    const finalReplyUpdateSQL = `UPDATE final_reply SET final_reply=?, status=? WHERE id=?`
    const [resultFinalReplyUpdate, ufields] = await pool.execute(finalReplyUpdateSQL, 
        [questionIn.final_reply, fr_status, question.final_reply_id]);
    console.log('UPDATED DATA final reply ', resultFinalReplyUpdate, ufields)

    if(question.status !== questionIn.status) {
        q_status = questionIn.status
    }
    const questionUpdateSQL = `UPDATE question SET status=? WHERE id=?`
    const [resultQuestionUpdate, qfields] = await pool.execute(questionUpdateSQL, 
        [q_status, id]);
    console.log('UPDATED DATA question ', resultQuestionUpdate, qfields)
    question.status = q_status

    return [question]
}

export async function deleteQuestion(id: string): Promise<DBQuestions[] | null> {

    const questions = await getQuestionsByIds([id])
    if(questions === null) {
        console.error('DELETE REQUEST: request not found ', id)
        return null
    }
    const question: DBQuestions = questions[0]

    const questionDeleteSQL = `DELETE FROM question WHERE id=?`
    const [resultQuestionDelete] = await pool.execute(questionDeleteSQL, [question.id]);
    console.log('DELETE REQUEST ', resultQuestionDelete)

    return [question]
}