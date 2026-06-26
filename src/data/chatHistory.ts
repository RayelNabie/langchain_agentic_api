/**
 * @file Provides Postgres-backed chat message history, shared by any
 *       LlmAdapter implementation so history storage isn't duplicated
 *       per provider.
 *
 * @module data/chatHistory
 * @author RayelNabie
 */

import { PostgresChatMessageHistory } from '@langchain/community/stores/message/postgres';
import { databaseConfig } from '#data/config.js';

export const getHistory = async (sessionId: string): Promise<PostgresChatMessageHistory> => {
  return new PostgresChatMessageHistory({
    poolConfig: {
      connectionString: databaseConfig.url,
    },
    tableName: 'chat_history',
    sessionId: sessionId,
  });
};
