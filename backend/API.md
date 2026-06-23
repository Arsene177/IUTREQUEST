# JANNGO API Documentation

Base URL : `http://localhost:3001`

Toutes les routes protégées nécessitent un header :
`Authorization: Bearer <token>`

---

## AUTH

### POST /auth/register
Créer un compte étudiant.

**Body :**
```json
{
  "nom": "BOBDA",
  "prenom": "Dylane",
  "email": "dylane.bobda@iut.cm",
  "password": "password123",
  "matricule": "IUT2024001",
  "filiere": "Informatique",
  "niveau": "L2"
}
```

**Réponses :**
- `201` : Compte créé avec succès
- `409` : Email déjà utilisé
- `500` : Erreur serveur

---

### POST /auth/login
Connexion et récupération du token JWT.

**Body :**
```json
{
  "email": "dylane.bobda@iut.cm",
  "password": "password123"
}
```

**Réponses :**
- `200` : `{ token, user: { id, nom, prenom, email, role } }`
- `401` : Mot de passe incorrect
- `404` : Utilisateur introuvable
- `500` : Erreur serveur

---

### GET /auth/me
Récupérer le profil de l'utilisateur connecté + nb notifications non lues.

**Headers :** Authorization requis

**Réponses :**
- `200` : `{ user, notifications_non_lues }`
- `401` : Token manquant ou invalide
- `404` : Utilisateur introuvable

---

## REQUETES (Etudiant)

### POST /requetes
Créer une nouvelle requête.

**Headers :** Authorization requis — role : etudiant

**Body (effet_academique) :**
```json
{
  "type": "effet_academique",
  "priorite": "normale",
  "type_document": "attestation_scolarite",
  "annee_academique": "2023-2024",
  "motif": "Dossier de bourse"
}
```

**Body (correction_nom) :**
```json
{
  "type": "correction_nom",
  "priorite": "normale",
  "ancien_nom": "DJONKOUN",
  "nouveau_nom": "DJONKOUNG",
  "motif": "Erreur orthographique"
}
```

**Body (contestation_note) :**
```json
{
  "type": "contestation_note",
  "priorite": "normale",
  "code_matiere": "INF301",
  "note_actuelle": 8.5,
  "note_contestee": 12.0,
  "motif_contestation": "La note ne correspond pas à ma copie corrigée rendue en cours",
  "id_enseignant": 16
}
```

**Réponses :**
- `201` : `{ message, requete_id }`
- `400` : Champs manquants ou invalides
- `403` : Acces reserve aux etudiants
- `500` : Erreur serveur

---

### GET /requetes/me
Liste paginée des requêtes de l'étudiant connecté.

**Headers :** Authorization requis — role : etudiant

**Query params :**
- `page` (defaut: 1)
- `limit` (defaut: 10)

**Réponses :**
- `200` : `{ requetes, pagination: { page, limit, total, pages } }`
- `403` : Acces reserve aux etudiants

---

### GET /requetes/:id
Détail d'une requête avec historique.

**Headers :** Authorization requis — role : etudiant

**Réponses :**
- `200` : `{ requete, details, historique }`
- `404` : Requête introuvable

---

### PUT /requetes/:id/annuler
Annuler une requête en statut EN_ATTENTE uniquement.

**Headers :** Authorization requis — role : etudiant

**Réponses :**
- `200` : Requête annulée avec succès
- `400` : Statut invalide pour annulation
- `404` : Requête introuvable

---

## DOCUMENTS

### POST /requetes/:id/documents
Uploader des pièces justificatives.

**Headers :** Authorization requis

**Body :** multipart/form-data
- `documents` : fichiers (PDF, JPG, PNG — max 5Mo par fichier)

**Réponses :**
- `201` : `{ message, documents: [{ id, nom, type, taille }] }`
- `400` : Aucun fichier ou type invalide
- `404` : Requête introuvable

---

### GET /requetes/:id/documents/:docId
Télécharger un document.

**Headers :** Authorization requis

**Réponses :**
- `200` : Fichier en téléchargement
- `404` : Document introuvable
