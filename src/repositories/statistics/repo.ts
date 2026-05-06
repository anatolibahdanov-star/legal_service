import logger from "@/src/libs/logger"
import {find, findOne, queryTransactionWrapper} from '@/src/libs/db';
import {CountResult, DBStatistic} from "@/src/interfaces/db"

const msgGlobal = "REPO STATISTIC "

export async function getStatistics(page: string = '1', _limit: string = '10', _sorter: string[] = ['id', 'DESC']): Promise<DBStatistic[] | null> {
    const msg = msgGlobal + "getStatistics - "
    const orderBy = getStatisticOrder(_sorter);
    const limit = parseInt(_limit) ?? 10
    const offset = ((parseInt(page) ?? 1) - 1) * limit
    const query =  `SELECT * FROM statistic ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`;
    const params = [limit, offset]
    const findFunc = find({ query, values: params });
    const executedQueries = await queryTransactionWrapper<DBStatistic>([findFunc], msg);
    if (!executedQueries) {
        logger.error(msg + "SQL not results from execution", query)
        return null
    }
    const [[rows]] = executedQueries;
    if (rows.length === 0) return [];
    return rows
}

export async function getTotalStatistics(): Promise<number> {
    const msg = msgGlobal + "getTotalStatistics - ";
    const query =  `SELECT COUNT(id) as counter FROM statistic`;
    const calcFunc = findOne({ query, values: [] });
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

export function getStatisticOrder(orderBy:string[]): string {
    if(orderBy && orderBy.length>0) {
        const field = orderBy[0] ?? "id"
        const sorter = ["ASC", "DESC"].includes(orderBy[1])? orderBy[1] : "ASC"
        return field + ' ' + sorter
    }
    return "id DESC"
}