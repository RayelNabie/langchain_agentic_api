import pool from '#data/pool.js';
import type { Source } from '#llm/types.js';
import { embeddings } from '#llm/azure.js';
import type { QueryResult } from 'pg';

export async function searchDocuments(
  query: string,
  boardId?: string,
  topK = 5,
): Promise<Source[]> {
  const vector: number[] = await embeddings.embedQuery(query);
  const result: QueryResult<Source> = await pool.query<Source>(
    `SELECT content, source FROM documents
     WHERE board_id IS NULL OR board_id = $2
     ORDER BY embedding <=> $1::vector LIMIT $3`,
    [`[${vector.join(',')}]`, boardId ?? null, topK],
  );
  return result.rows;
}
