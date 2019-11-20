import { Middleware } from '@ovotech/castle';
import { Pool, PoolClient, PoolConfig } from 'pg';

export interface DbContext {
  db: PoolClient;
}

export const createDb = (config: PoolConfig): Middleware<DbContext> => {
  const pool = new Pool(config);
  return next => async ctx => {
    const db = await pool.connect();
    try {
      await next({ ...ctx, db });
    } finally {
      db.release();
    }
  };
};
