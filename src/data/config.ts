const {
  DATABASE_URL,
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_HOST = 'postgres',
  DB_PORT = '5432',
  DB_NAME = 'postgres',
} = process.env;
export const databaseUrl: string =
  DATABASE_URL ?? `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
