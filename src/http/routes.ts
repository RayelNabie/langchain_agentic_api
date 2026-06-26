/**
 * @file Aggregates all application routes and provides the 404 fallback.
 *
 * @module http/routes
 * @author RayelNabie
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import chatRoutes from '#http/chat/routes.js';
import swaggerRoutes from '#http/documentation/routes.js';

const appRouter: Router = Router();

appRouter.use('/', chatRoutes);
appRouter.use('/', swaggerRoutes);

/**
 * Fallback for non-existent routes
 */
appRouter.use((req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
});

export default appRouter;
