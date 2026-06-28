import 'dotenv/config';
import express, { type Express } from 'express';
import type { Request, Response } from 'express';
import chatRoutes from '#http/chat/routes.js';
import docRoutes from '#http/documentation/routes.js';
import documentRoutes from '#http/documents/routes.js';
import pool from '#data/pool.js';

const app: Express = express();
const port: number = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', chatRoutes);
app.use('/', documentRoutes);
app.use('/', docRoutes);
app.use((_req: Request, res: Response) => res.status(404).json({ error: 'Route not found' }));

try {
  await pool.query('SELECT 1');
  const server = app.listen(port, (err?: Error): void => {
    if (err) {
      console.error(`Failed to start: ${err.message}`);
      process.exit(1);
    }
  });
  server.on('error', (err: Error): void => console.error(`Server error: ${err.message}`));
} catch (err: unknown) {
  console.error(err instanceof Error ? err.stack : err);
  process.exit(1);
}
