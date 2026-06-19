export type Role =
    'secretariat'
'directeur_adjoint'
'directeur'
'departement'
'cellule_informatique'
'scolarite'
'etudiant';

export type StatutRequete =
    'EN_ATTENTE'
'EN_COURS'
'ATTENTE_INFO'
'VALIDEE'
'EN_EXECUTION'
'REJETEE'
'CLOTUREE';

export type TypeRequete =
    'effet_academique'
'correction_nom'
'contestation_note';

export interface User {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: Role;
}

export interface Requete {
    id: number;
    type: TypeRequete;
    statut: StatutRequete;
    priorite: 'normale' | 'urgente';
    date_depot: string;
    etudiant?: {
        nom: string;
        prenom: string;
        matricule: string;
    };
    details?: any;
}

export interface HistoriqueItem {
    statut: StatutRequete;
    acteur: {
        nom: string;
        prenom: string;
        role: Role;
    };
    date: string;
    commentaire?: string;
    info_requise?: string;
}

export interface Notification {
    id: number;
    message: string;
    date_envoie: string;
    lu: boolean;
    requete_id?: number;
}

export interface Stats {
    par_statut: Record<StatutRequete, number>;
    par_type: Record<TypeRequete, number>;
    evolution_semaine: {
        semaine: string;
        total: number;
    }[];
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}