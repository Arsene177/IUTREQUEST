"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.marquerToutesLues = exports.marquerLue = exports.getNbNonLues = exports.getNotifications = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET /notifications
const getNotifications = async (req, res) => {
    try {
        const [rows] = await db_1.default.execute(`SELECT id, message, date_envoie, lu, requete_id
       FROM notification
       WHERE user_id = ?
       ORDER BY date_envoie DESC
       LIMIT 100`, [req.user.id]);
        res.status(200).json({ notifications: rows });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.getNotifications = getNotifications;
// GET /notifications/nb-non-lues
const getNbNonLues = async (req, res) => {
    try {
        const [rows] = await db_1.default.execute('SELECT COUNT(*) as nb FROM notification WHERE user_id = ? AND lu = FALSE', [req.user.id]);
        res.status(200).json({ nb: rows[0].nb });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.getNbNonLues = getNbNonLues;
// PUT /notifications/:id/lu
const marquerLue = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db_1.default.execute('UPDATE notification SET lu = TRUE WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Notification introuvable' });
            return;
        }
        res.status(200).json({ message: 'Notification marquée comme lue' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.marquerLue = marquerLue;
// PUT /notifications/lu-tout
const marquerToutesLues = async (req, res) => {
    try {
        await db_1.default.execute('UPDATE notification SET lu = TRUE WHERE user_id = ? AND lu = FALSE', [
            req.user.id,
        ]);
        res.status(200).json({ message: 'Toutes les notifications ont été marquées comme lues' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.marquerToutesLues = marquerToutesLues;
