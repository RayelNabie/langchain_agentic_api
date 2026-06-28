import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import pg from 'pg';
import { databaseUrl } from '#data/config.js';
import { embeddings } from '#llm/azure.js';

const DOCUMENTS_DIR: string = path.join(process.cwd(), 'documents');

async function ingest(): Promise<void> {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

  const files: string[] = fs
    .readdirSync(DOCUMENTS_DIR)
    .filter((f: string): boolean => f.endsWith('.txt'));
  if (files.length === 0) {
    console.log(`Geen .txt bestanden gevonden in ${DOCUMENTS_DIR}`);
    await pool.end();
    return;
  }

  for (const file of files) {
    const content: string = fs.readFileSync(path.join(DOCUMENTS_DIR, file), 'utf-8');
    const chunks: string[] = await splitter.splitText(content);

    for (const chunk of chunks) {
      const vector: number[] = await embeddings.embedQuery(chunk);
      await pool.query(
        'INSERT INTO documents (source, content, embedding) VALUES ($1, $2, $3::vector)',
        [file, chunk, `[${vector.join(',')}]`],
      );
    }

    console.log(`${file} — ${chunks.length} chunks opgeslagen`);
  }

  console.log('Ingest klaar.');
  await pool.end();
}

ingest().catch((err): never => {
  console.error('Ingest mislukt:', err);
  process.exit(1);
});
