import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

// POST /requetes
export const creerRequete = async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, priorite, ...details } = req.body;

  const typesValides = ['effet_academique', 'correction_nom', 'contestation_note'];
  if (!typesValides.includes(type)) {
    res.status(400).json({ message: 'Type de requête invalide' });
    return;
  }

  try {
    const [etudiant]: any = await pool.execute(
      'SELECT id FROM etudiant WHERE user_id = ?',
      [req.user!.id]
    );

    if (etudiant.length === 0) {
      res.status(403).json({ message: 'Accès réservé aux étudiants' });
      return;
    }

    const etudiantId = etudiant[0].id;

    const [result]: any = await pool.execute(
      'INSERT INTO requete (etudiant_id, type, priorite) VALUES (?, ?, ?)',
      [etudiantId, type, priorite || 'normale']
    );

    const requeteId = result.insertId;

    // Insérer dans la sous-table selon le type
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
      const { code_matiere, note_actuelle, note_contestee, motif_contestation, id_enseignant } = details;
      if (!code_matiere || note_actuelle === undefined || note_contestee === undefined || !motif_contestation) {
        res.status(400).json({ message: 'Champs contestation_note incomplets' });
        return;
      }
      if (motif_contestation.length < 30) {
        res.status(400).json({ message: 'Le motif doit faire au moins 30 caractères' });
        return;
      }
      await pool.execute(
        'INSERT INTO requete_note (requete_id, code_matiere, note_actuelle, note_contestee, motif_contestation, id_enseignant) VALUES (?, ?, ?, ?, ?, ?)',
        [requeteId, code_matiere, note_actuelle, note_contestee, motif_contestation, id_enseignant || null]
      );
    }

    // Historique initial
    await pool.execute(
      'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
      [requeteId, null, 'EN_ATTENTE', req.user!.id, 'Requête soumise par l\'étudiant']
    );

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
    const [etudiant]: any = await pool.execute(
      'SELECT id FROM etudiant WHERE user_id = ?',
      [req.user!.id]
    );

    if (etudiant.length === 0) {
      res.status(403).json({ message: 'Accès réservé aux étudiants' });
      return;
    }

    const etudiantId = etudiant[0].id;

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
    const [etudiant]: any = await pool.execute(
      'SELECT id FROM etudiant WHERE user_id = ?',
      [req.user!.id]
    );

    if (etudiant.length === 0) {
      res.status(403).json({ message: 'Accès réservé aux étudiants' });
      return;
    }

    const [requetes]: any = await pool.execute(
      'SELECT * FROM requete WHERE id = ? AND etudiant_id = ?',
      [id, etudiant[0].id]
    );

    if (requetes.length === 0) {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    const requete = requetes[0];

    // Récupérer les détails selon le type
    let details = null;
    if (requete.type === 'effet_academique') {
      const [rows]: any = await pool.execute(
        'SELECT * FROM requete_attestation WHERE requete_id = ?', [id]
      );
      details = rows[0];
    } else if (requete.type === 'correction_nom') {
      const [rows]: any = await pool.execute(
        'SELECT * FROM requete_correction_nom WHERE requete_id = ?', [id]
      );
      details = rows[0];
    } else if (requete.type === 'contestation_note') {
      const [rows]: any = await pool.execute(
        'SELECT * FROM requete_note WHERE requete_id = ?', [id]
      );
      details = rows[0];
    }

    // Historique
    const [historique]: any = await pool.execute(
      `SELECT h.*, u.nom, u.prenom, u.role 
       FROM historique_statut h 
       JOIN users u ON h.change_par = u.id 
       WHERE h.requete_id = ? ORDER BY h.date ASC`,
      [id]
    );

    res.status(200).json({ requete, details, historique });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// PUT /requetes/:id/annuler
export const annulerRequete = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [etudiant]: any = await pool.execute(
      'SELECT id FROM etudiant WHERE user_id = ?',
      [req.user!.id]
    );

    if (etudiant.length === 0) {
      res.status(403).json({ message: 'Accès réservé aux étudiants' });
      return;
    }

    const [requetes]: any = await pool.execute(
      'SELECT * FROM requete WHERE id = ? AND etudiant_id = ?',
      [id, etudiant[0].id]
    );

    if (requetes.length === 0) {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    if (requetes[0].statut !== 'EN_ATTENTE') {
      res.status(400).json({ message: 'Seules les requêtes EN_ATTENTE peuvent être annulées' });
      return;
    }

    await pool.execute(
      'UPDATE requete SET statut = ? WHERE id = ?',
      ['REJETEE', id]
    );

    await pool.execute(
      'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
      [id, 'EN_ATTENTE', 'REJETEE', req.user!.id, 'Annulée par l\'étudiant']
    );

    res.status(200).json({ message: 'Requête annulée avec succès' });
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
  const offset = (page - 1) * limit;

  try {
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
    const queryParams: any[] = [];

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

    baseQuery += ' ORDER BY r.date_depot DESC LIMIT ? OFFSET ?';
    
    const [requetes]: any = await pool.execute(baseQuery, [...queryParams, limit.toString(), offset.toString()]);
    const [totalRows]: any = await pool.execute(countQuery, queryParams);

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
    const [statsByStatus]: any = await pool.execute(
      'SELECT statut, COUNT(*) as count FROM requete GROUP BY statut'
    );
    const [statsByType]: any = await pool.execute(
      'SELECT type, COUNT(*) as count FROM requete GROUP BY type'
    );
    
    // For 4-week evolution, we can group by week. Simple implementation:
    const [evolution]: any = await pool.execute(`
      SELECT 
        YEARWEEK(date_depot, 1) as week, 
        COUNT(*) as total 
      FROM requete 
      WHERE date_depot >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
      GROUP BY week
      ORDER BY week ASC
    `);

    res.status(200).json({
      byStatus: statsByStatus,
      byType: statsByType,
      evolution
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// --- WORKFLOW TRANSITIONS ---

const transitionState = async (
  req: AuthRequest, res: Response,
  actionName: string, expectedStatus: string[], newStatus: string, message: string, notificationMessage: string
) => {
  const { id } = req.params;
  try {
    const [requetes]: any = await pool.execute('SELECT * FROM requete WHERE id = ?', [id]);
    if (requetes.length === 0) {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }
    
    const requete = requetes[0];
    if (!expectedStatus.includes(requete.statut)) {
      res.status(400).json({ message: `Action '${actionName}' non valide pour le statut '${requete.statut}'` });
      return;
    }

    // Update statut
    await pool.execute('UPDATE requete SET statut = ? WHERE id = ?', [newStatus, id]);

    // Insert history
    await pool.execute(
      'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
      [id, requete.statut, newStatus, req.user!.id, message]
    );

    // Get user id from etudiant
    const [etudiant]: any = await pool.execute('SELECT user_id FROM etudiant WHERE id = ?', [requete.etudiant_id]);
    if (etudiant.length > 0) {
      await pool.execute(
        'INSERT INTO notification (user_id, requete_id, message) VALUES (?, ?, ?)',
        [etudiant[0].user_id, id, notificationMessage]
      );
    }

    res.status(200).json({ message: `Requête ${actionName} avec succès` });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const receptionnerRequete = (req: AuthRequest, res: Response) => 
  transitionState(req, res, 'réceptionnée', ['EN_ATTENTE'], 'EN_COURS', 'Dossier réceptionné', 'Votre requête a été réceptionnée par le secrétariat.');

export const acheminerRequete = (req: AuthRequest, res: Response) => 
  transitionState(req, res, 'acheminée', ['EN_COURS'], 'EN_COURS', 'Dossier acheminé', 'Votre requête a été acheminée pour traitement.');

export const validerRequete = (req: AuthRequest, res: Response) => 
  transitionState(req, res, 'validée', ['EN_COURS', 'ATTENTE_INFO'], 'VALIDEE', 'Dossier validé', 'Votre requête a été validée.');

export const rejeterRequete = (req: AuthRequest, res: Response) => 
  transitionState(req, res, 'rejetée', ['EN_COURS', 'ATTENTE_INFO'], 'REJETEE', 'Dossier rejeté', 'Votre requête a été rejetée.');

export const demanderInfoRequete = (req: AuthRequest, res: Response) => 
  transitionState(req, res, 'demande info', ['EN_COURS'], 'ATTENTE_INFO', 'Information supplémentaire requise', 'Des informations supplémentaires sont requises pour votre requête.');

export const executerRequete = (req: AuthRequest, res: Response) => 
  transitionState(req, res, 'en exécution', ['VALIDEE'], 'EN_EXECUTION', 'En cours d\'exécution', 'Votre requête est en cours d\'exécution.');

export const cloturerRequete = (req: AuthRequest, res: Response) => 
  transitionState(req, res, 'clôturée', ['EN_EXECUTION', 'VALIDEE'], 'CLOTUREE', 'Dossier clôturé', 'Votre requête a été clôturée.');
