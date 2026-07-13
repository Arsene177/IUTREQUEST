"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloturerRequete = exports.executerRequete = exports.demanderInfoRequete = exports.rejeterRequete = exports.validerRequete = exports.acheminerRequete = exports.receptionnerRequete = exports.getStats = exports.getRequetesStaff = exports.completerInfoRequete = exports.annulerRequete = exports.getRequeteById = exports.getMesRequetes = exports.creerRequete = void 0;
const db_1 = __importDefault(require("../config/db"));
const notificationService_1 = require("../services/notificationService");
const requeteAccess_1 = require("../utils/requeteAccess");
const TYPES_VALIDES = ['effet_academique', 'correction_nom', 'contestation_note'];
async function fetchRequeteDetails(requeteId) {
    const [requetes] = await db_1.default.execute('SELECT * FROM requete WHERE id = ?', [requeteId]);
    if (requetes.length === 0)
        return null;
    const requete = requetes[0];
    let details = null;
    if (requete.type === 'effet_academique') {
        const [rows] = await db_1.default.execute('SELECT * FROM requete_attestation WHERE requete_id = ?', [requeteId]);
        details = rows[0];
    }
    else if (requete.type === 'correction_nom') {
        const [rows] = await db_1.default.execute('SELECT * FROM requete_correction_nom WHERE requete_id = ?', [requeteId]);
        details = rows[0];
    }
    else if (requete.type === 'contestation_note') {
        const [rows] = await db_1.default.execute('SELECT * FROM requete_note WHERE requete_id = ?', [requeteId]);
        details = rows[0];
    }
    const [historique] = await db_1.default.execute(`SELECT h.*, u.nom, u.prenom, u.role
     FROM historique_statut h
     JOIN users u ON h.change_par = u.id
     WHERE h.requete_id = ?
     ORDER BY h.date ASC`, [requeteId]);
    const [documents] = await db_1.default.execute('SELECT id, nom, type, taille, uploaded_at FROM document WHERE requete_id = ?', [requeteId]);
    return { requete, details, historique, documents };
}
// POST /requetes
const creerRequete = async (req, res) => {
    const { type, priorite, ...details } = req.body;
    if (!TYPES_VALIDES.includes(type)) {
        res.status(400).json({ message: 'Type de requête invalide' });
        return;
    }
    try {
        const etudiantId = await (0, requeteAccess_1.getEtudiantIdForUser)(req.user.id);
        if (etudiantId === null) {
            res.status(403).json({ message: 'Accès réservé aux étudiants' });
            return;
        }
        const [result] = await db_1.default.execute('INSERT INTO requete (etudiant_id, type, priorite) VALUES (?, ?, ?)', [etudiantId, type, priorite || 'normale']);
        const requeteId = result.insertId;
        if (type === 'effet_academique') {
            const { type_document, annee_academique, motif } = details;
            if (!type_document || !annee_academique) {
                res.status(400).json({ message: 'type_document et annee_academique sont requis' });
                return;
            }
            await db_1.default.execute('INSERT INTO requete_attestation (requete_id, type_document, annee_academique, motif) VALUES (?, ?, ?, ?)', [requeteId, type_document, annee_academique, motif || null]);
        }
        else if (type === 'correction_nom') {
            const { ancien_nom, nouveau_nom, motif } = details;
            if (!ancien_nom || !nouveau_nom) {
                res.status(400).json({ message: 'ancien_nom et nouveau_nom sont requis' });
                return;
            }
            await db_1.default.execute('INSERT INTO requete_correction_nom (requete_id, ancien_nom, nouveau_nom, motif) VALUES (?, ?, ?, ?)', [requeteId, ancien_nom, nouveau_nom, motif || null]);
        }
        else if (type === 'contestation_note') {
            const { code_matiere, note_actuelle, note_contestee, motif_contestation, id_enseignant } = details;
            if (!code_matiere ||
                note_actuelle === undefined ||
                note_contestee === undefined ||
                !motif_contestation) {
                res.status(400).json({ message: 'Champs contestation_note incomplets' });
                return;
            }
            if (motif_contestation.length < 30) {
                res.status(400).json({ message: 'Le motif doit faire au moins 30 caractères' });
                return;
            }
            await db_1.default.execute('INSERT INTO requete_note (requete_id, code_matiere, note_actuelle, note_contestee, motif_contestation, id_enseignant) VALUES (?, ?, ?, ?, ?, ?)', [
                requeteId,
                code_matiere,
                note_actuelle,
                note_contestee,
                motif_contestation,
                id_enseignant || null,
            ]);
            await db_1.default.execute('UPDATE requete SET service_cible = ? WHERE id = ?', [
                'departement',
                requeteId,
            ]);
        }
        await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [requeteId, null, 'EN_ATTENTE', req.user.id, 'Requête soumise par l\'étudiant']);
        if (type === 'contestation_note') {
            await (0, notificationService_1.notifyRole)('departement', requeteId, `Nouvelle contestation de note #${requeteId} à analyser`);
        }
        else {
            await (0, notificationService_1.notifyRole)('secretariat', requeteId, `Nouvelle requête #${requeteId} en attente`);
        }
        res.status(201).json({
            message: 'Requête créée avec succès',
            requete_id: requeteId,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.creerRequete = creerRequete;
// GET /requetes/me
const getMesRequetes = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    try {
        const etudiantId = await (0, requeteAccess_1.getEtudiantIdForUser)(req.user.id);
        if (etudiantId === null) {
            res.status(403).json({ message: 'Accès réservé aux étudiants' });
            return;
        }
        const [requetes] = await db_1.default.execute(`SELECT id, type, statut, priorite, date_depot, updated_at
       FROM requete WHERE etudiant_id = ?
       ORDER BY date_depot DESC LIMIT ? OFFSET ?`, [etudiantId, Number(limit), Number(offset)]);
        const [total] = await db_1.default.execute('SELECT COUNT(*) as total FROM requete WHERE etudiant_id = ?', [etudiantId]);
        res.status(200).json({
            requetes,
            pagination: {
                page,
                limit,
                total: total[0].total,
                pages: Math.ceil(total[0].total / limit),
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.getMesRequetes = getMesRequetes;
// GET /requetes/:id
const getRequeteById = async (req, res) => {
    const { id } = req.params;
    try {
        const access = await (0, requeteAccess_1.canAccessRequete)(req, String(id));
        if (!access.allowed) {
            res.status(404).json({ message: 'Requête introuvable' });
            return;
        }
        const payload = await fetchRequeteDetails(String(id));
        if (!payload) {
            res.status(404).json({ message: 'Requête introuvable' });
            return;
        }
        if ((0, requeteAccess_1.isStaffRole)(req.user.role)) {
            const [etudiantInfo] = await db_1.default.execute(`SELECT e.matricule, u.nom, u.prenom, u.email
         FROM etudiant e JOIN users u ON e.user_id = u.id
         WHERE e.id = ?`, [payload.requete.etudiant_id]);
            res.status(200).json({ ...payload, etudiant: etudiantInfo[0] || null });
            return;
        }
        res.status(200).json(payload);
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.getRequeteById = getRequeteById;
// PUT /requetes/:id/annuler
const annulerRequete = async (req, res) => {
    const { id } = req.params;
    try {
        const access = await (0, requeteAccess_1.canAccessRequete)(req, String(id));
        if (!access.allowed || req.user.role !== 'etudiant') {
            res.status(404).json({ message: 'Requête introuvable' });
            return;
        }
        const requete = access.requete;
        if (requete.statut !== 'EN_ATTENTE') {
            res.status(400).json({ message: 'Seules les requêtes EN_ATTENTE peuvent être annulées' });
            return;
        }
        await db_1.default.execute('UPDATE requete SET statut = ? WHERE id = ?', ['REJETEE', id]);
        await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [id, 'EN_ATTENTE', 'REJETEE', req.user.id, 'Annulée par l\'étudiant']);
        res.status(200).json({ message: 'Requête annulée avec succès' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.annulerRequete = annulerRequete;
// PUT /requetes/:id/completer-info
const completerInfoRequete = async (req, res) => {
    const { id } = req.params;
    const { commentaire } = req.body;
    try {
        const access = await (0, requeteAccess_1.canAccessRequete)(req, String(id));
        if (!access.allowed || req.user.role !== 'etudiant') {
            res.status(404).json({ message: 'Requête introuvable' });
            return;
        }
        const requete = access.requete;
        if (requete.statut !== 'ATTENTE_INFO') {
            res.status(400).json({ message: 'Cette requête n\'est pas en attente d\'informations' });
            return;
        }
        await db_1.default.execute('UPDATE requete SET statut = ? WHERE id = ?', ['EN_COURS', id]);
        await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [
            id,
            'ATTENTE_INFO',
            'EN_COURS',
            req.user.id,
            commentaire || 'Informations complétées par l\'étudiant',
        ]);
        const targetRole = requete.service_cible || 'secretariat';
        await (0, notificationService_1.notifyRole)(targetRole, Number(id), `L'étudiant a complété le dossier #${id}`);
        res.status(200).json({ message: 'Dossier complété — reprise du traitement' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.completerInfoRequete = completerInfoRequete;
// GET /requetes/staff/all
const getRequetesStaff = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const statut = req.query.statut;
    const type = req.query.type;
    const search = req.query.search?.trim();
    const offset = (page - 1) * limit;
    try {
        const roleFilter = (0, requeteAccess_1.buildStaffRoleFilter)(req.user.role);
        let baseQuery = `
      SELECT r.id, r.type, r.statut, r.priorite, r.date_depot, r.updated_at,
             e.matricule, u.nom as etudiant_nom, u.prenom as etudiant_prenom
      FROM requete r
      JOIN etudiant e ON r.etudiant_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
        let countQuery = `
      SELECT COUNT(*) as total
      FROM requete r
      JOIN etudiant e ON r.etudiant_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
        const queryParams = [];
        baseQuery += roleFilter.clause;
        countQuery += roleFilter.clause;
        queryParams.push(...roleFilter.params);
        if (statut) {
            baseQuery += ' AND r.statut = ?';
            countQuery += ' AND r.statut = ?';
            queryParams.push(statut);
        }
        if (type) {
            baseQuery += ' AND r.type = ?';
            countQuery += ' AND r.type = ?';
            queryParams.push(type);
        }
        if (search) {
            baseQuery += ' AND (r.id = ? OR u.nom LIKE ? OR u.prenom LIKE ? OR e.matricule LIKE ?)';
            countQuery += ' AND (r.id = ? OR u.nom LIKE ? OR u.prenom LIKE ? OR e.matricule LIKE ?)';
            const like = `%${search}%`;
            const idSearch = Number(search) || 0;
            queryParams.push(idSearch, like, like, like);
        }
        baseQuery += ' ORDER BY r.date_depot DESC LIMIT ? OFFSET ?';
        const params = [...queryParams, Number(limit), Number(offset)];
        const [requetes] = await db_1.default.execute(baseQuery, params);
        const [totalRows] = await db_1.default.execute(countQuery, queryParams);
        res.status(200).json({
            requetes,
            pagination: {
                page,
                limit,
                total: totalRows[0].total,
                pages: Math.ceil(totalRows[0].total / limit),
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.getRequetesStaff = getRequetesStaff;
// GET /requetes/staff/stats
const getStats = async (req, res) => {
    try {
        const roleFilter = (0, requeteAccess_1.buildStaffRoleFilter)(req.user.role);
        const whereRole = roleFilter.clause.replace(/^ AND /, 'WHERE ');
        const [statsByStatus] = await db_1.default.execute(`SELECT r.statut, COUNT(*) as count FROM requete r ${whereRole} GROUP BY r.statut`, roleFilter.params);
        const [statsByType] = await db_1.default.execute(`SELECT r.type, COUNT(*) as count FROM requete r ${whereRole} GROUP BY r.type`, roleFilter.params);
        const [evolution] = await db_1.default.execute(`SELECT YEARWEEK(r.date_depot, 1) as week, COUNT(*) as total
       FROM requete r
       ${whereRole ? whereRole + ' AND' : 'WHERE'} r.date_depot >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
       GROUP BY week
       ORDER BY week ASC`, roleFilter.params);
        res.status(200).json({
            byStatus: statsByStatus,
            byType: statsByType,
            evolution,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.getStats = getStats;
// --- WORKFLOW TRANSITIONS ---
async function applyTransition(req, res, opts) {
    const { id } = req.params;
    try {
        const [requetes] = await db_1.default.execute('SELECT * FROM requete WHERE id = ?', [id]);
        if (requetes.length === 0) {
            res.status(404).json({ message: 'Requête introuvable' });
            return;
        }
        const requete = requetes[0];
        if (!opts.expectedStatus.includes(requete.statut)) {
            res.status(400).json({
                message: `Action '${opts.actionName}' non valide pour le statut '${requete.statut}'`,
            });
            return;
        }
        await db_1.default.execute('UPDATE requete SET statut = ? WHERE id = ?', [opts.newStatus, id]);
        await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [id, requete.statut, opts.newStatus, req.user.id, opts.commentaire]);
        const [etudiant] = await db_1.default.execute('SELECT user_id FROM etudiant WHERE id = ?', [requete.etudiant_id]);
        if (etudiant.length > 0) {
            await (0, notificationService_1.notifyUser)(etudiant[0].user_id, Number(id), opts.studentMessage);
        }
        if (opts.notifyRoles) {
            for (const role of opts.notifyRoles) {
                await (0, notificationService_1.notifyRole)(role, Number(id), `Requête #${id} : ${opts.commentaire}`);
            }
        }
        res.status(200).json({ message: `Requête ${opts.actionName} avec succès` });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
}
const receptionnerRequete = async (req, res) => {
    const { id } = req.params;
    const role = req.user.role;
    try {
        const [requetes] = await db_1.default.execute('SELECT * FROM requete WHERE id = ?', [id]);
        if (requetes.length === 0) {
            res.status(404).json({ message: 'Requête introuvable' });
            return;
        }
        const requete = requetes[0];
        if (requete.statut !== 'EN_ATTENTE') {
            res.status(400).json({ message: 'Réception possible uniquement depuis EN_ATTENTE' });
            return;
        }
        if (role === 'departement' && requete.type !== 'contestation_note') {
            res.status(403).json({ message: 'Le département ne réceptionne que les contestations de note' });
            return;
        }
        await db_1.default.execute('UPDATE requete SET statut = ? WHERE id = ?', ['EN_COURS', id]);
        await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [id, 'EN_ATTENTE', 'EN_COURS', req.user.id, 'Dossier réceptionné']);
        const [etudiant] = await db_1.default.execute('SELECT user_id FROM etudiant WHERE id = ?', [requete.etudiant_id]);
        if (etudiant.length > 0) {
            await (0, notificationService_1.notifyUser)(etudiant[0].user_id, Number(id), 'Votre requête a été réceptionnée et est en cours de traitement.');
        }
        const nextRole = requete.type === 'effet_academique'
            ? 'directeur_adjoint'
            : requete.type === 'correction_nom'
                ? 'directeur'
                : 'departement';
        if (role !== nextRole) {
            await (0, notificationService_1.notifyRole)(nextRole, Number(id), `Requête #${id} réceptionnée — traitement requis.`);
        }
        res.status(200).json({ message: 'Requête réceptionnée avec succès' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.receptionnerRequete = receptionnerRequete;
const acheminerRequete = async (req, res) => {
    const { id } = req.params;
    const { service_cible } = req.body;
    const validCibles = [
        'directeur_adjoint',
        'directeur',
        'departement',
        'scolarite',
        'cellule_informatique',
    ];
    if (!service_cible || !validCibles.includes(service_cible)) {
        res.status(400).json({
            message: 'service_cible requis : directeur_adjoint, directeur, departement, scolarite, cellule_informatique',
        });
        return;
    }
    try {
        const [requetes] = await db_1.default.execute('SELECT * FROM requete WHERE id = ?', [id]);
        if (requetes.length === 0) {
            res.status(404).json({ message: 'Requête introuvable' });
            return;
        }
        const requete = requetes[0];
        if (requete.statut !== 'EN_COURS') {
            res.status(400).json({ message: 'Acheminement possible uniquement depuis EN_COURS' });
            return;
        }
        await db_1.default.execute('UPDATE requete SET statut = ?, service_cible = ? WHERE id = ?', ['EN_COURS', service_cible, id]);
        await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [
            id,
            'EN_COURS',
            'EN_COURS',
            req.user.id,
            `Dossier acheminé vers ${service_cible}`,
        ]);
        const [etudiant] = await db_1.default.execute('SELECT user_id FROM etudiant WHERE id = ?', [requete.etudiant_id]);
        if (etudiant.length > 0) {
            await (0, notificationService_1.notifyUser)(etudiant[0].user_id, Number(id), 'Votre requête a été acheminée pour traitement.');
        }
        await (0, notificationService_1.notifyRole)(service_cible, Number(id), `Requête #${id} acheminée vers votre service`);
        res.status(200).json({ message: 'Requête acheminée avec succès' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.acheminerRequete = acheminerRequete;
const validerRequete = (req, res) => {
    const { commentaire } = req.body;
    return applyTransition(req, res, {
        actionName: 'validée',
        expectedStatus: ['EN_COURS', 'ATTENTE_INFO'],
        newStatus: 'VALIDEE',
        commentaire: commentaire || 'Dossier validé',
        studentMessage: 'Votre requête a été validée.',
        notifyRoles: ['scolarite', 'cellule_informatique'],
    });
};
exports.validerRequete = validerRequete;
const rejeterRequete = (req, res) => {
    const { motif } = req.body;
    if (!motif || String(motif).trim().length < 5) {
        res.status(400).json({ message: 'Le motif du rejet est requis (min. 5 caractères)' });
        return;
    }
    return applyTransition(req, res, {
        actionName: 'rejetée',
        expectedStatus: ['EN_COURS', 'ATTENTE_INFO'],
        newStatus: 'REJETEE',
        commentaire: `Rejet : ${motif}`,
        studentMessage: `Votre requête a été rejetée : ${motif}`,
    });
};
exports.rejeterRequete = rejeterRequete;
const demanderInfoRequete = (req, res) => {
    const { info_requise } = req.body;
    if (!info_requise || String(info_requise).trim().length < 5) {
        res.status(400).json({ message: 'info_requise est requise (min. 5 caractères)' });
        return;
    }
    return applyTransition(req, res, {
        actionName: 'demande info',
        expectedStatus: ['EN_COURS'],
        newStatus: 'ATTENTE_INFO',
        commentaire: `Information requise : ${info_requise}`,
        studentMessage: `Des informations sont requises : ${info_requise}`,
    });
};
exports.demanderInfoRequete = demanderInfoRequete;
const executerRequete = (req, res) => applyTransition(req, res, {
    actionName: 'en exécution',
    expectedStatus: ['VALIDEE'],
    newStatus: 'EN_EXECUTION',
    commentaire: 'En cours d\'exécution',
    studentMessage: 'Votre requête est en cours d\'exécution.',
});
exports.executerRequete = executerRequete;
const cloturerRequete = (req, res) => {
    const { commentaire_final } = req.body;
    return applyTransition(req, res, {
        actionName: 'clôturée',
        expectedStatus: ['EN_EXECUTION', 'VALIDEE', 'REJETEE'],
        newStatus: 'CLOTUREE',
        commentaire: commentaire_final || 'Dossier clôturé',
        studentMessage: 'Votre requête a été clôturée.',
    });
};
exports.cloturerRequete = cloturerRequete;
