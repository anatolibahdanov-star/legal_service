import {find, findOne, queryTransactionWrapper, executeTransactionWrapper, update} from '@/src/libs/db';
import { ResultSetHeader } from 'mysql2/promise';
import {CountResult, DBEmailTemplate} from "@/src/interfaces/db"
import logger from "@/src/libs/logger"

const msgGlobal = "REPO EMAIL-TEMPLATE "

interface EmailTemplateFilter {
    id?: Array<number | string> | number | string;
    code?: string;
}

function getOrder(orderBy: string[]): string {
    const allowed = ['id', 'code', 'name', 'subject', 'is_active', 'created_at', 'updated_at']
    if (orderBy && orderBy.length > 0 && allowed.includes(orderBy[0])) {
        const field = orderBy[0]
        const sorter = ["ASC", "DESC"].includes(orderBy[1]) ? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "id ASC"
}

function getFilter(filter: EmailTemplateFilter | null): { where: string; values: Array<string | number | Array<string | number>> } {
    if (!filter) return { where: '', values: [] }
    const clauses: string[] = []
    const values: Array<string | number | Array<string | number>> = []
    if (filter.id !== undefined) {
        const ids = Array.isArray(filter.id) ? filter.id : [filter.id]
        clauses.push('id IN (?)')
        values.push(ids as Array<string | number>)
    }
    if (filter.code) {
        clauses.push('code = ?')
        values.push(filter.code)
    }
    return { where: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '', values }
}

export async function getEmailTemplates(
    page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'ASC'], filter: EmailTemplateFilter | null = null
): Promise<DBEmailTemplate[] | null> {
    const msg = msgGlobal + "getEmailTemplates - "
    const orderBy = getOrder(_sorter)
    const { where, values } = getFilter(filter)
    const limit = parseInt(_limit) || 10
    const offset = ((parseInt(page) || 1) - 1) * limit
    const query = `SELECT * FROM email_template ` + where + ` ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`
    const params = [...values, limit, offset]
    const findFunc = find({ query, values: params })
    const executedQueries = await queryTransactionWrapper<DBEmailTemplate>([findFunc], msg)
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries
    return rows.length === 0 ? [] : rows
}

export async function getTotalEmailTemplates(filter: EmailTemplateFilter | null = null): Promise<number> {
    const msg = msgGlobal + "getTotalEmailTemplates - "
    const { where, values } = getFilter(filter)
    const query = `SELECT COUNT(id) as counter FROM email_template ` + where
    const calcFunc = findOne({ query, values })
    const executedQueries = await queryTransactionWrapper<CountResult>([calcFunc], msg)
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return 0
    }
    const [[rows]] = executedQueries
    return rows.length === 0 ? 0 : rows[0].counter
}

export async function getEmailTemplateById(id: string | number): Promise<DBEmailTemplate | null> {
    const msg = msgGlobal + "getEmailTemplateById - "
    const query = `SELECT * FROM email_template WHERE id = ?`
    const findFunc = find({ query, values: [id] })
    const executedQueries = await queryTransactionWrapper<DBEmailTemplate>([findFunc], msg)
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries
    return rows.length === 0 ? null : rows[0]
}

export async function getEmailTemplateByCode(code: string): Promise<DBEmailTemplate | null> {
    const msg = msgGlobal + "getEmailTemplateByCode - "
    const query = `SELECT * FROM email_template WHERE code = ?`
    const findFunc = find({ query, values: [code] })
    const executedQueries = await queryTransactionWrapper<DBEmailTemplate>([findFunc], msg)
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries
    return rows.length === 0 ? null : rows[0]
}

export async function saveEmailTemplate(id: string, template: Partial<DBEmailTemplate>): Promise<DBEmailTemplate | null> {
    const msg = msgGlobal + "saveEmailTemplate - "
    const query = `UPDATE email_template SET name = ?, subject = ?, body = ?, button_label = ?, is_active = ? WHERE id = ?`
    const params = [
        template.name,
        template.subject,
        template.body,
        template.button_label ?? null,
        template.is_active ? 1 : 0,
        id,
    ]
    const updateFunc = update({ query, values: params })
    const executedQueries = await executeTransactionWrapper<ResultSetHeader>([updateFunc], msg)
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [result] = executedQueries
    if (result[0]?.affectedRows > 0) {
        logger.info(msg + 'updated', { id })
    } else {
        logger.warn(msg + "No updates", { id })
    }
    return getEmailTemplateById(id)
}
