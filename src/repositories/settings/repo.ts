import pool, { find, findOne, queryTransactionWrapper } from '@/src/libs/db';
import { ResultSetHeader } from 'mysql2/promise';
import { CountResult, DBSetting, DBSettingAudit, DBPromptVersion } from '@/src/interfaces/db';
import logger from '@/src/libs/logger';

const msgGlobal = 'REPO SETTING ';

interface SettingFilter {
    id?: Array<number | string> | number | string;
    code?: string;
    grp?: string;
}

const SETTING_TYPES = ['int', 'decimal', 'bool', 'string', 'text'] as const;
export type SettingType = (typeof SETTING_TYPES)[number];

export interface ValidationResult {
    ok: boolean;
    normalized?: string;
    error?: string;
}

export function validateSettingValue(valueType: string, raw: unknown): ValidationResult {
    const asString = raw === undefined || raw === null ? '' : String(raw).trim();
    switch (valueType) {
        case 'int': {
            if (asString === '') return { ok: false, error: 'Значение обязательно.' };
            const n = Number(asString);
            if (!Number.isInteger(n)) return { ok: false, error: 'Значение должно быть целым числом.' };
            if (!Number.isSafeInteger(n)) return { ok: false, error: 'Значение слишком большое.' };
            if (n < 0) return { ok: false, error: 'Значение не может быть отрицательным.' };
            return { ok: true, normalized: String(n) };
        }
        case 'decimal': {
            if (asString === '') return { ok: false, error: 'Значение обязательно.' };
            const n = Number(asString);
            if (!Number.isFinite(n)) return { ok: false, error: 'Значение должно быть числом.' };
            if (n < 0) return { ok: false, error: 'Значение не может быть отрицательным.' };
            return { ok: true, normalized: String(n) };
        }
        case 'bool': {
            const low = asString.toLowerCase();
            if (['1', 'true', 'on', 'yes'].includes(low)) return { ok: true, normalized: '1' };
            if (['0', 'false', 'off', 'no', ''].includes(low)) return { ok: true, normalized: '0' };
            return { ok: false, error: 'Значение должно быть логическим (вкл/выкл).' };
        }
        case 'string':
        case 'text':
            return { ok: true, normalized: asString };
        default:
            return { ok: true, normalized: asString };
    }
}

function getOrder(orderBy: string[]): string {
    const allowed = ['id', 'code', 'name', 'value', 'value_type', 'grp', 'weight', 'is_active', 'created_at', 'updated_at'];
    if (orderBy && orderBy.length > 0 && allowed.includes(orderBy[0])) {
        const field = orderBy[0];
        const sorter = ['ASC', 'DESC'].includes(orderBy[1]) ? orderBy[1] : 'ASC';
        return field + ' ' + sorter;
    }
    return 'weight ASC, id ASC';
}

function getFilter(filter: SettingFilter | null): { where: string; values: Array<string | number | Array<string | number>> } {
    if (!filter) return { where: '', values: [] };
    const clauses: string[] = [];
    const values: Array<string | number | Array<string | number>> = [];
    if (filter.id !== undefined) {
        const ids = Array.isArray(filter.id) ? filter.id : [filter.id];
        clauses.push('id IN (?)');
        values.push(ids as Array<string | number>);
    }
    if (filter.code) {
        clauses.push('code = ?');
        values.push(filter.code);
    }
    if (filter.grp) {
        clauses.push('grp = ?');
        values.push(filter.grp);
    }
    return { where: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '', values };
}

export async function getSettings(
    page: string = '1', _limit: string = '100', _sorter: string[] = ['weight', 'ASC'], filter: SettingFilter | null = null
): Promise<DBSetting[] | null> {
    const msg = msgGlobal + 'getSettings - ';
    const orderBy = getOrder(_sorter);
    const { where, values } = getFilter(filter);
    const limit = parseInt(_limit) || 100;
    const offset = ((parseInt(page) || 1) - 1) * limit;
    const query = `SELECT * FROM setting ` + where + ` ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`;
    const params = [...values, limit, offset];
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBSetting>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + 'SQL not results from execution', query);
        return null;
    }
    const [[rows]] = executedQueries;
    return rows.length === 0 ? [] : rows;
}

export async function getTotalSettings(filter: SettingFilter | null = null): Promise<number> {
    const msg = msgGlobal + 'getTotalSettings - ';
    const { where, values } = getFilter(filter);
    const query = `SELECT COUNT(id) as counter FROM setting ` + where;
    const calcFunc = findOne({ query, values });
    const executedQueries = await queryTransactionWrapper<CountResult>([calcFunc], msg);
    if (!executedQueries) {
        logger.error(msg + 'SQL not results from execution', query);
        return 0;
    }
    const [[rows]] = executedQueries;
    return rows.length === 0 ? 0 : rows[0].counter;
}

export async function getSettingById(id: string | number): Promise<DBSetting | null> {
    const msg = msgGlobal + 'getSettingById - ';
    const query = `SELECT * FROM setting WHERE id = ?`;
    const findFunc = find({ query, values: [id] });
    const executedQueries = await queryTransactionWrapper<DBSetting>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + 'SQL not results from execution', query);
        return null;
    }
    const [[rows]] = executedQueries;
    return rows.length === 0 ? null : rows[0];
}

export interface SaveSettingResult {
    setting: DBSetting | null;
    error?: string;
}

export async function saveSetting(
    id: string, patch: Partial<DBSetting>, adminId: number | null
): Promise<SaveSettingResult> {
    const msg = msgGlobal + 'saveSetting - ';
    const current = await getSettingById(id);
    if (!current) {
        return { setting: null, error: 'Параметр не найден.' };
    }

    const validation = validateSettingValue(current.value_type, patch.value);
    if (!validation.ok) {
        logger.warn(msg + 'validation failed', { id, code: current.code, error: validation.error });
        return { setting: null, error: validation.error };
    }
    const newValue = validation.normalized ?? '';
    const newIsActive = patch.is_active === undefined ? current.is_active : (patch.is_active ? 1 : 0);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query<ResultSetHeader>(
            `UPDATE setting SET value = ?, is_active = ? WHERE id = ?`,
            [newValue, newIsActive, id]
        );
        await conn.query<ResultSetHeader>(
            `INSERT INTO setting_audit (setting_code, old_value, new_value, admin_id, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [current.code, current.value, newValue, adminId]
        );
        await conn.commit();
        logger.info(msg + 'changed', { setting_code: current.code, admin_id: adminId, old: current.value, new: newValue });
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { id, error });
        return { setting: null, error: 'Ошибка при сохранении.' };
    } finally {
        conn.release();
    }

    return { setting: await getSettingById(id) };
}

export async function createSetting(patch: Partial<DBSetting>, adminId: number | null): Promise<SaveSettingResult> {
    const msg = msgGlobal + 'createSetting - ';
    const code = (patch.code ?? '').toString().trim();
    if (!code) return { setting: null, error: 'Код параметра обязателен.' };
    const valueType = SETTING_TYPES.includes(patch.value_type as SettingType) ? (patch.value_type as SettingType) : 'string';
    const validation = validateSettingValue(valueType, patch.value);
    if (!validation.ok) {
        return { setting: null, error: validation.error };
    }
    const newValue = validation.normalized ?? '';

    const existing = await getSettingByCode(code);
    if (existing) return { setting: null, error: 'Параметр с таким кодом уже существует.' };

    const conn = await pool.getConnection();
    let insertedId: number | null = null;
    try {
        await conn.beginTransaction();
        const [res] = await conn.query<ResultSetHeader>(
            `INSERT INTO setting (code, name, description, value, value_type, grp, weight, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                code,
                (patch.name ?? code).toString(),
                patch.description ? patch.description.toString() : null,
                newValue,
                valueType,
                (patch.grp ?? 'general').toString(),
                Number.isFinite(Number(patch.weight)) ? Number(patch.weight) : 0,
                patch.is_active === undefined ? 1 : (patch.is_active ? 1 : 0),
            ]
        );
        insertedId = res.insertId;
        await conn.query<ResultSetHeader>(
            `INSERT INTO setting_audit (setting_code, old_value, new_value, admin_id, created_at) VALUES (?, ?, ?, ?, NOW())`,
            [code, null, newValue, adminId]
        );
        await conn.commit();
        logger.info(msg + 'created', { code, admin_id: adminId });
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { code, error });
        return { setting: null, error: 'Ошибка при создании.' };
    } finally {
        conn.release();
    }
    return { setting: insertedId ? await getSettingById(insertedId) : null };
}

export async function getSettingByCode(code: string): Promise<DBSetting | null> {
    const msg = msgGlobal + 'getSettingByCode - ';
    const query = `SELECT * FROM setting WHERE code = ?`;
    const findFunc = find({ query, values: [code] });
    const executedQueries = await queryTransactionWrapper<DBSetting>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + 'SQL not results from execution', query);
        return null;
    }
    const [[rows]] = executedQueries;
    return rows.length === 0 ? null : rows[0];
}

export async function getSettingAudit(limit: number = 500): Promise<DBSettingAudit[]> {
    const msg = msgGlobal + 'getSettingAudit - ';
    const query = `SELECT s.id, s.setting_code, s.old_value, s.new_value, s.admin_id, s.created_at,
        a.name AS admin_name, a.username AS admin_username
        FROM setting_audit s
        LEFT JOIN administrator a ON s.admin_id = a.id
        ORDER BY s.created_at DESC, s.id DESC
        LIMIT ?`;
    const findFunc = find({ query, values: [limit] });
    const executed = await queryTransactionWrapper<DBSettingAudit>([findFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL not results from execution', query);
        return [];
    }
    const [[rows]] = executed;
    return rows ?? [];
}

export async function getPromptVersions(
    page: string = '1', _limit: string = '50', _sorter: string[] = ['id', 'DESC'], filter: { id?: Array<number | string> | number | string; code?: string } | null = null
): Promise<DBPromptVersion[] | null> {
    const msg = msgGlobal + 'getPromptVersions - ';
    const allowed = ['id', 'code', 'name', 'is_active', 'created_at'];
    const field = _sorter && allowed.includes(_sorter[0]) ? _sorter[0] : 'id';
    const dir = _sorter && ['ASC', 'DESC'].includes(_sorter[1]) ? _sorter[1] : 'DESC';
    const clauses: string[] = [];
    const vals: Array<string | number | Array<string | number>> = [];
    if (filter?.id !== undefined) {
        const ids = Array.isArray(filter.id) ? filter.id : [filter.id];
        clauses.push('p.id IN (?)');
        vals.push(ids as Array<string | number>);
    }
    if (filter?.code) {
        clauses.push('p.code = ?');
        vals.push(filter.code);
    }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const limit = parseInt(_limit) || 50;
    const offset = ((parseInt(page) || 1) - 1) * limit;
    const query = `SELECT p.id, p.code, p.name, p.is_active, p.admin_id, p.created_at,
        a.name AS admin_name, a.username AS admin_username
        FROM prompt_version p
        LEFT JOIN administrator a ON p.admin_id = a.id
        ${where} ORDER BY p.${field} ${dir} LIMIT ? OFFSET ?`;
    const findFunc = find({ query, values: [...vals, limit, offset] });
    const executed = await queryTransactionWrapper<DBPromptVersion>([findFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL not results from execution', query);
        return null;
    }
    const [[rows]] = executed;
    return rows.length === 0 ? [] : rows;
}

export async function getTotalPromptVersions(filter: { code?: string } | null = null): Promise<number> {
    const msg = msgGlobal + 'getTotalPromptVersions - ';
    const where = filter?.code ? 'WHERE code = ?' : '';
    const values = filter?.code ? [filter.code] : [];
    const query = `SELECT COUNT(id) as counter FROM prompt_version ` + where;
    const calcFunc = findOne({ query, values });
    const executed = await queryTransactionWrapper<CountResult>([calcFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL not results from execution', query);
        return 0;
    }
    const [[rows]] = executed;
    return rows.length === 0 ? 0 : rows[0].counter;
}

export async function getPromptVersionById(id: string | number): Promise<DBPromptVersion | null> {
    const msg = msgGlobal + 'getPromptVersionById - ';
    const query = `SELECT p.*, a.name AS admin_name, a.username AS admin_username
        FROM prompt_version p
        LEFT JOIN administrator a ON p.admin_id = a.id
        WHERE p.id = ?`;
    const findFunc = find({ query, values: [id] });
    const executed = await queryTransactionWrapper<DBPromptVersion>([findFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL not results from execution', query);
        return null;
    }
    const [[rows]] = executed;
    return rows.length === 0 ? null : rows[0];
}

export async function getActivePromptBody(code: string): Promise<string | null> {
    const msg = msgGlobal + 'getActivePromptBody - ';
    const query = `SELECT body FROM prompt_version WHERE code = ? AND is_active = 1 ORDER BY id DESC LIMIT 1`;
    const findFunc = find({ query, values: [code] });
    const executed = await queryTransactionWrapper<DBPromptVersion>([findFunc], msg);
    if (!executed) {
        logger.error(msg + 'SQL not results from execution', query);
        return null;
    }
    const [[rows]] = executed;
    return rows.length === 0 ? null : rows[0].body;
}

export async function createPromptVersion(
    code: string, name: string, body: string, activate: boolean, adminId: number | null
): Promise<DBPromptVersion | null> {
    const msg = msgGlobal + 'createPromptVersion - ';
    const conn = await pool.getConnection();
    let insertedId: number | null = null;
    try {
        await conn.beginTransaction();
        if (activate) {
            await conn.query<ResultSetHeader>(`UPDATE prompt_version SET is_active = 0 WHERE code = ?`, [code]);
        }
        const [res] = await conn.query<ResultSetHeader>(
            `INSERT INTO prompt_version (code, name, body, is_active, admin_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
            [code, name, body, activate ? 1 : 0, adminId]
        );
        insertedId = res.insertId;
        await conn.commit();
        logger.info(msg + 'created', { id: insertedId, code, activate, admin_id: adminId });
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { code, error });
        return null;
    } finally {
        conn.release();
    }
    return insertedId ? getPromptVersionById(insertedId) : null;
}

export async function activatePromptVersion(id: string | number, adminId: number | null): Promise<DBPromptVersion | null> {
    const msg = msgGlobal + 'activatePromptVersion - ';
    const target = await getPromptVersionById(id);
    if (!target) {
        logger.warn(msg + 'version not found', { id });
        return null;
    }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query<ResultSetHeader>(`UPDATE prompt_version SET is_active = 0 WHERE code = ?`, [target.code]);
        await conn.query<ResultSetHeader>(`UPDATE prompt_version SET is_active = 1 WHERE id = ?`, [id]);
        await conn.commit();
        logger.info(msg + 'activated', { id, code: target.code, admin_id: adminId });
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { id, error });
        return null;
    } finally {
        conn.release();
    }
    return getPromptVersionById(id);
}

export async function deactivatePromptVersion(id: string | number, adminId: number | null): Promise<DBPromptVersion | null> {
    const msg = msgGlobal + 'deactivatePromptVersion - ';
    const target = await getPromptVersionById(id);
    if (!target) return null;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query<ResultSetHeader>(`UPDATE prompt_version SET is_active = 0 WHERE id = ?`, [id]);
        await conn.commit();
        logger.info(msg + 'deactivated', { id, code: target.code, admin_id: adminId });
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { id, error });
        return null;
    } finally {
        conn.release();
    }
    return getPromptVersionById(id);
}

export async function updatePromptVersion(
    id: string | number,
    patch: { name?: string; body?: string; is_active?: boolean },
    adminId: number | null
): Promise<DBPromptVersion | null> {
    const msg = msgGlobal + 'updatePromptVersion - ';
    const target = await getPromptVersionById(id);
    if (!target) {
        logger.warn(msg + 'version not found', { id });
        return null;
    }
    const nextName = patch.name !== undefined ? patch.name : target.name;
    const nextBody = patch.body !== undefined ? patch.body : target.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query<ResultSetHeader>(
            `UPDATE prompt_version SET name = ?, body = ? WHERE id = ?`,
            [nextName, nextBody, id]
        );
        if (patch.is_active !== undefined) {
            if (patch.is_active) {
                await conn.query<ResultSetHeader>(`UPDATE prompt_version SET is_active = 0 WHERE code = ?`, [target.code]);
                await conn.query<ResultSetHeader>(`UPDATE prompt_version SET is_active = 1 WHERE id = ?`, [id]);
            } else {
                await conn.query<ResultSetHeader>(`UPDATE prompt_version SET is_active = 0 WHERE id = ?`, [id]);
            }
        }
        await conn.commit();
        logger.info(msg + 'updated', { id, code: target.code, admin_id: adminId, is_active: patch.is_active });
    } catch (error) {
        await conn.rollback();
        logger.error(msg + 'transaction failed', { id, error });
        return null;
    } finally {
        conn.release();
    }
    return getPromptVersionById(id);
}

export async function seedPromptVersionIfEmpty(
    code: string, name: string, body: string
): Promise<void> {
    const msg = msgGlobal + 'seedPromptVersionIfEmpty - ';
    const existing = await getTotalPromptVersions({ code });
    if (existing > 0) return;
    const created = await createPromptVersion(code, name, body, true, null);
    if (created) {
        logger.info(msg + 'seeded initial prompt version', { code, id: created.id });
    }
}
