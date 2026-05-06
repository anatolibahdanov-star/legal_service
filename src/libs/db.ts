import mysql from 'mysql2/promise';
import type { PoolConnection, RowDataPacket, OkPacket, ResultSetHeader, FieldPacket } from "mysql2/promise";
import logger from "@/src/libs/logger"

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT ?? '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

type dbDefaults =
  | RowDataPacket[]
  | RowDataPacket[][]
  | OkPacket
  | OkPacket[]
  | ResultSetHeader;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = { query: string; values?: any[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryFunction<T = any> = () => Promise<[T & dbDefaults, FieldPacket[]]>;

type AlwaysArray<T> = T extends (infer R)[] ? R[] : T[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryTransactionWrapper<T = any>(
  queries: QueryFunction[],
  msg: string
): Promise<[AlwaysArray<T>, FieldPacket[]][] | undefined> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // await conn.query("START TRANSACTION;");

    const executedQueries = await Promise.all(
      queries.map((query) => {
        return query();
      })
    );

    // await conn.query("COMMIT;");
    await conn.commit();
    return executedQueries;
  } catch (error) {
    logger.error(msg + '', error);
    await conn.rollback();
  } finally {
    conn.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeTransactionWrapper<T = any>(queries: QueryFunction[], msg: string): Promise<[T, FieldPacket[]][] | undefined> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // await conn.query("START TRANSACTION;");

    const executedQueries = await Promise.all(
      queries.map((query) => {
        return query();
      })
    );

    // await conn.query("COMMIT;");
    await conn.commit();
    return executedQueries;
  } catch (error) {
    logger.error(msg + 'Transaction failed, rolled back', error);
    await conn.rollback();
  } finally {
    conn.release();
  }
}

export function findOne({ query, values }: Query) {
  return function () {
    return pool.query<RowDataPacket[]>(query, values);
  };
}

export function find({ query, values }: Query) {
  return function () {
    return pool.query<RowDataPacket[]>(query, values);
  };
}

export function update({ query, values }: Query) {
  return function () {
    return pool.query<ResultSetHeader>(query, values);
  };
}

export function insert({ query, values }: Query) {
  return function () {
    return pool.query<ResultSetHeader>(query, values);
  };
}

export function remove({ query, values }: Query) {
  return function () {
    return pool.query<ResultSetHeader>(query, values);
  };
}

export default pool;