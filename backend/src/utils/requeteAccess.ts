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

/**
 * Filtres SQL automatiques selon le rôle staff connecté.
 * Chaque rôle voit ses dossiers actifs ainsi que leur historique (VALIDEE/CLOTUREE),
 * pour que les dossiers traités ne disparaissent jamais du tableau de bord.
 */
export function buildStaffRoleFilter(role: string): { clause: string; params: unknown[] } {
  switch (role) {
    case 'secretariat':
      // Le secrétariat ne gère pas les contestations de note (traitées par le département).
      // Une fois acheminée (service_cible défini), une requête reste visible à vie pour le
      // secrétariat — c'est ce qui alimente son KPI "Clôturées" (= requêtes traitées/acheminées).
      return {
        clause: ' AND r.type != ? AND (r.statut IN (?, ?, ?) OR r.service_cible IS NOT NULL)',
        params: ['contestation_note', 'EN_ATTENTE', 'EN_COURS', 'ATTENTE_INFO'],
      };
    case 'departement':
      // Le département gère exclusivement les contestations de note, de bout en bout.
      return {
        clause: ' AND r.type = ? AND r.statut IN (?, ?, ?, ?)',
        params: ['contestation_note', 'EN_ATTENTE', 'EN_COURS', 'VALIDEE', 'CLOTUREE'],
      };
    case 'directeur_adjoint':
      return {
        clause: ' AND r.service_cible = ? AND r.statut IN (?, ?, ?)',
        params: ['directeur_adjoint', 'EN_COURS', 'VALIDEE', 'CLOTUREE'],
      };
    case 'directeur':
      return {
        clause: ' AND r.service_cible = ? AND r.statut IN (?, ?, ?)',
        params: ['directeur', 'EN_COURS', 'VALIDEE', 'CLOTUREE'],
      };
    case 'scolarite':
      return {
        clause: ' AND (r.service_cible = ? OR r.type = ?) AND r.statut IN (?, ?)',
        params: ['scolarite', 'effet_academique', 'EN_EXECUTION', 'CLOTUREE'],
      };
    case 'cellule_informatique':
      return {
        clause: ' AND (r.service_cible = ? OR r.type IN (?, ?)) AND r.statut IN (?, ?, ?)',
        params: [
          'cellule_informatique',
          'correction_nom',
          'contestation_note',
          'VALIDEE',
          'EN_EXECUTION',
          'CLOTUREE',
        ],
      };
    default:
      return { clause: '', params: [] };
  }
}
