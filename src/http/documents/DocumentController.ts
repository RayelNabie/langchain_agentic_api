import { Request, Response } from 'express';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import pool from '#data/pool.js';
import { embeddings } from '#llm/azure.js';

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

type UploadBody = { boardId?: string; source?: string; content?: string };

export async function handleUploadDocument(
  req: Request<Record<string, string>, { chunks: number } | { error: string }, UploadBody>,
  res: Response,
): Promise<void> {
  const { boardId, source, content } = req.body;

  if (!source || !content) {
    res.status(400).json({ error: 'source and content are required' });
    return;
  }

  try {
    const chunks: string[] = await splitter.splitText(content);

    for (const chunk of chunks) {
      const vector: number[] = await embeddings.embedQuery(chunk);

      await pool.query(
        'INSERT INTO documents (board_id, source, content, embedding) VALUES ($1, $2, $3, $4::vector)',
        [boardId ?? null, source, chunk, `[${vector.join(',')}]`],
      );
    }

    res.json({ chunks: chunks.length });
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
}
