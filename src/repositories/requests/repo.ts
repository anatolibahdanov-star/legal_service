import {User} from "next-auth"
import pool from '@/src/libs/db';
import { OkPacket, RowDataPacket, FieldPacket } from 'mysql2/promise';
import { DateTime } from "next-auth/providers/kakao";
import {addUser, DBUser} from "@/src/repositories/users/repo"
import { randomUUID } from 'crypto';

export interface DBQuestions extends RowDataPacket, User {
  id: string;
  username: string;
  lawyer?: string;
  question: string;
  reply: string;
  reply_id: string;
  final_reply: string | null;
  final_reply_id: string;
  status: number;
  reply_status: number;
  created_at: DateTime;
}

export interface UserRequest {
    name: string;
    email: string;
    topic: string;
    question: string;
    uuid: string;
    llm?: string;
    chat?: boolean;
}

interface CountResult extends RowDataPacket {
  counter: number; // The alias from the SQL query
}

export async function getQuestions(page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC']): Promise<DBQuestions[] | null> {
    const orderBy = getAdminQuestionOrder(_sorter);
    const sql: string =  `SELECT q.id as id, u.name as username, q.question as question,
    q.status as status, q.created_at as created_at, BIN_TO_UUID(q.uuid) as uuid 
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

export async function getQuestionsByIds(ids: string[], is_number: boolean = true): Promise<DBQuestions[] | null> {
    let sql: string =  `SELECT q.id as id, u.name as username, q.question as question,
    q.status as status, q.created_at as created_at, r.reply as reply, IF(fr.final_reply = '', r.reply, fr.final_reply) as final_reply,
    r.id as reply_id, fr.id as final_reply_id, r.status as reply_status, BIN_TO_UUID(q.uuid) as uuid, u2.name as lawyer 
    FROM question q JOIN user u ON q.user_id=u.id 
    LEFT JOIN reply r ON q.id=r.question_id 
    LEFT JOIN final_reply fr ON r.id=fr.reply_id 
    LEFT JOIN administrator ad ON fr.admin_id=ad.id 
    LEFT JOIN user u2 ON ad.user_id=u2.id
    WHERE `;

    try {
        sql += is_number ? 'q.id IN (?)' : 'q.uuid = UUID_TO_BIN(?)' 
        console.log("getQuestionsByIds params", ids, sql)
        const [rows] = await pool.query<DBQuestions[]>({sql: sql, values: [ids]});
        if (rows.length === 0) {
            return []
        }
        return rows
    } catch(error) {
        console.error("REPO QUESTIONS Exception(getQuestionsByIds): ", (error as Error).message, sql)
    }
    
    return []
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

export async function addQuestion(question: DBQuestions): Promise<DBQuestions[] | null> {

    const myUuid: string = randomUUID();
    const userInsertSQL = `INSERT INTO question(name, email, uuid) VALUES(?, ?, UUID_TO_BIN(?))`
    const [resultUserInsert, ufields] = await pool.execute(userInsertSQL, [question.name, question.email, myUuid]) as [OkPacket, FieldPacket[]];
    console.log('inserted data ', resultUserInsert, ufields)
    const insertedUserId = resultUserInsert?.insertId
    if (!insertedUserId) {
        console.log("ADMIN repo INSERT User: empty inserted user id", question, ufields)
        return null
    }

    const adminInsertSQL = `INSERT INTO administrator(username, password, created_admin_id, user_id, status, is_super) VALUES(?, MD5(?), ?, ?, ?, ?)`
    const [resultAdminInsert, afields] = await pool.execute(adminInsertSQL, 
        [question.username, question.password, 2, insertedUserId, question.status, question.is_super]) as [OkPacket, FieldPacket[]];
    console.log('inserted data2 ', resultAdminInsert, afields)
    const insertedAdminId = resultAdminInsert.insertId
    if (!insertedAdminId) {
        console.log("ADMIN repo INSERT Admin: empty inserted admin id", question, afields)
        return null
    }
    return getQuestionsByIds([insertedAdminId.toString()])
}

export async function addClientQuestion(data: UserRequest): Promise<DBQuestions[] | null> {
    const _user: DBUser = {
        id: '',
        name: data.name,
        email: data.email
    } as DBUser
    const users = await addUser(_user)
    if(users === null) {
        console.error("CLIENT ADD QUESTION: can not create user", _user)
        return null
    }
    const user = users[0]

    const myUuid: string = randomUUID();
    const questionInsertSQL = `INSERT INTO question(user_id, question, status, uuid) VALUES(?, ?, ?, UUID_TO_BIN(?))`
    const [resultQuestionInsert, ufields] = await pool.execute(questionInsertSQL, [user.id, data.question, 1, myUuid]) as [OkPacket, FieldPacket[]];
    console.log('CLIENT ADD QUESTION inserted data ', resultQuestionInsert, ufields)
    const insertedQuestionId = resultQuestionInsert?.insertId
    if (!insertedQuestionId) {
        console.log("CLIENT ADD QUESTION: empty inserted question id", data, ufields)
        return null
    }

    const reply_status = data.llm !== '' ? 1 : 0 

    const replyInsertSQL = `INSERT INTO reply(question_id, reply, status) VALUES(?, ?, ?)`
    const [resultReplyInsert, rfields] = await pool.execute(replyInsertSQL, [insertedQuestionId, data.llm, reply_status]) as [OkPacket, FieldPacket[]];
    console.log('CLIENT ADD REPLY inserted data ', resultReplyInsert, rfields)
    const insertedReplyId = resultReplyInsert?.insertId
    if (!insertedReplyId) {
        console.log("CLIENT ADD REPLY: empty inserted reply id", data, rfields)
        return null
    }

    const finalReplyInsertSQL = `INSERT INTO final_reply(reply_id, admin_id, final_reply, status) VALUES(?, ?, ?, ?)`
    const [resultFinalReplyInsert, frfields] = await pool.execute(finalReplyInsertSQL, [insertedReplyId, 2, '', 0]) as [OkPacket, FieldPacket[]];
    console.log('CLIENT ADD FINAL REPLY inserted data ', resultFinalReplyInsert, frfields)
    const insertedFinalReplyId = resultFinalReplyInsert?.insertId
    if (!insertedFinalReplyId) {
        console.log("CLIENT ADD FINAL REPLY: empty inserted final reply id", data, frfields)
        return null
    }
    return getQuestionsByIds([insertedQuestionId.toString()])
}

export async function addLLMReply(id: string, llm: string): Promise<DBQuestions[] | null> {
    const replyUpdateSQL = `UPDATE reply SET reply=?, status=? WHERE question_id=?`
    const [resultReplyUpdate, ufields] = await pool.execute(replyUpdateSQL, 
        [llm, 1, id]);
    console.log('UPDATED DATA reply ', resultReplyUpdate, ufields)
    return getQuestionsByIds([id])
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