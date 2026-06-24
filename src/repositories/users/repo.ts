import {find, findOne, insert, queryTransactionWrapper, executeTransactionWrapper, update, remove} from '@/src/libs/db';
import { ResultSetHeader } from 'mysql2/promise';
import logger from "@/src/libs/logger"
import {CountResult, DBUser} from "@/src/interfaces/db"
import {DBFilterUsers} from "@/src/interfaces/filters"
import {OrderStatusE} from "@/src/interfaces/payment"
import {RegUser} from "@/src/interfaces/api"
import {md5, passGenerator} from "@/src/helpers/tools"
import {isPhoneEmail, phoneToEmail} from "@/src/libs/phoneIdentity"
import {randomBytes} from "node:crypto"

const msgGlobal = "REPO USER "

const paidQuestionsSubquery = `(SELECT COUNT(*) FROM porder po WHERE po.user_id = u.id AND po.status = ${OrderStatusE.Paid} AND po.question_id IS NOT NULL)`

export async function getUsers(
    page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC'], filter: DBFilterUsers | null = null
): Promise<DBUser[] | null> {
    const msg = msgGlobal + "getUsers - "
    const orderBy = getAdminUserOrder(_sorter);
    const where = getAdminUserFilter(filter);
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const query =  `SELECT u.*, u.balance AS balance_kop, ROUND(u.balance / 100, 0) balance, ${paidQuestionsSubquery} paid_questions FROM user u `+ where +` ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`;
    const params = [limit, offset]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBUser>([findFunc], msg);
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

export async function getTotalUsers(filter: DBFilterUsers | null = null): Promise<number> {
    const msg = msgGlobal + "getTotalUsers - ";
    const where = getAdminUserFilter(filter)
    const query =  `SELECT COUNT(id) as counter FROM user ` + where;
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

export async function getUsersByIds(ids: string[]): Promise<DBUser | null> {
    const msg = msgGlobal + "getUsersByIds - ";
    const query =  `SELECT u.*, u.balance AS balance_kop, ROUND(u.balance / 100, 0) balance, ${paidQuestionsSubquery} paid_questions FROM user u WHERE u.id IN (?)`;
    const params = [ids]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBUser>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        return null
    }
    return rows[0]
}

export async function getUserByEmail(email: string): Promise<DBUser | null> {
    const msg = msgGlobal + "getUserByEmail - ";
    const query =  `SELECT *, ROUND(balance / 100, 0) balance FROM user WHERE email=?`;
    const params = [email]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBUser>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        return null
    }
    return rows[0]
}

export async function getUserByPhone(phone: string): Promise<DBUser | null> {
    const msg = msgGlobal + "getUserByPhone - ";
    const query =  `SELECT *, ROUND(balance / 100, 0) balance FROM user WHERE phone=?`;
    const params = [phone]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBUser>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        return null
    }
    return rows[0]
}

const userSortColumns: Record<string, string> = {
    id: 'u.id',
    name: 'u.name',
    email: 'u.email',
    created_at: 'u.created_at',
    status: 'u.status',
    is_register: 'u.is_register',
    balance: 'u.balance',
    paid_questions: 'paid_questions',
}

export function getAdminUserOrder(orderBy:string[]): string {
    if(orderBy && orderBy.length>0) {
        const field = userSortColumns[orderBy[0]] ?? userSortColumns.id
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "u.id DESC"
}

function escapeLike(value: string): string {
    return value.replace(/[\\"]/g, '\\$&')
}

export function getAdminUserFilter(filter: DBFilterUsers | null = null): string {
    if(filter === null) {
        return ''
    }
    let result = 'WHERE ', isFilter = false;
    if (filter.published_at_lte) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'created_at<="' + filter.published_at_lte + '" ')
        isFilter = true
    }
    if (filter.published_at_gte) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'created_at>="' + filter.published_at_gte + '" ')
        isFilter = true
    }
    if (filter.name) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'name LIKE "%' + escapeLike(filter.name) + '%" ')
        isFilter = true
    }
    if (filter.email) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'email LIKE "%' + escapeLike(filter.email) + '%" ')
        isFilter = true
    }
    if (filter.q) {
        const q = escapeLike(filter.q.trim())
        if (q.length > 0) {
            const resultAnd = isFilter ? 'AND ' : ''
            result += (resultAnd + '(name LIKE "%' + q + '%" OR email LIKE "%' + q + '%" OR CAST(id AS CHAR) LIKE "%' + q + '%") ')
            isFilter = true
        }
    }
    if (filter.status || filter.status === 0) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'status=' + filter.status + ' ')
        isFilter = true
    }
    if (filter.is_register || filter.is_register === 0) {
        const resultAnd = isFilter ? 'AND ' : ''
        result += (resultAnd + 'is_register=' + filter.is_register + ' ')
        isFilter = true
    }
    return isFilter ? result : ''
}

export async function addAnonymousUser(user: DBUser): Promise<DBUser | null> {
    const msg = msgGlobal + "addAnonymousUser - ";
    const userByEmail = await getUserByEmail(user.email)
    if(userByEmail === null) {
        const query = `INSERT INTO user(name, email) VALUES(?, ?)`
        const params = [user.name, user.email];
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
        return await getUsersByIds([insertedId.toString()])
    }
    return userByEmail
}

/**
 * Creates a new user from the question wizard flow.
 * Unlike register() this is for users who haven't gone through the
 * formal registration form — they only have phone+name+email from the
 * wizard. We still set a random password so md5/login machinery doesn't
 * blow up, but the user can later use phone-OTP to sign in.
 *
 * Returns:
 *   - the created user on success
 *   - undefined if email or phone collide with an existing user
 *   - null on technical failure
 */
export async function createUserFromWizard(
    phone: string,
    name: string,
    email: string,
): Promise<DBUser | null | undefined> {
    const msg = msgGlobal + "createUserFromWizard - ";

    const byEmail = await getUserByEmail(email);
    if (byEmail) {
        logger.warn(msg + 'email collision', { email });
        return undefined;
    }
    const byPhone = await getUserByPhone(phone);
    if (byPhone) {
        logger.warn(msg + 'phone collision', { phone_tail: phone.slice(-4) });
        return undefined;
    }

    const randomPassword = `wizard_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    const query = `INSERT INTO user(name, email, phone, password, is_register, email_verified) VALUES(?, ?, ?, ?, 1, 0)`;
    const params = [name, email, phone, md5(randomPassword)];
    const insertFunc = insert({ query, values: params });
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL failed", query);
        return null;
    }
    const [resultInsert] = executedQueries;
    const insertedId = resultInsert[0]?.insertId;
    if (!insertedId) {
        logger.error(msg + "no inserted id");
        return null;
    }
    logger.info(msg + 'user created via wizard', { user_id: insertedId, phone_tail: phone.slice(-4) });
    return await getUsersByIds([insertedId.toString()]);
}

export async function addUser(user: RegUser): Promise<DBUser | null> {
    const msg = msgGlobal + "addUser - ";
    const query = `INSERT INTO user(name, email, phone, password, is_register) VALUES(?, ?, ?, ?, 1)`
    const params = [user.name, user.email, user.phone ?? null, md5(user.password)]
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
    return await getUsersByIds([insertedId.toString()])
}

export async function saveUser(id: string, user: DBUser): Promise<DBUser | null> {
    const msg = msgGlobal + "saveUser - ";
    let query = `UPDATE user SET name=?, email=?, status=? `
    const params: Array<string | number | null | undefined> = [user.name, user.email, user.status]
    if(user.new_password) {
        query += ', password=?'
        params.push(md5(user.new_password))
    }
    query += ' WHERE id=?'
    params.push(id)
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

    return user
}

export async function updateUserPhone(id: string, phone: string): Promise<boolean> {
    const msg = msgGlobal + "updateUserPhone - ";
    const current = await getUsersByIds([id]);
    let query = `UPDATE user SET phone=?`;
    const params: Array<string | number> = [phone];
    if (current && isPhoneEmail(current.email)) {
        query += `, email=?`;
        params.push(phoneToEmail(phone));
    }
    query += ` WHERE id=?`;
    params.push(id);
    const updateFunc = update({ query, values: params });
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL no results from execution", query)
        return false
    }
    const [result] = executedQueries;
    const updated = result[0]?.affectedRows ?? 0
    if (updated > 0) {
        logger.info(msg + 'phone updated', { user_id: id })
    } else {
        logger.warn(msg + "no rows updated", { user_id: id })
    }
    return updated > 0
}

export async function deleteUser(id: string): Promise<DBUser | null> {
    const msg = msgGlobal + "deleteUser - ";
    const user = await getUsersByIds([id])
    if(user === null) {
        logger.warn(msg + "User not found", id)
        return null
    }
    const query = `DELETE FROM user WHERE id=?`;
    const params = [id]
    const deleteFunc = remove({ query, values: params});
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([deleteFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [result] = executedQueries;
    const deleted = result[0]?.affectedRows
    if (deleted > 0) {
        logger.info(msg + 'deleted', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }

    return user
}

export async function login(email: string, password: string): Promise<DBUser | null | undefined> {
    const msg = msgGlobal + "login - "
    const query =  `SELECT * FROM user WHERE email=?`;
    const params = [email]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBUser>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        logger.error(msg + 'User with email/password not found', email, password)
        return null
    }
    if (rows.length > 1) {
        logger.error(msg + 'Double User found', email, password)
        return null
    }
    if (rows[0].status === 2) {
        logger.error(msg + 'User blocked', email, password)
        return null
    }
    const user = rows[0]
    const hashed = md5(password)
    if (hashed === user.password) {
        return user
    }
    // Forgot-password flow: a freshly issued temporary password may be active.
    // Activate it on this successful login — promote temp_password to password
    // and clear the temp slot so it can only be used once.
    if (user.temp_password && hashed === user.temp_password) {
        await promoteTempPassword(user.id, hashed)
        user.password = hashed
        user.temp_password = null
        return user
    }
    logger.error(msg + 'Incorrect login/password', email, password, user)
    return undefined
}

async function promoteTempPassword(userId: string | number, newPasswordHash: string): Promise<void> {
    const msg = msgGlobal + "promoteTempPassword - "
    const query = 'UPDATE user SET password=?, temp_password=NULL WHERE id=?'
    const params = [newPasswordHash, userId]
    const updateFunc = update({ query, values: params })
    const executed = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg)
    if (!executed) {
        logger.error(msg + 'SQL failed', { user_id: userId })
        return
    }
    const [result] = executed
    if (result[0]?.affectedRows) {
        logger.info(msg + 'temp password promoted to password', { user_id: userId })
    }
}

export async function profile(id: string, name: string, password: string, oldPassword: string): Promise<DBUser | null | undefined> {
    const msg = msgGlobal + "profile - "
    const query =  `SELECT * FROM user WHERE id=?`;
    const params = [id];
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBUser>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) {
        logger.warn(msg + 'User not found by id', id, name)
        return null
    }

    const user = rows[0]
    if(oldPassword && md5(oldPassword) !== user.password) {
        logger.error(msg + 'Incorrect login/password', id, name, oldPassword, user)
        return undefined
    }

    let userUpdateSQL: string = 'UPDATE user SET name=?'
    const userUpdateData = [name]
    if(password) {
        userUpdateSQL += ', password=?'
        userUpdateData.push(md5(password))
    }
    userUpdateSQL += ' WHERE id=?'
    userUpdateData.push(id)

    const updateFunc = update({ query: userUpdateSQL, values: userUpdateData});
    const executedQueries2 = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executedQueries2) {
        logger.error(msg + "SQL not results from execution", userUpdateSQL)
        return null
    }
    const [result] = executedQueries2;
    const updated = result[0]?.affectedRows
    if (updated > 0) {
        logger.info(msg + 'updated', result)
    } else { 
        logger.warn(msg + "No updates", result[0])
    }

    return user
}

/**
 * Updates name + email on the user record. Used after OTP-registered users
 * complete their profile in the question wizard.
 * Returns:
 *   - the updated user on success
 *   - undefined if another user already owns the requested email
 *   - null if the user wasn't found or update failed
 */
export async function updateUserProfileFields(
    id: string,
    name: string,
    email: string,
): Promise<DBUser | null | undefined> {
    const msg = msgGlobal + "updateUserProfileFields - ";

    const existing = await getUserByEmail(email);
    if (existing && existing.id.toString() !== id.toString()) {
        logger.warn(msg + 'email already used by another user', { id, email });
        return undefined;
    }

    const emailUnchanged = !!existing && existing.id.toString() === id.toString();
    let userUpdateSQL = 'UPDATE user SET name=?, email=?';
    const params: Array<string> = [name, email];
    if (!emailUnchanged) {
        userUpdateSQL += ', email_verified=0';
    }
    userUpdateSQL += ' WHERE id=?';
    params.push(id);
    const updateFunc = update({ query: userUpdateSQL, values: params });
    const executed = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL failed', userUpdateSQL);
        return null;
    }
    const [result] = executed;
    if (!result[0]?.affectedRows) {
        logger.warn(msg + 'no rows affected', { id });
        return null;
    }

    const refreshed = await getUsersByIds([id.toString()]);
    if (!refreshed) {
        logger.error(msg + 'refresh failed', { id });
        return null;
    }
    return refreshed as DBUser;
}

/**
 * Marks the "first question free" benefit as consumed.
 * Called from addClientQuestion when the user inserts their first root question.
 * Idempotent — safe to call even if the flag is already 0.
 */
export async function markFirstQuestionUsed(userId: string | number): Promise<void> {
    const msg = msgGlobal + "markFirstQuestionUsed - ";
    const query = 'UPDATE user SET is_first_question_free = 0 WHERE id = ? AND is_first_question_free = 1';
    const updateFunc = update({ query, values: [userId] });
    const executed = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL failed', { user_id: userId });
        return;
    }
    const [result] = executed;
    if (result[0]?.affectedRows) {
        logger.info(msg + 'flag flipped to 0', { user_id: userId });
    }
}

export async function register(name: string, email: string, password: string, phone: string | null = null): Promise<DBUser | null | undefined> {
    const msg = msgGlobal + "register - ";
    const user = await getUserByEmail(email)
    if (user !== null) {
        logger.error(msg + 'User exists', email, name)
        return undefined
    }
    if (phone) {
        const byPhone = await getUserByPhone(phone)
        if (byPhone !== null) {
            logger.error(msg + 'User exists by phone', phone, name)
            return undefined
        }
    }
    const regUser: RegUser = {name: name, email: email, password: password, phone: phone}

    const userInserted = await addUser(regUser)
    if(userInserted === null) {
        logger.error(msg + 'Can not add user', regUser)
        return null
    }

    return userInserted
}

export async function reset(email: string): Promise<DBUser | undefined | null> {
    const msg = msgGlobal + "reset - ";
    const user = await getUserByEmail(email)
    if(user === null) {
        logger.error(msg + 'User not found by email', email)
        return undefined
    }
    return issueTempPassword(user, msg)
}

export async function resetByPhone(phone: string): Promise<DBUser | undefined | null> {
    const msg = msgGlobal + "resetByPhone - ";
    const user = await getUserByPhone(phone)
    if(user === null) {
        logger.error(msg + 'User not found by phone', { phone_tail: phone.slice(-4) })
        return undefined
    }
    return issueTempPassword(user, msg)
}

/**
 * Generates a fresh password, stores it in the user's `temp_password` slot
 * (md5'd) and returns the user with the plaintext password attached so the
 * caller can deliver it via the chosen channel (SendGrid email, p1sms).
 *
 * The original `password` is left untouched — the old credentials stay valid
 * until the user logs in with the new temporary password, at which point
 * `login()` promotes temp_password → password.
 */
async function issueTempPassword(user: DBUser, msg: string): Promise<DBUser | null> {
    // passGenerator excludes `&`/`_` (the only specials outside the p1sms `%w`
    // charset) so the SMS-delivered temp password still matches the reset
    // template. Other punctuation is kept. Safe for email reset too.
    const newPass = passGenerator(6)
    const query = 'UPDATE user SET temp_password=? WHERE id=?'
    const params = [md5(newPass), user.id]
    const updateFunc = update({ query, values: params })
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg)
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [result] = executedQueries
    const updated = result[0]?.affectedRows
    if (updated > 0) {
        logger.info(msg + 'temp password issued', { user_id: user.id })
    } else {
        logger.warn(msg + "No updates", result[0])
    }
    user.password = newPass
    return user
}

export async function issueEmailVerification(
    userId: string | number,
): Promise<{ password: string; token: string } | null> {
    const msg = msgGlobal + "issueEmailVerification - "
    const tempPassword = passGenerator(12)
    const token = randomBytes(32).toString('hex')
    const query = 'UPDATE user SET email_verified=0, email_verify_token=?, temp_password=? WHERE id=?'
    const params = [token, md5(tempPassword), userId]
    const updateFunc = update({ query, values: params })
    const executed = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg)
    if (!executed) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [result] = executed
    if (!result[0]?.affectedRows) {
        logger.warn(msg + "No updates", { user_id: userId })
        return null
    }
    logger.info(msg + 'verification issued', { user_id: userId })
    return { password: tempPassword, token }
}

export async function issueEmailVerificationToken(
    userId: string | number,
): Promise<string | null> {
    const msg = msgGlobal + "issueEmailVerificationToken - "
    const token = randomBytes(32).toString('hex')
    const query = 'UPDATE user SET email_verified=0, email_verify_token=? WHERE id=?'
    const params = [token, userId]
    const updateFunc = update({ query, values: params })
    const executed = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg)
    if (!executed) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [result] = executed
    if (!result[0]?.affectedRows) {
        logger.warn(msg + "No updates", { user_id: userId })
        return null
    }
    logger.info(msg + 'verification token issued', { user_id: userId })
    return token
}

export async function verifyEmailByToken(
    token: string,
): Promise<DBUser | null | undefined> {
    const msg = msgGlobal + "verifyEmailByToken - "
    if (!token) {
        logger.warn(msg + 'empty token')
        return undefined
    }
    const findQuery = 'SELECT * FROM user WHERE email_verify_token=?'
    const findFunc = find({ query: findQuery, values: [token] })
    const found = await queryTransactionWrapper<DBUser>([findFunc], msg)
    if (!found) {
        logger.error(msg + "SQL not results from execution", findQuery)
        return null
    }
    const [[rows]] = found
    if (rows.length === 0) {
        logger.warn(msg + 'token not found')
        return undefined
    }
    const user = rows[0]
    const updateQuery = 'UPDATE user SET email_verified=1 WHERE id=?'
    const updateFunc = update({ query: updateQuery, values: [user.id] })
    const executed = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg)
    if (!executed) {
        logger.error(msg + "SQL not results from execution", updateQuery)
        return null
    }
    logger.info(msg + 'email verified', { user_id: user.id })
    user.email_verified = 1
    return user
}