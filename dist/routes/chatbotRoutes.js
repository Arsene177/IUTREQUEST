"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatbotController_1 = require("../controllers/chatbotController");
const router = (0, express_1.Router)();
// POST /chatbot/message
router.post('/message', chatbotController_1.handleChatMessage);
exports.default = router;
