"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("./config/db"));
async function seed() {
    console.log('🌱 Démarrage du seed...');
    // Reset DB
    await db_1.default.execute('SET FOREIGN_KEY_CHECKS = 0');
    await db_1.default.execute('TRUNCATE TABLE notification');
    await db_1.default.execute('TRUNCATE TABLE document');
    await db_1.default.execute('TRUNCATE TABLE historique_statut');
    await db_1.default.execute('TRUNCATE TABLE requete_note');
    await db_1.default.execute('TRUNCATE TABLE requete_correction_nom');
    await db_1.default.execute('TRUNCATE TABLE requete_attestation');
    await db_1.default.execute('TRUNCATE TABLE requete');
    await db_1.default.execute('TRUNCATE TABLE etudiant');
    await db_1.default.execute('TRUNCATE TABLE personnel');
    await db_1.default.execute('TRUNCATE TABLE users');
    await db_1.default.execute('SET FOREIGN_KEY_CHECKS = 1');
    const hash = await bcryptjs_1.default.hash('password123', 10);
    const users = [
        // Étudiants (9 participants)
        { nom: 'BOBDA', prenom: 'Dylane', email: 'dylane.bobda@iut.cm', role: 'etudiant' },
        { nom: 'DEUTOU', prenom: 'Austin', email: 'austin.deutou@iut.cm', role: 'etudiant' },
        { nom: 'OUMAR', prenom: 'Ismael', email: 'ismael.oumar@iut.cm', role: 'etudiant' },
        { nom: 'DJOKOU', prenom: 'Aurore', email: 'aurore.djokou@iut.cm', role: 'etudiant' },
        { nom: 'DJONKOUN', prenom: 'Arsene', email: 'arsene.djonkoun@iut.cm', role: 'etudiant' },
        { nom: 'FOSSOH', prenom: 'Dave', email: 'dave.fossoh@iut.cm', role: 'etudiant' },
        { nom: 'NYETAM', prenom: 'Samuel', email: 'samuel.nyetam@iut.cm', role: 'etudiant' },
        { nom: 'BAYIHA', prenom: 'Bryan', email: 'bryan.bayiha@iut.cm', role: 'etudiant' },
        { nom: 'NKEPDJO', prenom: 'Ulriane', email: 'ulriane.nkepdjo@iut.cm', role: 'etudiant' },
        // Staff (2 par rôle)
        { nom: 'Essomba', prenom: 'Paul', email: 'paul.essomba@iut.cm', role: 'secretariat' },
        { nom: 'Onana', prenom: 'Claire', email: 'claire.onana@iut.cm', role: 'secretariat' },
        { nom: 'Biya', prenom: 'Henri', email: 'henri.biya@iut.cm', role: 'directeur_adjoint' },
        { nom: 'Fouda', prenom: 'Sophie', email: 'sophie.fouda@iut.cm', role: 'directeur_adjoint' },
        { nom: 'Mvondo', prenom: 'Pierre', email: 'pierre.mvondo@iut.cm', role: 'directeur' },
        { nom: 'Ateba', prenom: 'Lucie', email: 'lucie.ateba@iut.cm', role: 'directeur' },
        { nom: 'Ngono', prenom: 'Marc', email: 'marc.ngono@iut.cm', role: 'departement' },
        { nom: 'Zanga', prenom: 'Alice', email: 'alice.zanga@iut.cm', role: 'departement' },
        { nom: 'Mbia', prenom: 'Serge', email: 'serge.mbia@iut.cm', role: 'cellule_informatique' },
        { nom: 'Eto', prenom: 'Nina', email: 'nina.eto@iut.cm', role: 'cellule_informatique' },
        { nom: 'Abega', prenom: 'Jules', email: 'jules.abega@iut.cm', role: 'scolarite' },
        { nom: 'Manga', prenom: 'Rose', email: 'rose.manga@iut.cm', role: 'scolarite' },
    ];
    const userIds = [];
    for (const user of users) {
        const [result] = await db_1.default.execute('INSERT INTO users (nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?)', [user.nom, user.prenom, user.email, hash, user.role]);
        userIds.push(result.insertId);
    }
    console.log('✅ 21 users créés');
    // Profils étudiants (index 0 à 8)
    const filieres = ['Informatique', 'Réseaux', 'Informatique', 'Génie Civil', 'Réseaux', 'Informatique', 'Génie Civil', 'Informatique', 'Réseaux'];
    const niveaux = ['L2', 'L1', 'L3', 'L1', 'L2', 'L3', 'L1', 'L2', 'L3'];
    for (let i = 0; i < 9; i++) {
        await db_1.default.execute('INSERT INTO etudiant (user_id, matricule, filiere, niveau) VALUES (?, ?, ?, ?)', [userIds[i], `IUT2024${String(i + 1).padStart(3, '0')}`, filieres[i], niveaux[i]]);
    }
    // Profils personnel (index 9 à 20)
    const personnels = [
        { idx: 9, poste: 'Secrétaire', service: 'Secrétariat', departement: null },
        { idx: 10, poste: 'Secrétaire', service: 'Secrétariat', departement: null },
        { idx: 11, poste: 'Directeur Adjoint', service: 'Direction', departement: null },
        { idx: 12, poste: 'Directeur Adjoint', service: 'Direction', departement: null },
        { idx: 13, poste: 'Directeur', service: 'Direction', departement: null },
        { idx: 14, poste: 'Directeur', service: 'Direction', departement: null },
        { idx: 15, poste: 'Responsable', service: 'Département', departement: 'Informatique' },
        { idx: 16, poste: 'Responsable', service: 'Département', departement: 'Réseaux' },
        { idx: 17, poste: 'Technicien', service: 'Cellule Informatique', departement: null },
        { idx: 18, poste: 'Technicien', service: 'Cellule Informatique', departement: null },
        { idx: 19, poste: 'Agent', service: 'Scolarité', departement: null },
        { idx: 20, poste: 'Agent', service: 'Scolarité', departement: null },
    ];
    for (const p of personnels) {
        await db_1.default.execute('INSERT INTO personnel (user_id, poste, service, departement) VALUES (?, ?, ?, ?)', [userIds[p.idx], p.poste, p.service, p.departement]);
    }
    console.log('✅ Profils créés');
    // Récupérer IDs étudiants
    const [etudiants] = await db_1.default.execute('SELECT id, user_id FROM etudiant ORDER BY id');
    const eIds = etudiants.map((e) => e.id);
    // 12 requêtes réparties sur les 9 étudiants
    // Effet académique : Dylane, Austin, Oumar, Aurore
    // Correction nom : Arsene, Dave, Samuel
    // Contestation note : Bryan, Ulriane, Dylane, Austin, Oumar
    const requetes = [
        // Effet académique (4)
        { etudiant_id: eIds[0], type: 'effet_academique', statut: 'EN_ATTENTE', priorite: 'normale' }, // Dylane
        { etudiant_id: eIds[1], type: 'effet_academique', statut: 'EN_COURS', priorite: 'urgente' }, // Austin
        { etudiant_id: eIds[2], type: 'effet_academique', statut: 'VALIDEE', priorite: 'normale' }, // Oumar
        { etudiant_id: eIds[3], type: 'effet_academique', statut: 'CLOTUREE', priorite: 'normale' }, // Aurore
        // Correction nom (4)
        { etudiant_id: eIds[4], type: 'correction_nom', statut: 'EN_ATTENTE', priorite: 'normale' }, // Arsene
        { etudiant_id: eIds[5], type: 'correction_nom', statut: 'ATTENTE_INFO', priorite: 'normale' }, // Dave
        { etudiant_id: eIds[6], type: 'correction_nom', statut: 'REJETEE', priorite: 'normale' }, // Samuel
        { etudiant_id: eIds[7], type: 'correction_nom', statut: 'CLOTUREE', priorite: 'urgente' }, // Bryan
        // Contestation note (4)
        { etudiant_id: eIds[8], type: 'contestation_note', statut: 'EN_ATTENTE', priorite: 'normale' }, // Ulriane
        { etudiant_id: eIds[0], type: 'contestation_note', statut: 'EN_EXECUTION', priorite: 'urgente' }, // Dylane
        { etudiant_id: eIds[1], type: 'contestation_note', statut: 'VALIDEE', priorite: 'normale' }, // Austin
        { etudiant_id: eIds[2], type: 'contestation_note', statut: 'CLOTUREE', priorite: 'normale' }, // Oumar
    ];
    const requeteIds = [];
    for (const r of requetes) {
        const [result] = await db_1.default.execute('INSERT INTO requete (etudiant_id, type, statut, priorite) VALUES (?, ?, ?, ?)', [r.etudiant_id, r.type, r.statut, r.priorite]);
        requeteIds.push(result.insertId);
    }
    // Sous-tables
    for (let i = 0; i < 4; i++) {
        await db_1.default.execute('INSERT INTO requete_attestation (requete_id, type_document, annee_academique, motif) VALUES (?, ?, ?, ?)', [requeteIds[i], 'attestation_scolarite', '2023-2024', 'Demande pour dossier de bourse']);
    }
    for (let i = 4; i < 8; i++) {
        await db_1.default.execute('INSERT INTO requete_correction_nom (requete_id, ancien_nom, nouveau_nom, motif) VALUES (?, ?, ?, ?)', [requeteIds[i], 'DJONKOUN', 'DJONKOUNG', 'Erreur orthographique sur acte de naissance']);
    }
    for (let i = 8; i < 12; i++) {
        await db_1.default.execute('INSERT INTO requete_note (requete_id, code_matiere, note_actuelle, note_contestee, motif_contestation, id_enseignant) VALUES (?, ?, ?, ?, ?, ?)', [requeteIds[i], 'INF301', 8.5, 12.0, 'La note ne correspond pas à ma copie corrigée rendue en cours lors de la session de janvier 2024', userIds[15]]);
    }
    console.log('✅ 12 requêtes créées avec sous-tables');
    // Historiques
    const secretariatId = userIds[9];
    const directeurId = userIds[13];
    const scolariteId = userIds[19];
    for (let i = 0; i < requeteIds.length; i++) {
        const etudiantUserId = userIds[etudiants[requetes[i].etudiant_id - eIds[0]]?.id - 1] || userIds[0];
        await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [requeteIds[i], null, 'EN_ATTENTE', userIds[i % 9], 'Requête soumise par l\'étudiant']);
        if (['EN_COURS', 'ATTENTE_INFO', 'VALIDEE', 'EN_EXECUTION', 'REJETEE', 'CLOTUREE'].includes(requetes[i].statut)) {
            await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [requeteIds[i], 'EN_ATTENTE', 'EN_COURS', secretariatId, 'Dossier réceptionné par le secrétariat']);
        }
        if (['VALIDEE', 'EN_EXECUTION', 'CLOTUREE'].includes(requetes[i].statut)) {
            await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [requeteIds[i], 'EN_COURS', 'VALIDEE', directeurId, 'Dossier validé par la direction']);
        }
        if (requetes[i].statut === 'EN_EXECUTION') {
            await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [requeteIds[i], 'VALIDEE', 'EN_EXECUTION', userIds[17], 'Modification en cours par la cellule informatique']);
        }
        if (requetes[i].statut === 'CLOTUREE') {
            await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [requeteIds[i], 'EN_EXECUTION', 'CLOTUREE', scolariteId, 'Dossier clôturé avec succès']);
        }
        if (requetes[i].statut === 'REJETEE') {
            await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [requeteIds[i], 'EN_COURS', 'REJETEE', directeurId, 'Dossier incomplet — pièces insuffisantes']);
        }
        if (requetes[i].statut === 'ATTENTE_INFO') {
            await db_1.default.execute('INSERT INTO historique_statut (requete_id, ancien_statut, nouveau_statut, change_par, commentaire) VALUES (?, ?, ?, ?, ?)', [requeteIds[i], 'EN_COURS', 'ATTENTE_INFO', secretariatId, 'Pièce manquante : Quitus requis']);
        }
    }
    console.log('✅ Historiques créés');
    // Notifications
    for (let i = 0; i < requeteIds.length; i++) {
        await db_1.default.execute('INSERT INTO notification (user_id, requete_id, message) VALUES (?, ?, ?)', [userIds[requetes[i].etudiant_id - eIds[0]], requeteIds[i], `Votre requête #${requeteIds[i]} a été soumise avec succès`]);
    }
    console.log('✅ Notifications créées');
    console.log('🎉 Seed terminé avec succès !');
    process.exit(0);
}
seed().catch((err) => {
    console.error('❌ Erreur seed:', err);
    process.exit(1);
});
