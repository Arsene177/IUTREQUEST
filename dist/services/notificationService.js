"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyUser = notifyUser;
exports.notifyRole = notifyRole;
const db_1 = __importDefault(require("../config/db"));
const ROLE_LABELS = {
    secretariat: 'Secrétariat',
    directeur_adjoint: 'Directeur Adjoint',
    directeur: 'Directeur',
    departement: 'Département',
    cellule_informatique: 'Cellule Informatique',
    scolarite: 'Scolarité',
};
/**
 * Notifie un étudiant. Si `agent` est fourni, le message est complété avec
 * l'identité de l'agent, son rôle et la date/heure de l'action :
 * "<message> par <prénom> <nom> (<rôle>) le <date> à <heure><extra ?? '.'>"
 * `extra` permet de contrôler exactement la ponctuation/le contenu final
 * (ex: ". Motif : ..." pour un rejet, ou " : ..." pour une demande d'info).
 */
async function notifyUser(userId, requeteId, message, agent, extra) {
    let finalMessage = message;
    if (agent) {
        const roleLabel = ROLE_LABELS[agent.role] ?? agent.role;
        const now = new Date();
        const date = now.toLocaleDateString('fr-FR');
        const heure = now
            .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            .replace(':', 'h');
        finalMessage = `${message} par ${agent.prenom} ${agent.nom} (${roleLabel}) le ${date} à ${heure}${extra ?? '.'}`;
    }
    await db_1.default.execute('INSERT INTO notification (user_id, requete_id, message) VALUES (?, ?, ?)', [userId, requeteId, finalMessage]);
}
/** Notifie tous les users d'un rôle donné */
async function notifyRole(role, requeteId, message) {
    const [users] = await db_1.default.execute('SELECT id FROM users WHERE role = ?', [role]);
    for (const u of users) {
        await notifyUser(u.id, requeteId, message);
    }
}
