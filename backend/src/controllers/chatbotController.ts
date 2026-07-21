import { Request, Response } from 'express';
import { processMessage } from '../chatbot/chatbot-engine';

export const handleChatMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, message } = req.body;
    console.log('[chatbot] reçu - sessionId:', sessionId, 'message:', JSON.stringify(message));

    // In a real app, user ID might come from the authenticated token
    // For now, we optionally take it from the body if provided.
    const userId = req.body.userId || (req as any).user?.id;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const response = await processMessage(sessionId, message || '', userId);
    console.log('[chatbot] réponse:', JSON.stringify(response).substring(0, 100));

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in chatbot controller:', error);
    res.status(500).json({ error: 'Internal server error while processing chat message' });
  }
};
