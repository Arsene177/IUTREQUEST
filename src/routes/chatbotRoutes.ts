import { Router } from 'express';
import { handleChatMessage } from '../controllers/chatbotController';

const router = Router();

// POST /chatbot/message
router.post('/message', handleChatMessage);

export default router;
