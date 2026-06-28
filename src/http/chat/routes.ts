import { Router } from 'express';
import { handleChat } from '#http/chat/ChatController.js';

const router: Router = Router();
router.post('/chat', handleChat);
export default router;
