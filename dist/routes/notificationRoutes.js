"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.default, notificationController_1.getNotifications);
router.get('/nb-non-lues', authMiddleware_1.default, notificationController_1.getNbNonLues);
router.put('/lu-tout', authMiddleware_1.default, notificationController_1.marquerToutesLues);
router.put('/:id/lu', authMiddleware_1.default, notificationController_1.marquerLue);
exports.default = router;
