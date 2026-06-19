export const STATUT_CONFIG = {
    EN_ATTENTE: { label: 'En attente', color: '#D97706', bg: '#FEF3C7', border: '#F59E0B' },
    EN_COURS: { label: 'En cours', color: '#2563EB', bg: '#DBEAFE', border: '#3B82F6' },
    ATTENTE_INFO: { label: 'Attente info', color: '#EA580C', bg: '#FFEDD5', border: '#F97316' },
    VALIDEE: { label: 'Validée', color: '#7C3AED', bg: '#EDE9FE', border: '#8B5CF6' },
    EN_EXECUTION: { label: 'En exécution', color: '#0891B2', bg: '#CFFAFE', border: '#06B6D4' },
    REJETEE: { label: 'Rejetée', color: '#DC2626', bg: '#FEE2E2', border: '#EF4444' },
    CLOTUREE: { label: 'Clôturée', color: '#059669', bg: '#D1FAE5', border: '#10B981' },
} as const;

export const TYPE_CONFIG = {
    effet_academique: { label: 'Effet académique', icon: '' },
    correction_nom: { label: 'Correction de nom', icon: '' },
    contestation_note: { label: 'Contestation note', icon: '' },
} as const;

export const ROLE_CONFIG = {
    secretariat: { label: 'Secrétariat', color: '#2563EB' },
    directeur_adjoint: { label: 'Directeur Adjoint', color: '#7C3AED' },
    directeur: { label: 'Directeur', color: '#DC2626' },
    departement: { label: 'Département', color: '#059669' },
    cellule_informatique: { label: 'Cellule Informatique', color: '#0891B2' },
    scolarite: { label: 'Scolarité', color: '#D97706' },
    etudiant: { label: 'Étudiant', color: '#6B7280' },
} as const;