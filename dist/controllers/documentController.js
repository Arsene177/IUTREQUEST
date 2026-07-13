"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telechargerDocument = exports.uploadDocument = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = __importDefault(require("../config/db"));
const notificationService_1 = require("../services/notificationService");
const STAFF_ROLES = [
    'secretariat',
    'directeur',
    'directeur_adjoint',
    'departement',
    'scolarite',
    'cellule_informatique',
];
async function canAccessRequete(requeteId, userId, role) {
    const [requetes] = await db_1.default.execute('SELECT * FROM requete WHERE id = ?', [requeteId]);
    if (requetes.length === 0)
        return { ok: false };
    const requete = requetes[0];
    if (role === 'etudiant') {
        const [etudiant] = await db_1.default.execute('SELECT id FROM etudiant WHERE user_id = ? AND id = ?', [userId, requete.etudiant_id]);
        return { ok: etudiant.length > 0, requete };
    }
    if (STAFF_ROLES.includes(role)) {
        return { ok: true, requete };
    }
    return { ok: false };
}
// POST /requetes/:id/documents
const uploadDocument = async (req, res) => {
    const { id } = req.params;
    try {
        const access = await canAccessRequete(String(id), req.user.id, req.user.role);
        if (!access.ok || !access.requete) {
            res.status(404).json({ message: 'Requête introuvable' });
            return;
        }
        if (req.user.role !== 'etudiant') {
            res.status(403).json({ message: 'Seuls les étudiants peuvent joindre des documents' });
            return;
        }
        if (!req.files || req.files.length === 0) {
            res.status(400).json({ message: 'Aucun fichier uploadé' });
            return;
        }
        const requete = access.requete;
        const files = req.files;
        const documentsInseres = [];
        for (const file of files) {
            const [result] = await db_1.default.execute('INSERT INTO document (requete_id, nom, type, taille, chemin) VALUES (?, ?, ?, ?, ?)', [id, file.originalname, file.mimetype, file.size, file.path]);
            documentsInseres.push({
                id: result.insertId,
                nom: file.originalname,
                type: file.mimetype,
                taille: file.size,
            });
        }
        if (requete.statut === 'ATTENTE_INFO') {
            await db_1.default.execute('UPDATE requete SET statut = ? WHERE id = ?', ['EN_COURS', id]);
            await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [
                id,
                'ATTENTE_INFO',
                'EN_COURS',
                req.user.id,
                'Pièces complémentaires fournies par l\'étudiant',
            ]);
            await (0, notificationService_1.notifyRole)('secretariat', Number(id), `Requête #${id} : dossier complété par l'étudiant.`);
        }
        res.status(201).json({
            message: 'Documents uploadés avec succès',
            documents: documentsInseres,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.uploadDocument = uploadDocument;
// GET /requetes/:id/documents/:docId
const telechargerDocument = async (req, res) => {
    const { id, docId } = req.params;
    try {
        const access = await canAccessRequete(String(id), req.user.id, req.user.role);
        if (!access.ok) {
            res.status(404).json({ message: 'Requête introuvable' });
            return;
        }
        const [docs] = await db_1.default.execute('SELECT * FROM document WHERE id = ? AND requete_id = ?', [docId, id]);
        if (docs.length === 0) {
            res.status(404).json({ message: 'Document introuvable' });
            return;
        }
        const doc = docs[0];
        const filePath = path_1.default.resolve(doc.chemin);
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({ message: 'Fichier introuvable sur le serveur' });
            return;
        }
        res.download(filePath, doc.nom);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.telechargerDocument = telechargerDocument;
