import logger from "@/src/libs/logger"
import {find, findOne, insert, queryTransactionWrapper, executeTransactionWrapper, update, remove} from '@/src/libs/db';
import { ResultSetHeader } from 'mysql2/promise';
import {addAnonymousUser, markFirstQuestionUsed} from "@/src/repositories/users/repo"
import { randomUUID } from 'node:crypto';
import {CountResult, DBQuestion, DBUser} from "@/src/interfaces/db"
import {DBFilterQuestions} from "@/src/interfaces/filters"
import {UserRatingRequest, UserRequest} from "@/src/interfaces/api"
import {getCategoryByName} from "@/src/repositories/categories/repo"
import { ReplyStatusesE, FinalReplyStatusesE, QuestionStatusesE, QuestionInfoStatusesE } from '@/src/interfaces/data';

const msgGlobal = "REPO QUESTION "

export async function getQuestions(
    page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC'], filter: DBFilterQuestions | null = null, isChild: boolean = false,
): Promise<DBQuestion[] | null> {
    const msg = msgGlobal + "getQuestions - "
    if(isChild === false) {
        if(filter) {
            filter.is_child = filter.is_child === undefined ? false : filter.is_child
        } else {
            filter = {is_child: false}
        }
    }
    const orderBy = getAdminQuestionOrder(_sorter);
    const where = getAdminQuestionFilter(filter)
    const query =  `SELECT q.*, u.name username, BIN_TO_UUID(q.uuid) uuid, u.email email,
    c.id category_id, c.name category_name, adi.name owner 
    FROM question q JOIN user u ON q.user_id=u.id  
    LEFT JOIN category c ON q.category_id=c.id 
    LEFT JOIN administrator adi ON q.admin_id=adi.id  `
     + where +
    ` ORDER BY ` + orderBy +
    ` LIMIT ?
    OFFSET ?`;
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const params = [limit, offset]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBQuestion>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getTotalQuestions(filter: DBFilterQuestions | null = null): Promise<number> {
    const msg = msgGlobal + "getTotalQuestions - ";
    const where = getAdminQuestionFilter(filter)
    const query = `SELECT COUNT(q.id) as counter FROM question q JOIN user u ON q.user_id=u.id AND q.parent_id IS NULL ` + where;
    const calcFunc = findOne({ query: query, values: [] });
    const executedQueries = await queryTransactionWrapper<CountResult>([calcFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return 0
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        return 0
    }
    return rows[0].counter;
}

export async function getQuestionsByIds(ids: string[], is_number: boolean = true): Promise<DBQuestion[] | null> {
    const msg = msgGlobal + "getQuestionsByIds - ";
    let query =  `SELECT q.*, u.name username, r.reply reply, IF(fr.final_reply = '', r.reply, fr.final_reply) final_reply,
    r.id reply_id, fr.id final_reply_id, r.status reply_status, BIN_TO_UUID(q.uuid) uuid, ad.name lawyer,
    u.email as email, c.id category_id, c.name category_name, fr.updated_at final_reply_date, adi.name owner
    FROM question q JOIN user u ON q.user_id=u.id
    LEFT JOIN administrator adi ON q.admin_id=adi.id 
    LEFT JOIN reply r ON q.id=r.question_id 
    LEFT JOIN final_reply fr ON r.id=fr.reply_id 
    LEFT JOIN administrator ad ON fr.admin_id=ad.id 
    LEFT JOIN category c ON q.category_id=c.id
    WHERE `;
    query += is_number ? 'q.id IN (?)' : 'q.uuid = UUID_TO_BIN(?)' 
    const params = [ids]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBQuestion>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getJobById(id: number): Promise<DBQuestion[] | null> {
    const msg = msgGlobal + "getJobById - ";
    const query =  `SELECT q.*, u.name username, r.reply reply, IF(fr.final_reply = '', r.reply, fr.final_reply) final_reply,
    r.id reply_id, fr.id final_reply_id, r.status reply_status, BIN_TO_UUID(q.uuid) uuid, ad.name lawyer,
    u.email as email, c.id category_id, c.name category_name, fr.updated_at final_reply_date, adi.name owner 
    FROM question q JOIN user u ON q.user_id=u.id 
    LEFT JOIN administrator adi ON q.admin_id=adi.id 
    LEFT JOIN reply r ON q.id=r.question_id 
    LEFT JOIN final_reply fr ON r.id=fr.reply_id 
    LEFT JOIN administrator ad ON fr.admin_id=ad.id 
    LEFT JOIN category c ON q.category_id=c.id
    WHERE q.id=? OR q.parent_id=? ORDER BY q.id ASC`;
    const params = [id, id]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBQuestion>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        return []
    }
    return rows
}

export function getAdminQuestionOrder(orderBy:string[]): string {
    const tablesFields: { [key: string]: string } = {
        "id": "q.id",
        "username": "u.name",
        "question": "q.question",
        "category": "c.name",
        "lawyer": "ad.name",
        "reply": "r.reply",
        "final_reply": "fr.final_reply",
        "status": "q.status",
        "created_at": "q.created_at",
        "updated_at": "q.updated_at",
    }
    if(orderBy && orderBy.length>0) {
        const field = orderBy[0] in tablesFields ? tablesFields[orderBy[0]] : "q.id"
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "q.id DESC"
}

export function getAdminQuestionFilter(filter: DBFilterQuestions | null = null): string {
    if(filter === null) {
        return ''
    }
    let result = 'WHERE ', isFilter = false;
    if (filter.published_at_lte) {
        result += 'q.created_at<="' + filter.published_at_lte + '" '
        isFilter = true
    }
    if (filter.published_at_gte) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'q.created_at>="' + filter.published_at_gte + '" ')
        isFilter = true
    }
    if (filter.username) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'u.name LIKE "%' + filter.username + '%" ')
        isFilter = true
    }
    if (filter.email) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'u.email LIKE "%' + filter.email + '%" ')
        isFilter = true
    }
    if (filter.user_id) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'q.user_id=' + filter.user_id + ' ')
        isFilter = true
    }
    if (filter.question) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'q.question LIKE "%' + filter.question + '%" ')
        isFilter = true
    }
    if (filter.category) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'q.category_id=' + filter.category + ' ')
        isFilter = true
    }
    if (!filter.is_child) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + ' q.parent_id IS NULL ')
        isFilter = true
    }
    if (filter.status || filter.status === 0) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'q.job_status=' + filter.status + ' ')
        isFilter = true
    }
    if (filter.is_rating) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'q.rating>0 ')
        isFilter = true
    }
    if (filter.email_status || filter.email_status === 0) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'q.email_status=' + filter.email_status + ' ')
        isFilter = true
    }
    if (filter.lost) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'q.info_status=0 AND q.job_status IN(' + QuestionStatusesE.InProgress + ', ' + QuestionStatusesE.New + ') AND DATE_ADD(q.created_at, INTERVAL ' + filter.lost + ' HOUR) <= NOW() ')
        isFilter = true
    }
    if (filter.admin_id) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'q.admin_id=' + filter.admin_id + ' ')
        isFilter = true
    }
    return isFilter ? result : ''
}

export async function addQuestion(question: DBQuestion): Promise<DBQuestion[] | null> {
    const msg = msgGlobal + "addQuestion - ";
    const myUuid: string = randomUUID();
    const query = `INSERT INTO question(name, email, uuid) VALUES(?, ?, UUID_TO_BIN(?))`;
    const params = [question.name, question.email, myUuid];
    const insertFunc = insert({ query, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [resultInsert] = executedQueries;
    const insertedId = resultInsert[0]?.insertId
    if (!insertedId) {
        logger.error(msg + "Empty inserted id", resultInsert[0])
        return null
    }

    return getQuestionsByIds([insertedId.toString()])
}

/**
 * Inserts a root question for an already-authenticated user.
 * Unlike addClientQuestion this does NOT touch the user table
 * (caller is the wizard, user already exists from OTP/complete-profile).
 *
 * Caller picks the initial status (e.g. Unpaid on Step 3 of the wizard,
 * which is later flipped to InProgress on Step 5 once payment succeeds).
 *
 * Both `status` and `job_status` columns are written: the legacy `status`
 * is what admin queries sort/filter by, `job_status` is what the
 * personal-cabinet UI displays. Keeping them in sync prevents the user
 * from seeing a stale "В ожидании" badge on a freshly created Unpaid
 * question.
 *
 * Бенефит «первый вопрос бесплатно» здесь НЕ сжигается — черновик Unpaid
 * ещё не финализирован. Флаг сбрасывается только когда вопрос реально
 * уходит в InProgress по free-пути (см. /api/wizard/submit-question).
 * Иначе клиент, получивший `isFirstQuestionFree=true` до создания черновика,
 * будет получать 403 not_entitled на submit-question.
 */
export async function addWizardQuestion(
    userId: string | number,
    questionText: string,
    status: QuestionStatusesE,
): Promise<DBQuestion | null> {
    const msg = msgGlobal + "addWizardQuestion - ";
    const myUuid: string = randomUUID();
    const sql = `INSERT INTO question(user_id, question, status, job_status, uuid, parent_id) VALUES(?, ?, ?, ?, UUID_TO_BIN(?), NULL)`;
    const values = [userId, questionText, status, status, myUuid];
    const insertFunc = insert({ query: sql, values });
    const executed = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL failed', sql);
        return null;
    }
    const [resultInsert] = executed;
    const insertedId = resultInsert[0]?.insertId;
    if (!insertedId) {
        logger.error(msg + 'no inserted id');
        return null;
    }
    const rows = await getQuestionsByIds([insertedId.toString()]);
    return rows && rows.length > 0 ? rows[0] : null;
}

/**
 * Updates `status` + `job_status` of an existing question, optionally
 * scoped to a specific user_id so a malicious client can't flip statuses
 * on someone else's question.
 *
 * Returns the updated row on success, or null if no row matched
 * (wrong id / wrong owner / question doesn't exist).
 */
export async function updateWizardQuestionStatus(
    id: string | number,
    nextStatus: QuestionStatusesE,
    ownerUserId?: string | number,
): Promise<DBQuestion | null> {
    const msg = msgGlobal + "updateWizardQuestionStatus - ";
    let sql = `UPDATE question SET status=?, job_status=?, updated_at=NOW() WHERE id=?`;
    const params: Array<string | number> = [nextStatus, nextStatus, id];
    if (ownerUserId !== undefined) {
        sql += ` AND user_id=?`;
        params.push(ownerUserId);
    }
    const updateFunc = update({ query: sql, values: params });
    const executed = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL failed', sql);
        return null;
    }
    const [result] = executed;
    const affected = result[0]?.affectedRows ?? 0;
    if (affected === 0) {
        logger.warn(msg + 'no rows updated', { id, ownerUserId, nextStatus });
        return null;
    }
    const rows = await getQuestionsByIds([id.toString()]);
    return rows && rows.length > 0 ? rows[0] : null;
}

/**
 * Updates ONLY the question text of an existing wizard question.
 * Restricted to Unpaid rows owned by the caller — once a question is
 * Paid/InProgress the text becomes immutable from the wizard's POV.
 *
 * Used to keep the DB row in sync when the user navigates back to
 * Step 1 inside the same wizard session and edits the text.
 */
export async function updateWizardQuestionText(
    id: string | number,
    text: string,
    ownerUserId: string | number,
): Promise<DBQuestion | null> {
    const msg = msgGlobal + "updateWizardQuestionText - ";
    const sql = `UPDATE question SET question=?, updated_at=NOW() WHERE id=? AND user_id=? AND status=?`;
    const params = [text, id, ownerUserId, QuestionStatusesE.Unpaid];
    const updateFunc = update({ query: sql, values: params });
    const executed = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL failed', sql);
        return null;
    }
    const [result] = executed;
    const affected = result[0]?.affectedRows ?? 0;
    if (affected === 0) {
        logger.warn(msg + 'no rows updated (not found / wrong owner / not Unpaid)', { id, ownerUserId });
        return null;
    }
    const rows = await getQuestionsByIds([id.toString()]);
    return rows && rows.length > 0 ? rows[0] : null;
}

/**
 * Fetches a single question by id, optionally restricted to a specific
 * owner. Returns null if not found or owner mismatch. Used by the
 * wizard's pay/finalize endpoints to verify ownership before mutating.
 */
export async function getWizardQuestionById(
    id: string | number,
    ownerUserId?: string | number,
): Promise<DBQuestion | null> {
    const rows = await getQuestionsByIds([id.toString()]);
    if (!rows || rows.length === 0) return null;
    const q = rows[0];
    if (ownerUserId !== undefined && q.user_id?.toString() !== ownerUserId.toString()) {
        return null;
    }
    return q;
}

export async function addClientQuestion(data: UserRequest): Promise<DBQuestion | null> {
    const msg = msgGlobal + "addClientQuestion - ";
    const _user = {id: '', name: data.name, email: data.email} as DBUser
    const user = await addAnonymousUser(_user)
    if(user === null) {
        logger.error(msg + "Can not create user", _user)
        return null
    }
    const categories = await getCategoryByName(data.topic)
    let categoryId = null
    if(categories !== null && categories.length > 0 ) {
        categoryId = categories[0].id
    }
    
    const myUuid: string = randomUUID();
    const parent = data.parent && data.parent !== 0 ? data.parent : null
    const questionInsertSQL = `INSERT INTO question(user_id, question, status, uuid, category_id, parent_id) VALUES(?, ?, ?, UUID_TO_BIN(?), ?, ?)`
    const insertedData = [user.id, data.question, QuestionStatusesE.New, myUuid, categoryId, parent, ]

    const insertFunc = insert({ query: questionInsertSQL, values: insertedData});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", questionInsertSQL)
        return null
    }
    const [resultInsert] = executedQueries;
    const insertedQuestionId = resultInsert[0]?.insertId
    if (!insertedQuestionId) {
        logger.error(msg + "Empty inserted id", resultInsert[0])
        return null
    }

    // Consume the "first question free" benefit on any root question insert.
    // markFirstQuestionUsed is a no-op when the flag is already 0.
    if (!parent) {
        await markFirstQuestionUsed(user.id);
    }

    if(parent) {
        const questionUpdateSQL = `UPDATE question SET job_status=?, updated_at=NOW() WHERE id=?`
        const questionUpdateData = [QuestionStatusesE.InProgress, parent]

        const updateFunc = update({ query: questionUpdateSQL, values: questionUpdateData});
        const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
        if (!executedQueries) {
            logger.error(msg + "SQL not results from execution", questionUpdateSQL)
            return null
        }
        const [result] = executedQueries;
        const updated = result[0]?.affectedRows
        if (updated > 0) {
            logger.info(msg + 'updated', result)
        } else { 
            logger.warn(msg + "No updates", result[0])
        }
    }


    const reply_status = data.llm !== '' ? ReplyStatusesE.Auto : ReplyStatusesE.New 

    const replyInsertSQL = `INSERT INTO reply(question_id, reply, status) VALUES(?, ?, ?)`
    const replyInsertData = [insertedQuestionId, data.llm, reply_status]
    const insertFunc2 = insert({ query: replyInsertSQL, values: replyInsertData});
    const executedQueries2 = await executeTransactionWrapper<ResultSetHeader>([insertFunc2], msg);
    if (!executedQueries2) {
        logger.error(msg + "SQL not results from execution", replyInsertSQL)
        return null
    }
    const [resultInsert2] = executedQueries2;
    const insertedReplyId = resultInsert2[0]?.insertId
    if (!insertedReplyId) {
        logger.error(msg + "Empty inserted id", resultInsert2[0])
        return null
    }

    const finalReplyInsertSQL = `INSERT INTO final_reply(reply_id, final_reply, status) VALUES(?, ?, ?)`
    const FRData = [insertedReplyId, '', FinalReplyStatusesE.New]

    const insertFunc3 = insert({ query: finalReplyInsertSQL, values: FRData});
    const executedQueries3 = await executeTransactionWrapper<ResultSetHeader>([insertFunc3], msg);
    if (!executedQueries3) {
        logger.error(msg + "SQL not results from execution", finalReplyInsertSQL)
        return null
    }
    const [resultInsert3] = executedQueries3;
    const insertedFinalReplyId = resultInsert3[0]?.insertId
    if (!insertedFinalReplyId) {
        logger.error(msg + "Empty inserted id", resultInsert3[0])
        return null
    }

    const resQuestions = await getQuestionsByIds([insertedQuestionId.toString()])
    if(resQuestions === null) {
        logger.warn(msg + "Can't get new question from DB", resQuestions, insertedQuestionId.toString())
        return null
    }
    return resQuestions[0]
}

export async function addLLMReply(id: string, llm: string, duration: number): Promise<DBQuestion[] | null> {
    const msg = msgGlobal + "addLLMReply - ";
    const replyUpdateSQL = `UPDATE reply SET reply=?, status=?, duration=?, updated_at=NOW() WHERE question_id=?`;
    const params = [llm, ReplyStatusesE.Auto, duration, id]

    const updateFunc = update({ query: replyUpdateSQL, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", replyUpdateSQL)
        return null
    }
    const [result] = executedQueries;
    const updated = result[0]?.affectedRows
    if (updated > 0) {
        logger.info(msg + 'updated', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }

    return getQuestionsByIds([id])
}

export async function updateEmailStatus(id: string, email_status: number): Promise<DBQuestion[] | null> {
    const msg = msgGlobal + "updateEmailStatus - ";
    const query = `UPDATE question SET email_status=?, updated_at=NOW() WHERE id=?`;
    const params = [email_status, id]
    const updateFunc = update({ query, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [result] = executedQueries;
    const updated = result[0]?.affectedRows
    if (updated > 0) {
        logger.info(msg + 'updated', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }
    
    return getQuestionsByIds([id])
}

export async function saveQuestion(id: string, questionIn: DBQuestion, adminId: string|null = null): Promise<DBQuestion | null> {
    const msg = "REPO saveQuestion - "
    if(adminId === null) {
        logger.error(msg + 'UPDATED DATA admin not found', adminId)
        return null
    }

    if(!questionIn.child_id) {
        logger.error(msg + 'UPDATED DATA child ID not found', questionIn.child_id)
        return null
    }

    const questions = await getQuestionsByIds([id])
    if(questions === null) {
        logger.error(msg + 'Question not found', id)
        return null
    }
    const question = questions[0]

    const updateStatus = {isReply: false, isFinalReply: false, isSubQuestion: false,}

    if(questionIn.reply && question.reply !== questionIn.reply) {
        const replyUpdateSQL = `UPDATE reply SET reply=?, status=?, updated_at=NOW() WHERE id=?`;
        const replyUpdateData = [questionIn.reply, ReplyStatusesE.Filled, questionIn.reply_id]
        const updateFunc = update({ query: replyUpdateSQL, values: replyUpdateData});
        const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
        if (!executedQueries) {
            logger.error(msg + "SQL not results from execution", replyUpdateSQL)
            return null
        }
        const [result] = executedQueries;
        const updated = result[0]?.affectedRows
        if (updated > 0) {
            logger.info(msg + 'updated', result)
        } else { 
            logger.warn(msg + "No updates", result[0])
        }
        updateStatus.isReply = true
    }

    if(questionIn.final_reply && question.final_reply !== questionIn.final_reply) {
        const finalReplyUpdateSQL = `UPDATE final_reply SET final_reply=?, status=?, admin_id=?, updated_at=NOW() WHERE id=?`;
        const finalReplyUpdateData = [questionIn.final_reply, FinalReplyStatusesE.Filled, adminId, questionIn.final_reply_id];
        const updateFunc = update({ query: finalReplyUpdateSQL, values: finalReplyUpdateData});
        const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
        if (!executedQueries) {
            logger.error(msg + "SQL not results from execution", finalReplyUpdateSQL)
            return null
        }
        const [result] = executedQueries;
        const updated = result[0]?.affectedRows
        if (updated > 0) {
            logger.info(msg + 'updated', result)
        } else { 
            logger.warn(msg + "No updates", result[0])
        }
        updateStatus.isFinalReply = true
    }

    if(parseInt(question.id) !== questionIn.child_id) {
        const subQuestions = await getQuestionsByIds([questionIn.child_id.toString()])
        if(subQuestions === null) {
            logger.error(msg + 'Question not found', questionIn.child_id)
            return null
        }
        const subQuestion = subQuestions[0]
        if(subQuestion.status !== questionIn.job_status) {
            let questionUpdateSQL = `UPDATE question SET status=?, updated_at=NOW() `
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const questionUpdateData: Array<any> = [questionIn.job_status,]
            if(subQuestion.admin_id === null) {
                questionUpdateSQL += ', admin_id=? '
                questionUpdateData.push(adminId)
            }
            questionUpdateSQL += ' WHERE id=? OR (parent_id=? AND status IN(?,?))'
            questionUpdateData.push(questionIn.child_id, id, QuestionStatusesE.New, QuestionStatusesE.InProgress)

            const updateFunc = update({ query: questionUpdateSQL, values: questionUpdateData});
            const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
            if (!executedQueries) {
                logger.error(msg + "SQL not results from execution", questionUpdateSQL)
                return null
            }
            const [result] = executedQueries;
            const updated = result[0]?.affectedRows
            if (updated > 0) {
                logger.info(msg + 'updated', result)
            } else { 
                logger.warn(msg + "No updates", result[0])
            }
            updateStatus.isSubQuestion = true
        }
    }

    let currentStatus = question.job_status
    if(currentStatus !== questionIn.job_status) {
        currentStatus = questionIn.job_status
        let questionUpdateSQL = `UPDATE question SET job_status=?, updated_at=NOW() `
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const questionUpdateData: Array<any> = [currentStatus,]
        if(question.admin_id === null) {
            questionUpdateSQL += ', admin_id=? '
            questionUpdateData.push(adminId)
        }
        questionUpdateSQL += ' WHERE id=?'
        questionUpdateData.push(id)
        const updateFunc = update({ query: questionUpdateSQL, values: questionUpdateData});
        const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
        if (!executedQueries) {
            logger.error(msg + "SQL not results from execution", questionUpdateSQL)
            return null
        }
        const [result] = executedQueries;
        const updated = result[0]?.affectedRows
        if (updated > 0) {
            logger.info(msg + 'updated', result)
        } else { 
            logger.warn(msg + "No updates", result[0])
        }
    }
    
    question.status = currentStatus

    return question
}

export async function saveQuestionRating(id: string, ratingInfo: UserRatingRequest): Promise<DBQuestion | null> {
    const msg = msgGlobal + "saveQuestionRating - ";
    const questions = await getQuestionsByIds([id])
    if(questions === null) {
        logger.error(msg + 'Question not found ', id)
        return null
    }

    const questionUpdateSQL = `UPDATE question SET rating=?, comment=?, rating_date=NOW(), updated_at=NOW() WHERE id=?`
    const ratingData = [ratingInfo.rating, ratingInfo.comment, id]

    const updateFunc = update({ query: questionUpdateSQL, values: ratingData});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", questionUpdateSQL)
        return null
    }
    const [result] = executedQueries;
    const updated = result[0]?.affectedRows
    if (updated > 0) {
        logger.info(msg + 'updated', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }
    
    const _questions = await getQuestionsByIds([id])
    if(_questions === null) {
        logger.error(msg + 'Question not found new', id)
        return null
    }
    return _questions[0]
}

export async function deleteQuestion(id: string): Promise<DBQuestion[] | null> {
    const msg = msgGlobal + "deleteQuestion - ";
    const questions = await getQuestionsByIds([id])
    if(questions === null) {
        logger.error(msg + 'Question not found ', id)
        return null
    }
    const question: DBQuestion = questions[0]

    const questionDeleteSQL = `DELETE FROM question WHERE id=?`;
    const params = [question.id];
    const deleteFunc = remove({ query: questionDeleteSQL, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([deleteFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", questionDeleteSQL)
        return null
    }
    const [result] = executedQueries;
    const deleted = result[0]?.affectedRows
    if (deleted > 0) {
        logger.info(msg + 'deleted', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }
    return [question]
}

export async function updateInfoStatus(id: string, info_status: QuestionInfoStatusesE): Promise<DBQuestion[] | null> {
    const msg = msgGlobal + "updateInfoStatus - ";
    const query = `UPDATE question SET info_status=?, updated_at=NOW() WHERE id=? OR parent_id=?`
    const params = [info_status, id, id]
    const updateFunc = update({ query, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [result] = executedQueries;
    const updated = result[0]?.affectedRows
    if (updated > 0) {
        logger.info(msg + 'updated', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }
    return getQuestionsByIds([id])
}
