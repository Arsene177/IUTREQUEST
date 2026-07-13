"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyUser = notifyUser;
exports.notifyRole = notifyRole;
const db_1 = __importDefault(require("../config/db"));
async function notifyUser(userId, requeteId, message) {
    await db_1.default.execute('INSERT INTO notification (user_id, requete_id, message) VALUES (?, ?, ?)', [userId, requeteId, message]);
}
/** Notifie tous les users d'un rôle donné */
async function notifyRole(role, requeteId, message) {
    const [users] = await db_1.default.execute('SELECT id FROM users WHERE role = ?', [role]);
    for (const u of users) {
        await notifyUser(u.id, requeteId, message);
    }
}
