import { Response } from 'express';
import fs from 'fs';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { notifyRole, notifyUser } from '../services/notificationService';
import {
  buildStaffRoleFilter,
  canAccessRequete,
  getEtudiantIdForUser,
  isRequeteVisibleToRole,
  isStaffRole,
} from '../utils/requeteAccess';

const TYPES_VALIDES = ['effet_academique', 'correction_nom', 'contestation_note'];

/**
 * Service cible valide pour l'acheminement, selon le type de requête.
 * Reflète le circuit métier réel (cf. buildStaffRoleFilter) : router une
 * requête vers un service qui ne la traite pas orpheline le dossier (plus
 * aucun rôle ne peut alors le voir ni le faire progresser).
 */
const CIBLES_ACHEMINEMENT_VALIDES: Record<string, string[]> = {
  effet_academique: ['directeur_adjoint'],
  correction_nom: ['directeur'],
  contestation_note: ['cellule_informatique'],
};

/**
 * Délai indicatif (en jours) communiqué aux étudiants dans la FAQ du
 * chatbot : au-delà, un dossier encore actif est considéré "en retard".
 */
const SLA_JOURS_PAR_TYPE: Record<string, number> = {
  effet_academique: 5,
  correction_nom: 5,
  contestation_note: 14,
};
const STATUTS_TERMINAUX = ['CLOTUREE', 'REJETEE', 'ANNULEE'];

/** Fragment SQL calculant l'ancienneté et le retard d'une requête `r`. */
const SQL_RETARD = `
  DATEDIFF(NOW(), r.date_depot) AS jours_ecoules,
  CASE
    WHEN r.statut IN ('CLOTUREE', 'REJETEE', 'ANNULEE') THEN 0
    WHEN r.type = 'contestation_note' AND DATEDIFF(NOW(), r.date_depot) > ${SLA_JOURS_PAR_TYPE.contestation_note} THEN 1
    WHEN r.type IN ('effet_academique', 'correction_nom') AND DATEDIFF(NOW(), r.date_depot) > ${SLA_JOURS_PAR_TYPE.effet_academique} THEN 1
    ELSE 0
  END AS en_retard
`;

/** Équivalent JS de SQL_RETARD, pour les cas où la requête est déjà chargée en mémoire. */
function calculerRetard(requete: { type: string; statut: string; date_depot: string | Date }) {
  const joursEcoules = Math.floor(
    (Date.now() - new Date(requete.date_depot).getTime()) / (1000 * 60 * 60 * 24)
  );
  const seuil = SLA_JOURS_PAR_TYPE[requete.type] ?? SLA_JOURS_PAR_TYPE.effet_academique;
  const enRetard = !STATUTS_TERMINAUX.includes(requete.statut) && joursEcoules > seuil;
  return { jours_ecoules: joursEcoules, en_retard: enRetard };
}

async function fetchRequeteDetails(requeteId: string | number) {
  const [requetes]: any = await pool.execute('SELECT * FROM requete WHERE id = ?', [requeteId]);
  if (requetes.length === 0) return null;

  const requete = requetes[0];

  // Numéro d'ordre propre à l'étudiant (sa 1ère, 2e, 3e requête...), affiché
  // à l'étudiant à la place de l'id global de la table (qui mélange toutes
  // les requêtes de tous les étudiants et n'a donc aucun sens pour lui).
  const [numeroRows]: any = await pool.execute(
    'SELECT COUNT(*) as numero FROM requete WHERE etudiant_id = ? AND id <= ?',
    [requete.etudiant_id, requete.id]
  );
  requete.numero = numeroRows[0].numero;
  Object.assign(requete, calculerRetard(requete));

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

// PUT /requetes/:id
// Modification par l'étudiant des informations de sa requête, uniquement
// tant qu'elle est EN_ATTENTE (pas encore réceptionnée par un service) —
// même garde-fou que l'annulation.
export const modifierRequete = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { priorite, ...details } = req.body;

  try {
    const access = await canAccessRequete(req, String(id));
    if (!access.allowed || req.user!.role !== 'etudiant') {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    const requete = access.requete!;
    if (requete.statut !== 'EN_ATTENTE') {
      res.status(400).json({ message: 'Seules les requêtes EN_ATTENTE peuvent être modifiées' });
      return;
    }

    if (requete.type === 'effet_academique') {
      const { type_document, annee_academique, motif } = details;
      if (!type_document || !annee_academique) {
        res.status(400).json({ message: 'type_document et annee_academique sont requis' });
        return;
      }
      await pool.execute(
        'UPDATE requete_attestation SET type_document = ?, annee_academique = ?, motif = ? WHERE requete_id = ?',
        [type_document, annee_academique, motif || null, id]
      );
    } else if (requete.type === 'correction_nom') {
      const { ancien_nom, nouveau_nom, motif } = details;
      if (!ancien_nom || !nouveau_nom) {
        res.status(400).json({ message: 'ancien_nom et nouveau_nom sont requis' });
        return;
      }
      await pool.execute(
        'UPDATE requete_correction_nom SET ancien_nom = ?, nouveau_nom = ?, motif = ? WHERE requete_id = ?',
        [ancien_nom, nouveau_nom, motif || null, id]
      );
    } else if (requete.type === 'contestation_note') {
      const { code_matiere, note_actuelle, note_contestee, motif_contestation } = details;
      if (
        !code_matiere ||
        note_actuelle === undefined ||
        note_contestee === undefined ||
        !motif_contestation
      ) {
        res.status(400).json({ message: 'Champs contestation_note incomplets' });
        return;
      }
      if (String(motif_contestation).length < 30) {
        res.status(400).json({ message: 'Le motif doit faire au moins 30 caractères' });
        return;
      }
      await pool.execute(
        'UPDATE requete_note SET code_matiere = ?, note_actuelle = ?, note_contestee = ?, motif_contestation = ? WHERE requete_id = ?',
        [code_matiere, note_actuelle, note_contestee, motif_contestation, id]
      );
    }

    if (priorite === 'normale' || priorite === 'urgente') {
      await pool.execute('UPDATE requete SET priorite = ? WHERE id = ?', [priorite, id]);
    }

    await pool.execute(
      'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
      [id, 'EN_ATTENTE', 'EN_ATTENTE', req.user!.id, 'Requête modifiée par l\'étudiant']
    );

    res.status(200).json({ message: 'Requête modifiée avec succès' });
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
      `SELECT id, type, statut, priorite, date_depot, updated_at,
              ROW_NUMBER() OVER (ORDER BY id ASC) AS numero
       FROM requete WHERE etudiant_id = ?
       ORDER BY date_depot DESC LIMIT ${limit} OFFSET ${offset}`,
      [etudiantId]
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

    await pool.execute('UPDATE requete SET statut = ? WHERE id = ?', ['ANNULEE', id]);

    await pool.execute(
      'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
      [id, 'EN_ATTENTE', 'ANNULEE', req.user!.id, 'Annulée par l\'étudiant']
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
  const retardSeulement = req.query.retard === '1';
  const offset = (page - 1) * limit;

  try {
    const roleFilter = buildStaffRoleFilter(req.user!.role);

    let baseQuery = `
      SELECT r.id, r.type, r.statut, r.priorite, r.date_depot, r.updated_at,
             e.matricule, u.nom as etudiant_nom, u.prenom as etudiant_prenom,
             ${SQL_RETARD}
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

    // en_retard est un alias calculé : HAVING (pas WHERE) pour pouvoir le
    // référencer. La requête de comptage recalcule la même condition en
    // clair puisqu'elle ne fait pas cette projection.
    const countParams = [...queryParams];
    if (retardSeulement) {
      baseQuery += ` HAVING en_retard = 1`;
      countQuery += ` AND (
        r.statut NOT IN ('CLOTUREE', 'REJETEE', 'ANNULEE') AND (
          (r.type = 'contestation_note' AND DATEDIFF(NOW(), r.date_depot) > ${SLA_JOURS_PAR_TYPE.contestation_note})
          OR (r.type IN ('effet_academique', 'correction_nom') AND DATEDIFF(NOW(), r.date_depot) > ${SLA_JOURS_PAR_TYPE.effet_academique})
        )
      )`;
    }

    baseQuery += ` ORDER BY r.date_depot DESC LIMIT ${limit} OFFSET ${offset}`;

    const [requetes]: any = await pool.execute(baseQuery, queryParams as any[]);
    const [totalRows]: any = await pool.execute(countQuery, countParams as any[]);

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

// DELETE /requetes/staff/:id
// Suppression définitive par un membre du staff, réservée aux requêtes qui
// le concernent (même règle que la lecture et les transitions). Le schéma
// (ON DELETE CASCADE) supprime avec elle son historique, ses documents et
// ses détails spécifiques — irréversible, d'où la confirmation exigée côté
// frontend avant chaque appel.
export const supprimerRequete = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [requetes]: any = await pool.execute('SELECT * FROM requete WHERE id = ?', [id]);
    if (requetes.length === 0) {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }
    const requete = requetes[0];

    if (!(await isRequeteVisibleToRole(requete, req.user!.role))) {
      res.status(403).json({ message: 'Cette requête ne concerne pas votre service' });
      return;
    }

    const [documents]: any = await pool.execute(
      'SELECT chemin FROM document WHERE requete_id = ?',
      [id]
    );

    await pool.execute('DELETE FROM requete WHERE id = ?', [id]);

    // Best-effort : les fichiers physiques ne sont pas couverts par le
    // ON DELETE CASCADE (qui ne concerne que les lignes en base).
    for (const doc of documents) {
      fs.unlink(doc.chemin, () => {});
    }

    res.status(200).json({ message: 'Requête supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

/**
 * GET /requetes/staff/:id/export-csv
 * Le département exporte le dossier d'une contestation de note en CSV pour
 * le transmettre à l'enseignant concerné (hors application). Une fois que
 * l'enseignant a donné son approbation, le département valide la requête
 * (PUT .../valider) puis l'achemine vers la cellule informatique
 * (PUT .../acheminer) pour correction dans le système.
 */
function echapperCsv(valeur: unknown): string {
  let texte = valeur === null || valeur === undefined ? '' : String(valeur);
  // Neutralise l'injection de formule CSV/Excel : un motif de contestation
  // saisi par l'étudiant (texte libre) qui commencerait par =, +, -, @ ou une
  // tabulation serait sinon interprété comme une formule par le tableur de
  // l'agent du département/enseignant à l'ouverture du fichier.
  if (/^[=+\-@\t]/.test(texte)) {
    texte = `'${texte}`;
  }
  if (/[",\n;]/.test(texte)) {
    return `"${texte.replace(/"/g, '""')}"`;
  }
  return texte;
}

export const exporterContestationCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [requetes]: any = await pool.execute('SELECT * FROM requete WHERE id = ?', [id]);
    if (requetes.length === 0) {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    const requete = requetes[0];
    if (requete.type !== 'contestation_note') {
      res.status(400).json({ message: 'Export CSV disponible uniquement pour les contestations de note' });
      return;
    }

    const [noteRows]: any = await pool.execute(
      'SELECT * FROM requete_note WHERE requete_id = ?',
      [id]
    );
    const details = noteRows[0];
    if (!details) {
      res.status(404).json({ message: 'Détails de la contestation introuvables' });
      return;
    }

    const [etudiantRows]: any = await pool.execute(
      `SELECT e.matricule, u.nom, u.prenom
       FROM etudiant e JOIN users u ON e.user_id = u.id
       WHERE e.id = ?`,
      [requete.etudiant_id]
    );
    const etudiant = etudiantRows[0] || {};

    const entetes = [
      'requete_id',
      'matricule_etudiant',
      'nom_etudiant',
      'prenom_etudiant',
      'code_matiere',
      'note_actuelle',
      'note_contestee',
      'motif_contestation',
      'id_enseignant',
      'date_depot',
    ];
    const ligne = [
      requete.id,
      etudiant.matricule,
      etudiant.nom,
      etudiant.prenom,
      details.code_matiere,
      details.note_actuelle,
      details.note_contestee,
      details.motif_contestation,
      details.id_enseignant,
      requete.date_depot,
    ].map(echapperCsv);

    const csv = `${entetes.join(';')}\n${ligne.join(';')}\n`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="contestation-note-${requete.id}.csv"`
    );
    // BOM UTF-8 pour un affichage correct des accents dans Excel
    res.send('﻿' + csv);
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

    // Nombre de dossiers actifs ayant dépassé le délai indicatif de leur
    // type (cf. SLA_JOURS_PAR_TYPE) — alimente le badge "En retard" du
    // dashboard staff.
    const [retard]: any = await pool.execute(
      `SELECT COUNT(*) as total FROM requete r ${whereRole}
       ${whereRole ? 'AND' : 'WHERE'} r.statut NOT IN ('CLOTUREE', 'REJETEE', 'ANNULEE')
       AND (
         (r.type = 'contestation_note' AND DATEDIFF(NOW(), r.date_depot) > ${SLA_JOURS_PAR_TYPE.contestation_note})
         OR (r.type IN ('effet_academique', 'correction_nom') AND DATEDIFF(NOW(), r.date_depot) > ${SLA_JOURS_PAR_TYPE.effet_academique})
       )`,
      roleFilter.params as any[]
    );

    // Délai moyen de traitement (en jours) des dossiers déjà clôturés, par
    // type — identifie les goulots d'étranglement du circuit.
    const [delaiMoyenParType]: any = await pool.execute(
      `SELECT r.type, AVG(DATEDIFF(r.updated_at, r.date_depot)) as jours_moyen, COUNT(*) as count
       FROM requete r
       ${whereRole ? whereRole + ' AND' : 'WHERE'} r.statut = 'CLOTUREE'
       GROUP BY r.type`,
      roleFilter.params as any[]
    );

    // Temps moyen passé dans chaque statut avant la transition suivante —
    // identifie précisément où les dossiers s'accumulent (ex: "EN_COURS : 4
    // jours en moyenne" pointe vers la validation comme goulot
    // d'étranglement), à partir du journal d'audit déjà tracé.
    const [tempsParEtape]: any = await pool.execute(
      `SELECT h1.nouveau_statut AS etape,
              AVG(TIMESTAMPDIFF(HOUR, h1.date, h2.date)) / 24 AS jours_moyen,
              COUNT(*) AS count
       FROM historique_statut h1
       JOIN requete r ON r.id = h1.requete_id
       JOIN historique_statut h2 ON h2.requete_id = h1.requete_id
         AND h2.date = (
           SELECT MIN(h3.date) FROM historique_statut h3
           WHERE h3.requete_id = h1.requete_id AND h3.date > h1.date
         )
       ${whereRole}
       GROUP BY h1.nouveau_statut
       ORDER BY jours_moyen DESC`,
      roleFilter.params as any[]
    );

    res.status(200).json({
      byStatus: statsByStatus,
      byType: statsByType,
      evolution,
      enRetard: retard[0].total,
      delaiMoyenParType,
      tempsParEtape,
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
    /** Rôles à notifier, calculés à partir de la requête (ex: exécutant selon son type). Prioritaire sur notifyRoles. */
    computeNotifyRoles?: (requete: any) => string[];
    /** Réassigne service_cible au service qui prend la main après cette transition (ex: validation → exécutant). */
    computeServiceCible?: (requete: any) => string | undefined;
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

    // Un rôle staff ne peut agir que sur une requête qui le concerne — même
    // règle que la lecture (canAccessRequete/isRequeteVisibleToRole), sans
    // quoi le contrôle de rôle seul laisserait n'importe quel service agir
    // sur n'importe quel dossier tant que le statut correspond.
    if (!(await isRequeteVisibleToRole(requete, req.user!.role))) {
      res.status(403).json({ message: 'Cette requête ne concerne pas votre service' });
      return;
    }

    const nouveauServiceCible = opts.computeServiceCible?.(requete);
    if (nouveauServiceCible) {
      await pool.execute('UPDATE requete SET statut = ?, service_cible = ? WHERE id = ?', [
        opts.newStatus,
        nouveauServiceCible,
        id,
      ]);
    } else {
      await pool.execute('UPDATE requete SET statut = ? WHERE id = ?', [opts.newStatus, id]);
    }

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

    const rolesANotifier = opts.computeNotifyRoles?.(requete) ?? opts.notifyRoles;
    if (rolesANotifier) {
      for (const role of rolesANotifier) {
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

    const nextRole =
      requete.type === 'effet_academique'
        ? 'directeur_adjoint'
        : requete.type === 'correction_nom'
          ? 'directeur'
          : 'departement';

    // service_cible est fixé dès la réception : c'est ce qui permet à
    // buildStaffRoleFilter() de savoir qui possède actuellement le dossier
    // (sans ça, aucun rôle autre que celui qui vient de réceptionner ne
    // pouvait plus jamais le voir).
    await pool.execute('UPDATE requete SET statut = ?, service_cible = ? WHERE id = ?', [
      'EN_COURS',
      nextRole,
      id,
    ]);

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

  try {
    const [requetes]: any = await pool.execute('SELECT * FROM requete WHERE id = ?', [id]);
    if (requetes.length === 0) {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    const requete = requetes[0];

    const validCibles = CIBLES_ACHEMINEMENT_VALIDES[requete.type] || [];
    if (!service_cible || !validCibles.includes(service_cible)) {
      res.status(400).json({
        message: `service_cible requis pour ce type de requête : ${validCibles.join(', ')}`,
      });
      return;
    }

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

/** Service qui prend en charge l'exécution une fois la requête validée. */
const EXECUTANT_PAR_TYPE: Record<string, string> = {
  effet_academique: 'scolarite',
  correction_nom: 'cellule_informatique',
  contestation_note: 'cellule_informatique',
};

export const validerRequete = (req: AuthRequest, res: Response) => {
  const { commentaire } = req.body;
  return applyTransition(req, res, {
    actionName: 'validée',
    expectedStatus: ['EN_COURS', 'ATTENTE_INFO'],
    newStatus: 'VALIDEE',
    commentaire: commentaire || 'Dossier validé',
    studentMessage: 'Votre requête a été validée.',
    computeNotifyRoles: (requete) => [EXECUTANT_PAR_TYPE[requete.type] ?? 'scolarite'],
    computeServiceCible: (requete) => EXECUTANT_PAR_TYPE[requete.type],
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
