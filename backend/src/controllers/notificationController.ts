import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

// GET /notifications
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT id, message, date_envoie, lu, requete_id
       FROM notification
       WHERE user_id = ?
       ORDER BY date_envoie DESC
       LIMIT 100`,
      [req.user!.id]
    );
    res.status(200).json({ notifications: rows });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// GET /notifications/nb-non-lues
export const getNbNonLues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.execute(
      'SELECT COUNT(*) as nb FROM notification WHERE user_id = ? AND lu = FALSE',
      [req.user!.id]
    );
    res.status(200).json({ nb: rows[0].nb });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// PUT /notifications/:id/lu
export const marquerLue = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.execute(
      'UPDATE notification SET lu = TRUE WHERE id = ? AND user_id = ?',
      [id, req.user!.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Notification introuvable' });
      return;
    }
    res.status(200).json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// PUT /notifications/lu-tout
export const marquerToutesLues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.execute('UPDATE notification SET lu = TRUE WHERE user_id = ? AND lu = FALSE', [
      req.user!.id,
    ]);
    res.status(200).json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
