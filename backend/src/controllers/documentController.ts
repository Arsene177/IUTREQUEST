import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

// POST /requetes/:id/documents
export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [requetes]: any = await pool.execute(
      'SELECT r.* FROM requete r JOIN etudiant e ON r.etudiant_id = e.id WHERE r.id = ? AND e.user_id = ?',
      [id, req.user!.id]
    );

    if (requetes.length === 0) {
      res.status(404).json({ message: 'Requête introuvable' });
      return;
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({ message: 'Aucun fichier uploadé' });
      return;
    }

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
