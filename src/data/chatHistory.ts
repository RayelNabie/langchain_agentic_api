import { PostgresChatMessageHistory } from '@langchain/community/stores/message/postgres';
import { databaseUrl } from '#data/config.js';
import pool from '#data/pool.js';
import { ToolCallStatus } from '#llm/types.js';

export const getHistory = async (sessionId: string): Promise<PostgresChatMessageHistory> =>
  new PostgresChatMessageHistory({
    poolConfig: { connectionString: databaseUrl },
    tableName: 'chat_history',
    sessionId,
  });

export async function logToolCall(
  sessionId: string,
  toolName: string,
  input: unknown,
  output: string,
  status: ToolCallStatus,
): Promise<void> {
  await pool.query(
    'INSERT INTO tool_logs (session_id, tool_name, input, output, status) VALUES ($1, $2, $3, $4, $5)',
    [sessionId, toolName, JSON.stringify(input), output, status],
  );
}
