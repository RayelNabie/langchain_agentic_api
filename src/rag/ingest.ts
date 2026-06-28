import 'dotenv/config';
import fs from 'fs';
import path from 'path';
const pdfParse = (await import('pdf-parse/lib/pdf-parse.js' as string)).default as (
  buf: Buffer,
) => Promise<{ text: string }>;
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import pg from 'pg';
import { databaseUrl } from '#data/config.js';
import { embeddings } from '#llm/azure.js';

const DOCUMENTS_DIR: string = path.join(process.cwd(), 'documents');

async function readFile(filePath: string): Promise<string> {
  if (filePath.endsWith('.pdf')) {
    const { text } = await pdfParse(fs.readFileSync(filePath));
    return text;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

async function ingest(): Promise<void> {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

  const files: string[] = fs
    .readdirSync(DOCUMENTS_DIR)
    .filter((f: string): boolean => f.endsWith('.txt') || f.endsWith('.pdf'));
  if (files.length === 0) {
    console.log(`Geen .txt of .pdf bestanden gevonden in ${DOCUMENTS_DIR}`);
    await pool.end();
    return;
  }

  for (const file of files) {
    const content: string = await readFile(path.join(DOCUMENTS_DIR, file));
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
