import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { notifyRole } from '../services/notificationService';

const STAFF_ROLES = [
  'secretariat',
  'directeur',
  'directeur_adjoint',
  'departement',
  'scolarite',
  'cellule_informatique',
];

async function canAccessRequete(
  requeteId: string,
  userId: number,
  role: string
): Promise<{ ok: boolean; requete?: any }> {
  const [requetes]: any = await pool.execute('SELECT * FROM requete WHERE id = ?', [requeteId]);
  if (requetes.length === 0) return { ok: false };

  const requete = requetes[0];

  if (role === 'etudiant') {
    const [etudiant]: any = await pool.execute(
      'SELECT id FROM etudiant WHERE user_id = ? AND id = ?',
      [userId, requete.etudiant_id]
    );
    return { ok: etudiant.length > 0, requete };
  }

  if (STAFF_ROLES.includes(role)) {
    return { ok: true, requete };
  }

  return { ok: false };
}

// POST /requetes/:id/documents
export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const access = await canAccessRequete(String(id), req.user!.id, req.user!.role);
    if (!access.ok || !access.requete) {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    if (req.user!.role !== 'etudiant') {
      res.status(403).json({ message: 'Seuls les étudiants peuvent joindre des documents' });
      return;
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({ message: 'Aucun fichier uploadé' });
      return;
    }

    const requete = access.requete;
    const files = req.files as Express.Multer.File[];
    const documentsInseres = [];

    for (const file of files) {
      const [result]: any = await pool.execute(
        'INSERT INTO document (requete_id, nom, type, taille, chemin) VALUES (?, ?, ?, ?, ?)',
        [id, file.originalname, file.mimetype, file.size, file.path]
      );
      documentsInseres.push({
        id: result.insertId,
        nom: file.originalname,
        type: file.mimetype,
        taille: file.size,
      });
    }

    if (requete.statut === 'ATTENTE_INFO') {
      await pool.execute('UPDATE requete SET statut = ? WHERE id = ?', ['EN_COURS', id]);
      await pool.execute(
        'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
        [
          id,
          'ATTENTE_INFO',
          'EN_COURS',
          req.user!.id,
          'Pièces complémentaires fournies par l\'étudiant',
        ]
      );
      await notifyRole('secretariat', Number(id), `Requête #${id} : dossier complété par l'étudiant.`);
    }

    res.status(201).json({
      message: 'Documents uploadés avec succès',
      documents: documentsInseres,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// GET /requetes/:id/documents/:docId
export const telechargerDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id, docId } = req.params;

  try {
    const access = await canAccessRequete(String(id), req.user!.id, req.user!.role);
    if (!access.ok) {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    const [docs]: any = await pool.execute(
      'SELECT * FROM document WHERE id = ? AND requete_id = ?',
      [docId, id]
    );

    if (docs.length === 0) {
      res.status(404).json({ message: 'Document introuvable' });
      return;
    }

    const doc = docs[0];
    const filePath = path.resolve(doc.chemin);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Fichier introuvable sur le serveur' });
      return;
    }

    res.download(filePath, doc.nom);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
