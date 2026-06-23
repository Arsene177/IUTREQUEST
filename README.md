# IUTRequest — Portail Étudiant

Frontend Next.js (App Router, TypeScript, Tailwind CSS v4) pour le portail étudiant
de la plateforme IUTRequest — gestion des requêtes administratives de l'IUT de Douala.

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis ajuster NEXT_PUBLIC_API_URL si besoin
npm run dev
```

Ouvrir http://localhost:3000

Par défaut, l'app attend un backend sur http://localhost:3001 (voir .env.example).

## Police (optionnel)

Le projet utilise actuellement une pile de polices système (pas de dépendance
réseau au build, utile pour environnements sans accès internet). Pour repasser
sur Inter via next/font/google (recommandé en prod, nécessite un accès internet
au moment du build) :

Dans src/app/layout.tsx :
```tsx
import { Inter } from "next/font/google";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// puis className={`${inter.variable} h-full antialiased`} sur <html>
```

Dans src/app/globals.css, remplacer la ligne `--font-sans: -apple-system, ...`
par `--font-sans: var(--font-inter);`.

## Structure

```
src/
├── app/
│   ├── (auth)/login, mot-de-passe-oublie/
│   ├── (dashboard)/dashboard, requetes/, parametres/
│   ├── layout.tsx          <- providers (Auth, Toast)
│   └── globals.css         <- design tokens IUTRequest
├── components/
│   ├── ui/                 <- Button, TextField, FileDropzone, Modal, etc.
│   ├── layout/              <- Sidebar, Header, RequireAuth
│   ├── dashboard/ requetes/ chatbot/
├── context/                <- AuthContext, ToastContext, MobileSidebarContext
├── hooks/                  <- useMesRequetes, useSubmitRequete
├── lib/
│   ├── api-client.ts        <- axios + intercepteurs JWT
│   ├── api/                 <- auth.ts, requetes.ts, notifications.ts
│   ├── constants.ts, format.ts, validation.ts (schémas Zod)
└── types/index.ts           <- types alignés sur le schéma SQL backend
```

## Comptes de test (seed backend de référence)

Mot de passe universel : password123
Matricules : IUT2024001 à IUT2024009

## Routes principales

| Route | Description |
|---|---|
| /login | Connexion (matricule ou email + mot de passe) |
| /mot-de-passe-oublie | Récupération de mot de passe |
| /dashboard | Tableau de bord : stats, liste des requêtes, chatbot |
| /requetes/nouvelle | Sélection du type de requête |
| /requetes/nouvelle/effet-academique | Formulaire effet académique |
| /requetes/nouvelle/correction-nom | Formulaire correction de nom |
| /requetes/nouvelle/contestation-note | Formulaire contestation de note |
| /requetes/[id] | Détail d'une requête + timeline + historique |
| /parametres | Changement de mot de passe |

## Notes d'intégration backend

- Le login accepte un champ `identifiant` (matricule OU email) — le backend
  doit résoudre les deux.
- La soumission d'une requête se fait en 2 appels côté client (transparents pour
  l'étudiant) : POST /requetes puis POST /requetes/:id/documents.
- Le chatbot widget est câblé sur POST /chatbot/message (à brancher par l'équipe
  chatbot) ; en attendant, seuls les raccourcis de redirection (vers les
  formulaires) sont fonctionnels.
- `POST /auth/forgot-password` peut renvoyer un champ `debug_mot_de_passe`
  (mode développement, pas de service d'email branché) ; la page
  `/mot-de-passe-oublie` l'affiche alors directement à l'écran. Ce champ est
  absent en production / sur le backend d'équipe final.

## Backend associé

Un backend de développement personnel (Express + TypeScript + MySQL),
fidèle au schéma et au contrat API du backend d'équipe de référence, est
disponible séparément (`iutrequest-backend`). Voir son README pour
l'installation MySQL et les comptes de test.
