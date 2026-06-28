import { Router } from 'express';
import { handleUploadDocument } from '#http/documents/DocumentController.js';

const router: Router = Router();
router.post('/documents', handleUploadDocument);
export default router;
