"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const requeteRoutes_1 = __importDefault(require("./routes/requeteRoutes"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const chatbotRoutes_1 = __importDefault(require("./routes/chatbotRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/auth', authRoutes_1.default);
app.use('/requetes', requeteRoutes_1.default);
app.use('/requetes/:id/documents', documentRoutes_1.default);
app.use('/chatbot', chatbotRoutes_1.default);
app.use('/notifications', notificationRoutes_1.default);
// Route de test
app.get('/', (req, res) => {
    res.json({ message: 'JANNGO API is running 🚀' });
});
exports.default = app;
