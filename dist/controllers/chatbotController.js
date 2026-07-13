"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChatMessage = void 0;
const chatbot_engine_1 = require("../chatbot/chatbot-engine");
const handleChatMessage = async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        // In a real app, user ID might come from the authenticated token
        // For now, we optionally take it from the body if provided.
        const userId = req.body.userId || req.user?.id;
        if (!sessionId) {
            res.status(400).json({ error: 'sessionId is required' });
            return;
        }
        const response = await (0, chatbot_engine_1.processMessage)(sessionId, message || '', userId);
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error in chatbot controller:', error);
        res.status(500).json({ error: 'Internal server error while processing chat message' });
    }
};
exports.handleChatMessage = handleChatMessage;
