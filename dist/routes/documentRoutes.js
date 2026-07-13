"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentController_1 = require("../controllers/documentController");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const multer_1 = __importDefault(require("../config/multer"));
const router = (0, express_1.Router)({ mergeParams: true });
router.post('/', authMiddleware_1.default, multer_1.default.array('documents', 10), documentController_1.uploadDocument);
router.get('/:docId', authMiddleware_1.default, documentController_1.telechargerDocument);
exports.default = router;
