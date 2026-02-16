import pool from '@/src/libs/db';
import { OkPacket, FieldPacket } from 'mysql2/promise';
import {CountResult, DBCategory} from "@/src/interfaces/db"

export async function getCategories(page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC']): Promise<DBCategory[] | null> {
    const orderBy = getAdminCategoryOrder(_sorter);
    const sql: string =  `SELECT * FROM category ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`;
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const [rows] = await pool.query<DBCategory[]>({sql: sql, values: [limit, offset]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getTotalCategories(): Promise<number> {
    const sql: string =  `SELECT COUNT(id) counter FROM category`;
    const [rows] = await pool.query<CountResult[]>({sql: sql});
    if (rows.length === 0) {
        return 0
    }
    const totalCount = rows[0].counter;
    return totalCount
}

export async function getCategoriesByIds(ids: string[]): Promise<DBCategory[] | null> {
    const msg = "REPO getCategoriesByIds: "
    const sql: string =  `SELECT * FROM category WHERE id IN (?)`;
    console.log(msg + "params", ids)
    const [rows] = await pool.query<DBCategory[]>({sql: sql, values: [ids]});
    if (rows.length === 0) {
        return []
    }
    return rows
}

export async function getCategoryByName(name: string): Promise<DBCategory[] | null> {
    const msg = "REPO getCategoryByName: "
    if (!name) {
        return null;
    }
    const sql: string =  `SELECT * FROM category WHERE name=?`;
    console.log(msg + "params", name)
    const [rows] = await pool.query<DBCategory[]>({sql: sql, values: [name]});
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
    const msg = "REPO addCategory: "
    const categoryByName = await getCategoryByName(category.name)
    if(categoryByName === null || categoryByName.length === 0) {
        const categoryInsertSQL = `INSERT INTO category(name, weight) VALUES(?, ?)`
        const [resultCategoryInsert, ufields] = await pool.execute(categoryInsertSQL, 
            [category.name, category.weight]) as [OkPacket, FieldPacket[]];
        const insertedCategoryId = resultCategoryInsert?.insertId
        if (!insertedCategoryId) {
            console.error("(ERROR)" + msg + "empty inserted category id", category, ufields)
            return null
        }
        console.log(msg + 'inserted', insertedCategoryId, ufields)

        return getCategoriesByIds([insertedCategoryId.toString()])
    }
    return categoryByName
}

export async function saveCategory(id: string, category: DBCategory): Promise<DBCategory[] | null> {
    const msg = "REPO saveCategory: "
    const updateSQL = `UPDATE category SET name=?, weight=? WHERE id=?`
    const [resultUpdate, ufields] = await pool.execute(updateSQL, [category.name, category.weight, id]);
    console.log(msg + 'updated', resultUpdate, ufields)

    return [category]
}

export async function deleteCategory(id: string): Promise<DBCategory[] | null> {
    const msg = "REPO deleteCategory: "
    const entities = await getCategoriesByIds([id])
    if(entities === null) {
        console.error("(ERROR)" + msg + "category not found", id)
        return null
    }
    const category: DBCategory = entities[0]
    const deleteSQL = `DELETE FROM category WHERE id=?`
    const [resultDelete] = await pool.execute(deleteSQL, [id]);
    console.log(msg + 'deleted', resultDelete)

    return [category]
}