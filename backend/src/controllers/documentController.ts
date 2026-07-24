import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { notifyRole, notifyUser } from '../services/notificationService';
import { canAccessRequete as checkAccesRequete } from '../utils/requeteAccess';

/**
 * Rôles staff autorisés à joindre un document à une requête, en plus de
 * l'étudiant lui-même — la cellule informatique dépose le document final
 * (ex: attestation corrigée) une fois son traitement terminé, pour qu'il
 * soit visible par l'étudiant et le service suivant dans le circuit.
 */
const ROLES_STAFF_UPLOAD = ['cellule_informatique'];

async function canAccessRequete(
  requeteId: string,
  userId: number,
  role: string
): Promise<{ ok: boolean; requete?: any }> {
  const access = await checkAccesRequete({ user: { id: userId, role, email: '' } } as AuthRequest, requeteId);
  return { ok: access.allowed, requete: access.requete };
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

    const estEtudiant = req.user!.role === 'etudiant';
    if (!estEtudiant && !ROLES_STAFF_UPLOAD.includes(req.user!.role)) {
      res.status(403).json({ message: 'Vous ne pouvez pas joindre de document à cette requête' });
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

    if (estEtudiant && requete.statut === 'ATTENTE_INFO') {
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

    if (!estEtudiant) {
      // Le document final déposé par le staff (ex: cellule informatique)
      // devient visible à l'étudiant et au service suivant dès l'upload —
      // "acheminer" ici, c'est simplement le rendre visible à qui en a besoin.
      await pool.execute(
        'INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)',
        [id, requete.statut, requete.statut, req.user!.id, 'Document déposé par le service en charge du dossier']
      );
      const [etudiantRows]: any = await pool.execute(
        'SELECT user_id FROM etudiant WHERE id = ?',
        [requete.etudiant_id]
      );
      if (etudiantRows.length > 0) {
        await notifyUser(
          etudiantRows[0].user_id,
          Number(id),
          `Un document a été ajouté à votre requête #${id}.`
        );
      }
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
