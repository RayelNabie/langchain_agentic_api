/**
 * @file Application entry point. Configures the Express app and middleware,
 *       and starts the HTTP server after establishing the database
 *       connection.
 *
 * @module server
 * @author RayelNabie
 */

import 'dotenv/config';
import express from 'express';
import type { Express } from 'express';
import type { Server } from 'node:http';
import appRouter from '#http/routes.js';
import { connectDatabase } from '#data/connect.js';

const app: Express = express();
const port: number = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', appRouter);

const bootstrap = async (): Promise<void> => {
  try {
    await connectDatabase();
    const server: Server = app.listen(port, (err?: Error): void => {
      if (err) {
        console.error(`Failed to start: ${err.message}`);
        process.exit(1);
      }
    });

    server.on('error', (err: Error): void => {
      console.error(`Server error: ${err.message}`);
      console.error(err.stack);
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.stack);
    } else {
      console.error('Server startup failed with an unknown error:', err);
    }
    process.exit(1);
  }
};

// Skip auto-bootstrap when testing so Vitest can import the app.
if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}

export default app;
