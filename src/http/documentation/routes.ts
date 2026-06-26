/**
 * @file Mounts the Swagger UI and the raw OpenAPI JSON document.
 *
 * @module http/documentation/routes
 * @author RayelNabie
 */

import { Router, type Request, type Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '#http/documentation/spec.js';

const router: Router = Router();

router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

router.get('/api-docs.json', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export default router;
