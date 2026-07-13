"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3001;
async function startServer() {
    try {
        await db_1.default.getConnection();
        console.log('Connexion MySQL établie');
        app_1.default.listen(PORT, () => {
            console.log(`Serveur JANNGO démarré sur http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Erreur connexion MySQL:', error);
        process.exit(1);
    }
}
startServer();
