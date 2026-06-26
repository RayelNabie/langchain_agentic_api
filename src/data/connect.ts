/**
 * @file Verifies the Postgres connection is reachable at startup.
 *
 * @module data/connect
 * @author RayelNabie
 */

import { Pool } from 'pg';
import { databaseConfig } from '#data/config.js';

export const connectDatabase: () => Promise<void> = async (): Promise<void> => {
  console.log(`[Database] Attempting connection to ${databaseConfig.safeUrl}`);

  const pool = new Pool({ connectionString: databaseConfig.url });

  try {
    await pool.query('SELECT 1');
    console.log('[Database] Connection established successfully.');
  } finally {
    await pool.end();
  }
};
