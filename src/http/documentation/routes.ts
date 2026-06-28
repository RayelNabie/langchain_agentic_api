import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { createRequire } from 'node:module';

// needs to parse through a require import since I somehow cannot import a json to parse
const require: NodeJS.Require = createRequire(import.meta.url);
const spec: JSON = require('./openapi.json');

const router = Router();
router.get('/api-docs.json', (_req, res) => res.json(spec));
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

export default router;
