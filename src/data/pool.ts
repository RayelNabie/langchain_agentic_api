import pg from 'pg';
import { databaseUrl } from '#data/config.js';

const pool = new pg.Pool({ connectionString: databaseUrl });
export default pool;
