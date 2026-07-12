import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { notifyRole, notifyUser } from '../services/notificationService';
import {
  buildStaffRoleFilter,
  canAccessRequete,
  getEtudiantIdForUser,
  isStaffRole,
} from '../utils/requeteAccess';

const TYPES_VALIDES = ['effet_academique', 'correction_nom', 'contestation_note'];

async function fetchRequeteDetails(requeteId: string | number) {
  const [requetes]: any = await pool.execute('SELECT * FROM requete WHERE id = ?', [requeteId]);
  if (requetes.length === 0) return null;

  const requete = requetes[0];
  let details = null;

  if (requete.type === 'effet_academique') {
    const [rows]: any = await pool.execute(
      'SELECT * FROM requete_attestation WHERE requete_id = ?',
      [requeteId]
    );
    details = rows[0];
  } else if (requete.type === 'correction_nom') {
    const [rows]: any = await pool.execute(
      'SELECT * FROM requete_correction_nom WHERE requete_id = ?',
      [requeteId]
    );
    details = rows[0];
  } else if (requete.type === 'contestation_note') {
    const [rows]: any = await pool.execute(
      'SELECT * FROM requete_note WHERE requete_id = ?',
      [requeteId]
    );
    details = rows[0];
  }

  const [historique]: any = await pool.execute(
    `SELECT h.*, u.nom, u.prenom, u.role
     FROM historique_statut h
     JOIN users u ON h.change_par = u.id
     WHERE h.requete_id = ?
     ORDER BY h.date ASC`,
    [requeteId]
  );

  const [documents]: any = await pool.execute(
    'SELECT id, nom, type, taille, uploaded_at FROM document WHERE requete_id = ?',
    [requeteId]
  );

  return { requete, details, historique, documents };
}

// POST /requetes
export const creerRequete = async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, priorite, ...details } = req.body;

  if (!TYPES_VALIDES.includes(type)) {
    res.status(400).json({ message: 'Type de requête invalide' });
    return;
  }

  try {
    const etudiantId = await getEtudiantIdForUser(req.user!.id);
    if (etudiantId === null) {
      res.status(403).json({ message: 'Accès réservé aux étudiants' });
      return;
    }

    const [result]: any = await pool.execute(
      'INSERT INTO requete (etudiant_id, type, priorite) VALUES (?, ?, ?)',
      [etudiantId, type, priorite || 'normale']
    );

    const requeteId = result.insertId;

    if (type === 'effet_academique') {
      const { type_document, annee_academique, motif } = details;
      if (!type_document || !annee_academique) {
        res.status(400).json({ message: 'type_document et annee_academique sont requis' });
        return;
      }
      await pool.execute(
        'INSERT INTO requete_attestation (requete_id, type_document, annee_academique, motif) VALUES (?, ?, ?, ?)',
        [requeteId, type_document, annee_academique, motif || null]
      );
    } else if (type === 'correction_nom') {
      const { ancien_nom, nouveau_nom, motif } = details;
      if (!ancien_nom || !nouveau_nom) {
        res.status(400).json({ message: 'ancien_nom et nouveau_nom sont requis' });
        return;
      }
      await pool.execute(
        'INSERT INTO requete_correction_nom (requete_id, ancien_nom, nouveau_nom, motif) VALUES (?, ?, ?, ?)',
        [requeteId, ancien_nom, nouveau_nom, motif || null]
      );
    } else if (type === 'contestation_note') {
      const { code_matiere, note_actuelle, note_contestee, motif_contestation, id_enseignant } =
        details;
      if (
        !code_matiere ||
        note_actuelle === undefined ||
        note_contestee === undefined ||
        !motif_contestation
      ) {
        res.status(400).json({ message: 'Champs contestation_note incomplets' });
        return;
      }
      if (motif_contestation.length < 30) {
        res.status(400).json({ message: 'Le motif doit faire au moins 30 caractères' });
        return;
      }
      await pool.execute(
        'INSERT INTO requete_note (requete_id, code_matiere, note_actuelle, note_contestee, motif_contestation, id_enseignant) VALUES (?, ?, ?, ?, ?, ?)',
        [
          requeteId,
          code_matiere,
          note_actuelle,
          note_contestee,
          motif_contestation,
          id_enseignant || null,
        ]
      );
      await pool.execute('UPDATE requete SET service_cible = ? WHERE id = ?', [
        'departement',
        requeteId,
      ]);
    }

    await pool.execute(
      'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
      [requeteId, null, 'EN_ATTENTE', req.user!.id, 'Requête soumise par l\'étudiant']
    );

    if (type === 'contestation_note') {
      await notifyRole(
        'departement',
        requeteId,
        `Nouvelle contestation de note #${requeteId} à analyser`
      );
    } else {
      await notifyRole('secretariat', requeteId, `Nouvelle requête #${requeteId} en attente`);
    }

    res.status(201).json({
      message: 'Requête créée avec succès',
      requete_id: requeteId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// GET /requetes/me
export const getMesRequetes = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  try {
    const etudiantId = await getEtudiantIdForUser(req.user!.id);
    if (etudiantId === null) {
      res.status(403).json({ message: 'Accès réservé aux étudiants' });
      return;
    }

    const [requetes]: any = await pool.execute(
      `SELECT id, type, statut, priorite, date_depot, updated_at
       FROM requete WHERE etudiant_id = ?
       ORDER BY date_depot DESC LIMIT ? OFFSET ?`,
      [etudiantId, limit, offset]
    );

    const [total]: any = await pool.execute(
      'SELECT COUNT(*) as total FROM requete WHERE etudiant_id = ?',
      [etudiantId]
    );

    res.status(200).json({
      requetes,
      pagination: {
        page,
        limit,
        total: total[0].total,
        pages: Math.ceil(total[0].total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// GET /requetes/:id
export const getRequeteById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const access = await canAccessRequete(req, String(id));
    if (!access.allowed) {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    const payload = await fetchRequeteDetails(String(id));
    if (!payload) {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    if (isStaffRole(req.user!.role)) {
      const [etudiantInfo]: any = await pool.execute(
        `SELECT e.matricule, u.nom, u.prenom, u.email
         FROM etudiant e JOIN users u ON e.user_id = u.id
         WHERE e.id = ?`,
        [payload.requete.etudiant_id]
      );
      res.status(200).json({ ...payload, etudiant: etudiantInfo[0] || null });
      return;
    }

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// PUT /requetes/:id/annuler
export const annulerRequete = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const access = await canAccessRequete(req, String(id));
    if (!access.allowed || req.user!.role !== 'etudiant') {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    const requete = access.requete!;
    if (requete.statut !== 'EN_ATTENTE') {
      res.status(400).json({ message: 'Seules les requêtes EN_ATTENTE peuvent être annulées' });
      return;
    }

    await pool.execute('UPDATE requete SET statut = ? WHERE id = ?', ['REJETEE', id]);

    await pool.execute(
      'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
      [id, 'EN_ATTENTE', 'REJETEE', req.user!.id, 'Annulée par l\'étudiant']
    );

    res.status(200).json({ message: 'Requête annulée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// PUT /requetes/:id/completer-info
export const completerInfoRequete = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { commentaire } = req.body;

  try {
    const access = await canAccessRequete(req, String(id));
    if (!access.allowed || req.user!.role !== 'etudiant') {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    const requete = access.requete!;
    if (requete.statut !== 'ATTENTE_INFO') {
      res.status(400).json({ message: 'Cette requête n\'est pas en attente d\'informations' });
      return;
    }

    await pool.execute('UPDATE requete SET statut = ? WHERE id = ?', ['EN_COURS', id]);

    await pool.execute(
      'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
      [
        id,
        'ATTENTE_INFO',
        'EN_COURS',
        req.user!.id,
        commentaire || 'Informations complétées par l\'étudiant',
      ]
    );

    const targetRole = requete.service_cible || 'secretariat';
    await notifyRole(
      targetRole,
      Number(id),
      `L'étudiant a complété le dossier #${id}`
    );

    res.status(200).json({ message: 'Dossier complété — reprise du traitement' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// GET /requetes/staff/all
export const getRequetesStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const statut = req.query.statut as string;
  const type = req.query.type as string;
  const search = (req.query.search as string)?.trim();
  const offset = (page - 1) * limit;

  try {
    const roleFilter = buildStaffRoleFilter(req.user!.role);

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
    const queryParams: unknown[] = [];

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

    const params = [...queryParams, limit, offset];
    const [requetes]: any = await pool.execute(baseQuery, params as any[]);
    const [totalRows]: any = await pool.execute(countQuery, queryParams as any[]);

    res.status(200).json({
      requetes,
      pagination: {
        page,
        limit,
        total: totalRows[0].total,
        pages: Math.ceil(totalRows[0].total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// GET /requetes/staff/stats
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roleFilter = buildStaffRoleFilter(req.user!.role);
    const whereRole = roleFilter.clause.replace(/^ AND /, 'WHERE ');

    const [statsByStatus]: any = await pool.execute(
      `SELECT r.statut, COUNT(*) as count FROM requete r ${whereRole} GROUP BY r.statut`,
      roleFilter.params as any[]
    );
    const [statsByType]: any = await pool.execute(
      `SELECT r.type, COUNT(*) as count FROM requete r ${whereRole} GROUP BY r.type`,
      roleFilter.params as any[]
    );

    const [evolution]: any = await pool.execute(
      `SELECT YEARWEEK(r.date_depot, 1) as week, COUNT(*) as total
       FROM requete r
       ${whereRole ? whereRole + ' AND' : 'WHERE'} r.date_depot >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
       GROUP BY week
       ORDER BY week ASC`,
      roleFilter.params as any[]
    );

    res.status(200).json({
      byStatus: statsByStatus,
      byType: statsByType,
      evolution,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// --- WORKFLOW TRANSITIONS ---

async function applyTransition(
  req: AuthRequest,
  res: Response,
  opts: {
    actionName: string;
    expectedStatus: string[];
    newStatus: string;
    commentaire: string;
    studentMessage: string;
    notifyRoles?: string[];
  }
): Promise<void> {
  const { id } = req.params;

  try {
    const [requetes]: any = await pool.execute('SELECT * FROM requete WHERE id = ?', [id]);
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

    await pool.execute('UPDATE requete SET statut = ? WHERE id = ?', [opts.newStatus, id]);

    await pool.execute(
      'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
      [id, requete.statut, opts.newStatus, req.user!.id, opts.commentaire]
    );

    const [etudiant]: any = await pool.execute(
      'SELECT user_id FROM etudiant WHERE id = ?',
      [requete.etudiant_id]
    );
    if (etudiant.length > 0) {
      await notifyUser(etudiant[0].user_id, Number(id), opts.studentMessage);
    }

    if (opts.notifyRoles) {
      for (const role of opts.notifyRoles) {
        await notifyRole(role, Number(id), `Requête #${id} : ${opts.commentaire}`);
      }
    }

    res.status(200).json({ message: `Requête ${opts.actionName} avec succès` });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
}

export const receptionnerRequete = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const role = req.user!.role;

  try {
    const [requetes]: any = await pool.execute('SELECT * FROM requete WHERE id = ?', [id]);
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

    await pool.execute('UPDATE requete SET statut = ? WHERE id = ?', ['EN_COURS', id]);

    await pool.execute(
      'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
      [id, 'EN_ATTENTE', 'EN_COURS', req.user!.id, 'Dossier réceptionné']
    );

    const [etudiant]: any = await pool.execute(
      'SELECT user_id FROM etudiant WHERE id = ?',
      [requete.etudiant_id]
    );
    if (etudiant.length > 0) {
      await notifyUser(
        etudiant[0].user_id,
        Number(id),
        'Votre requête a été réceptionnée et est en cours de traitement.'
      );
    }

    const nextRole =
      requete.type === 'effet_academique'
        ? 'directeur_adjoint'
        : requete.type === 'correction_nom'
          ? 'directeur'
          : 'departement';

    if (role !== nextRole) {
      await notifyRole(nextRole, Number(id), `Requête #${id} réceptionnée — traitement requis.`);
    }

    res.status(200).json({ message: 'Requête réceptionnée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const acheminerRequete = async (req: AuthRequest, res: Response): Promise<void> => {
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
      message:
        'service_cible requis : directeur_adjoint, directeur, departement, scolarite, cellule_informatique',
    });
    return;
  }

  try {
    const [requetes]: any = await pool.execute('SELECT * FROM requete WHERE id = ?', [id]);
    if (requetes.length === 0) {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    const requete = requetes[0];
    if (requete.statut !== 'EN_COURS') {
      res.status(400).json({ message: 'Acheminement possible uniquement depuis EN_COURS' });
      return;
    }

    await pool.execute(
      'UPDATE requete SET statut = ?, service_cible = ? WHERE id = ?',
      ['EN_COURS', service_cible, id]
    );

    await pool.execute(
      'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
      [
        id,
        'EN_COURS',
        'EN_COURS',
        req.user!.id,
        `Dossier acheminé vers ${service_cible}`,
      ]
    );

    const [etudiant]: any = await pool.execute(
      'SELECT user_id FROM etudiant WHERE id = ?',
      [requete.etudiant_id]
    );
    if (etudiant.length > 0) {
      await notifyUser(
        etudiant[0].user_id,
        Number(id),
        'Votre requête a été acheminée pour traitement.'
      );
    }

    await notifyRole(
      service_cible,
      Number(id),
      `Requête #${id} acheminée vers votre service`
    );

    res.status(200).json({ message: 'Requête acheminée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const validerRequete = (req: AuthRequest, res: Response) => {
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

export const rejeterRequete = (req: AuthRequest, res: Response) => {
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

export const demanderInfoRequete = (req: AuthRequest, res: Response) => {
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

export const executerRequete = (req: AuthRequest, res: Response) =>
  applyTransition(req, res, {
    actionName: 'en exécution',
    expectedStatus: ['VALIDEE'],
    newStatus: 'EN_EXECUTION',
    commentaire: 'En cours d\'exécution',
    studentMessage: 'Votre requête est en cours d\'exécution.',
  });

export const cloturerRequete = (req: AuthRequest, res: Response) => {
  const { commentaire_final } = req.body;
  return applyTransition(req, res, {
    actionName: 'clôturée',
    expectedStatus: ['EN_EXECUTION', 'VALIDEE', 'REJETEE'],
    newStatus: 'CLOTUREE',
    commentaire: commentaire_final || 'Dossier clôturé',
    studentMessage: 'Votre requête a été clôturée.',
  });
};
