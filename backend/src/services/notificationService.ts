import pool from '../config/db';

export async function notifyUser(
  userId: number,
  requeteId: number | null,
  message: string
): Promise<void> {
  await pool.execute(
    'INSERT INTO notification (user_id, requete_id, message) VALUES (?, ?, ?)',
    [userId, requeteId, message]
  );
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
