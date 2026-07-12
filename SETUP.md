# JANNGO — Setup rapide (sans Docker)

## Prérequis

- Node.js 20+
- MySQL 8 (ou MariaDB) installé localement

## 1. Base de données

```bash
mysql -u root -p < backend/src/config/init_db.sql
```

## 2. Backend

```bash
cd backend
cp .env.example .env
# Éditez .env : mot de passe MySQL + JWT_SECRET
npm install
npm run seed
npm run dev
```

API : http://localhost:3001

## 3. Frontend

```bash
cd ..
cp .env.local.example .env.local
npm install
npm run dev
```

App : http://localhost:3000

## Comptes de test (seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Étudiant | matricule `IUT2024001` | password123 |
| Secrétariat | paul.essomba@iut.cm | password123 |
| Directeur adjoint | henri.biya@iut.cm | password123 |
| Directeur | pierre.mvondo@iut.cm | password123 |
| Département | marc.ngono@iut.cm | password123 |
| Cellule info | serge.mbia@iut.cm | password123 |
| Scolarité | jules.abega@iut.cm | password123 |

## Flux rapide — Effet académique

1. Étudiant : nouvelle requête → effet académique
2. Secrétariat : réceptionner → (optionnel) acheminer vers directeur adjoint
3. Directeur adjoint : valider
4. Scolarité : exécuter → clôturer
5. Étudiant : statut CLOTUREE sur le dashboard
