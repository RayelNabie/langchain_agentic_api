/**
 * @file Postgres connection configuration, derived from environment
 *       variables.
 *
 * @module data/config
 * @author RayelNabie
 */

import type { DatabaseConfig } from '#data/types.js';

export const databaseConfig: DatabaseConfig = {
  get url(): string {
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }

    const user: string = process.env.DB_USER ?? 'postgres';
    const password: string = process.env.DB_PASSWORD ?? 'postgres';
    const host: string = process.env.DB_HOST ?? 'postgres';
    const port: string = process.env.DB_PORT ?? '5432';
    const name: string = process.env.DB_NAME ?? 'postgres';

    return `postgresql://${user}:${password}@${host}:${port}/${name}?schema=public`;
  },

  get safeUrl(): string {
    try {
      const url = new URL(this.url);
      return `${url.protocol}//${url.username}:****@${url.host}${url.pathname}${url.search}`;
    } catch {
      return this.url.replace(/:([^@]+)@/, ':****@');
    }
  },
};
