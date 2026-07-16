import pool from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

const STAFF_ROLES = [
  'secretariat',
  'directeur',
  'directeur_adjoint',
  'departement',
  'scolarite',
  'cellule_informatique',
];

export function isStaffRole(role: string): boolean {
  return STAFF_ROLES.includes(role);
}

export async function getEtudiantIdForUser(userId: number): Promise<number | null> {
  const [rows]: any = await pool.execute(
    'SELECT id FROM etudiant WHERE user_id = ?',
    [userId]
  );
  return rows.length > 0 ? rows[0].id : null;
}

export async function canAccessRequete(
  req: AuthRequest,
  requeteId: string | number
): Promise<{ allowed: boolean; requete?: any }> {
  const [requetes]: any = await pool.execute('SELECT * FROM requete WHERE id = ?', [requeteId]);
  if (requetes.length === 0) {
    return { allowed: false };
  }
  const requete = requetes[0];
  const role = req.user!.role;

  if (role === 'etudiant') {
    const etudiantId = await getEtudiantIdForUser(req.user!.id);
    if (etudiantId === null || requete.etudiant_id !== etudiantId) {
      return { allowed: false, requete };
    }
    return { allowed: true, requete };
  }

  if (isStaffRole(role)) {
    return { allowed: true, requete };
  }

  return { allowed: false, requete };
}

/** Filtres SQL automatiques selon le rôle staff connecté. */
export function buildStaffRoleFilter(role: string): { clause: string; params: unknown[] } {
  switch (role) {
    case 'secretariat':
      return {
        clause: ' AND r.statut = ? AND r.type != ?',
        params: ['EN_ATTENTE', 'contestation_note'],
      };
    case 'departement':
      // Le département est le service propriétaire des contestations de
      // note de bout en bout : il doit voir celles en attente de
      // réception, celles qu'il traite actuellement, ET conserver l'accès
      // à l'historique de celles déjà acheminées/validées/rejetées/clôturées
      // (sinon il perd toute trace de ce qu'il a lui-même traité).
      return {
        clause: ' AND (r.type = ? OR r.service_cible = ?)',
        params: ['contestation_note', 'departement'],
      };
    case 'directeur_adjoint':
      return {
        clause: ' AND r.statut IN (?, ?) AND (r.service_cible = ? OR r.type = ?)',
        params: ['EN_COURS', 'ATTENTE_INFO', 'directeur_adjoint', 'effet_academique'],
      };
    case 'directeur':
      return {
        clause: ' AND r.statut IN (?, ?) AND (r.service_cible = ? OR r.type = ?)',
        params: ['EN_COURS', 'ATTENTE_INFO', 'directeur', 'correction_nom'],
      };
    case 'scolarite':
      return {
        clause: ' AND r.statut IN (?, ?) AND (r.service_cible = ? OR r.type = ?)',
        params: ['VALIDEE', 'EN_EXECUTION', 'scolarite', 'effet_academique'],
      };
    case 'cellule_informatique':
      return {
        clause: ' AND r.statut IN (?, ?) AND (r.service_cible = ? OR r.type IN (?, ?))',
        params: [
          'VALIDEE',
          'EN_EXECUTION',
          'cellule_informatique',
          'correction_nom',
          'contestation_note',
        ],
      };
    default:
      return { clause: '', params: [] };
  }
}
