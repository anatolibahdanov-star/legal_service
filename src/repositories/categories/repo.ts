import logger from "@/src/libs/logger"
import {find, queryTransactionWrapper, findOne, insert, executeTransactionWrapper, update, remove} from '@/src/libs/db';
import { ResultSetHeader } from 'mysql2/promise';
import {CountResult, DBCategory} from "@/src/interfaces/db"

const msgGlobal = "REPO CATEGORY "

export async function getCategories(page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC']): Promise<DBCategory[] | null> {
    const msg = msgGlobal + "getCategories - ";
    const query =  `SELECT * FROM category ORDER BY id DESC LIMIT ? OFFSET ?`;
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const findFunc = find({ query, values: [limit, offset] });
    const executedQueries = await queryTransactionWrapper<DBCategory>([findFunc], msg);
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

export async function getTotalCategories(): Promise<number> {
    const msg = msgGlobal + "getTotalCategories - ";
    const query = `SELECT COUNT(id) counter FROM category`;
    const calcUserFunc = findOne({ query: query, values: [] });
    const executedQueries = await queryTransactionWrapper<CountResult>([calcUserFunc], msg);
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

export async function getCategoriesByIds(ids: string[]): Promise<DBCategory[] | null> {
    const msg = msgGlobal + "getCategoriesByIds - ";
    const query = `SELECT * FROM category WHERE id IN (?)`;
    const findFunc = find({ query, values: [ids] });
    const executedQueries = await queryTransactionWrapper<DBCategory>([findFunc], msg);
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

export async function getCategoryByName(name: string): Promise<DBCategory[] | null> {
    const msg = msgGlobal + "getCategoryByName - ";
    if (!name) return null;
    const query = `SELECT * FROM category WHERE name=?`;
    const findFunc = find({ query, values: [name] });
    const executedQueries = await queryTransactionWrapper<DBCategory>([findFunc], msg);
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

export function getAdminCategoryOrder(orderBy:string[]): string {
    if(orderBy && orderBy.length>0) {
        const field = orderBy[0] ?? "id"
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "id DESC"
}

export async function addCategory(category: DBCategory): Promise<DBCategory[] | null> {
    const msg = msgGlobal + "addCategory - ";
    const categoryByName = await getCategoryByName(category.name)
    if(categoryByName === null || categoryByName.length === 0) {
        const query = `INSERT INTO category(name, weight) VALUES(?, ?)`
        const params = [category.name, category.weight];
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

        return getCategoriesByIds([insertedId.toString()])
    }
    return categoryByName
}

export async function saveCategory(id: string, category: DBCategory): Promise<DBCategory[] | null> {
    const msg = msgGlobal + "saveCategory - ";
    const query = `UPDATE category SET name=?, weight=? WHERE id=?`
    const params = [category.name, category.weight, id];

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

    return [category]
}

export async function deleteCategory(id: string): Promise<DBCategory[] | null> {
    const msg = msgGlobal + "deleteCategory - ";
    const entities = await getCategoriesByIds([id])
    if(entities === null) {
        console.error(msg + "Not found", id)
        return null
    }
    const category: DBCategory = entities[0]
    const query = `DELETE FROM category WHERE id=?`;
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

    return [category]
}