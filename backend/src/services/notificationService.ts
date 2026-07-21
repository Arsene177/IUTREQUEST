import pool from '../config/db';
import { pushToUser } from './sseService';

export async function notifyUser(
  userId: number,
  requeteId: number | null,
  message: string
): Promise<void> {
  const [result]: any = await pool.execute(
    'INSERT INTO notification (user_id, requete_id, message) VALUES (?, ?, ?)',
    [userId, requeteId, message]
  );

  // Poussée temps réel si l'utilisateur a un onglet ouvert avec une
  // connexion SSE active — sinon il verra la notification au prochain
  // chargement de son tableau de bord, sans rien de cassé.
  pushToUser(userId, 'notification', {
    id: result.insertId,
    requete_id: requeteId,
    message,
    lu: false,
    date_envoie: new Date().toISOString(),
  });
}

/** Notifie tous les users d'un rôle donné */
export async function notifyRole(
  role: string,
  requeteId: number,
  message: string
): Promise<void> {
  const [users]: any = await pool.execute('SELECT id FROM users WHERE role = ?', [role]);
  for (const u of users) {
    await notifyUser(u.id, requeteId, message);
  }
}
