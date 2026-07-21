import pool from '../config/db';

export interface NotificationAgent {
  nom: string;
  prenom: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  secretariat: 'Secrétariat',
  directeur_adjoint: 'Directeur Adjoint',
  directeur: 'Directeur',
  departement: 'Département',
  cellule_informatique: 'Cellule Informatique',
  scolarite: 'Scolarité',
};

/**
 * Notifie un étudiant. Si `agent` est fourni, le message est complété avec
 * l'identité de l'agent, son rôle et la date/heure de l'action :
 * "<message> par <prénom> <nom> (<rôle>) le <date> à <heure><extra ?? '.'>"
 * `extra` permet de contrôler exactement la ponctuation/le contenu final
 * (ex: ". Motif : ..." pour un rejet, ou " : ..." pour une demande d'info).
 */
export async function notifyUser(
  userId: number,
  requeteId: number | null,
  message: string,
  agent?: NotificationAgent,
  extra?: string
): Promise<void> {
  let finalMessage = message;

  if (agent) {
    const roleLabel = ROLE_LABELS[agent.role] ?? agent.role;
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR');
    const heure = now
      .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      .replace(':', 'h');
    finalMessage = `${message} par ${agent.prenom} ${agent.nom} (${roleLabel}) le ${date} à ${heure}${extra ?? '.'}`;
  }

  await pool.execute(
    'INSERT INTO notification (user_id, requete_id, message) VALUES (?, ?, ?)',
    [userId, requeteId, finalMessage]
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
