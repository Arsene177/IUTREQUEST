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

/**
 * Types de requêtes qu'un rôle réceptionne en tout premier (dépôt initial
 * par l'étudiant), avant tout acheminement — donne accès à la "file
 * d'attente" du rôle en plus de ce qu'il possède/a déjà traité.
 */
const TYPES_RECEPTIONNES_PAR_ROLE: Record<string, string[]> = {
  secretariat: ['effet_academique', 'correction_nom'],
  departement: ['contestation_note'],
};

/**
 * Une requête est visible par un rôle staff si (a) elle attend sa réception
 * initiale, (b) elle lui est actuellement assignée (service_cible), ou (c)
 * il l'a déjà traitée par le passé (une ligne d'historique lui est
 * attribuée). Utilisé à la fois pour filtrer les listes (buildStaffRoleFilter)
 * et pour contrôler l'accès à une requête individuelle (canAccessRequete) —
 * un membre du staff ne doit jamais pouvoir consulter un dossier qui n'a
 * jamais transité par son service.
 */
export async function isRequeteVisibleToRole(requete: any, role: string): Promise<boolean> {
  const typesReceptionnes = TYPES_RECEPTIONNES_PAR_ROLE[role];
  if (typesReceptionnes && requete.statut === 'EN_ATTENTE' && typesReceptionnes.includes(requete.type)) {
    return true;
  }

  if (requete.service_cible === role) {
    return true;
  }

  const [rows]: any = await pool.execute(
    `SELECT 1 FROM historique_statut h
     JOIN users u ON h.change_par = u.id
     WHERE h.requete_id = ? AND u.role = ?
     LIMIT 1`,
    [requete.id, role]
  );
  return rows.length > 0;
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
    const visible = await isRequeteVisibleToRole(requete, role);
    return { allowed: visible, requete };
  }

  return { allowed: false, requete };
}

/**
 * Filtre SQL générique selon le rôle staff connecté — reflète exactement la
 * même règle que isRequeteVisibleToRole, appliquée à une liste plutôt qu'à
 * une requête déjà chargée.
 */
export function buildStaffRoleFilter(role: string): { clause: string; params: unknown[] } {
  const typesReceptionnes = TYPES_RECEPTIONNES_PAR_ROLE[role];
  const clauseReception = typesReceptionnes
    ? `(r.statut = 'EN_ATTENTE' AND r.type IN (${typesReceptionnes.map(() => '?').join(', ')}))`
    : 'FALSE';

  return {
    clause: ` AND (
      ${clauseReception}
      OR r.service_cible = ?
      OR EXISTS (
        SELECT 1 FROM historique_statut h2
        JOIN users u2 ON h2.change_par = u2.id
        WHERE h2.requete_id = r.id AND u2.role = ?
      )
    )`,
    params: [...(typesReceptionnes ?? []), role, role],
  };
}
