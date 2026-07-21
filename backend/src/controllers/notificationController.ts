import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { registerClient, unregisterClient } from '../services/sseService';

// GET /notifications/stream
// EventSource (API navigateur native pour SSE) ne peut pas envoyer d'en-tête
// Authorization personnalisé : le token JWT est donc passé en query string
// pour cette seule route, et vérifié manuellement (pas via authMiddleware).
export const streamNotifications = async (req: Request, res: Response): Promise<void> => {
  const token = req.query.token as string | undefined;
  if (!token) {
    res.status(401).end();
    return;
  }

  let userId: number;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
    userId = decoded.id;
  } catch {
    res.status(401).end();
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  registerClient(userId, res);
  res.write(': connected\n\n');

  // Garde la connexion HTTP ouverte à travers d'éventuels proxys/timeouts.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregisterClient(userId, res);
  });
};

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
