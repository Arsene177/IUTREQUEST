# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow2-correction-nom.spec.ts >> Workflow 2 — Correction de Nom (avec rejet) >> Step 5: Student sees REJETEE status on their dashboard
- Location: e2e\workflow2-correction-nom.spec.ts:87:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/REJETEE|rejetée/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/REJETEE|rejetée/i)

```

```yaml
- complementary:
  - text: J JANNGO AD
  - paragraph: Austin DEUTOU
  - paragraph: Étudiant
  - navigation:
    - link "Tableau de bord":
      - /url: /staff/dashboard
    - link "Requêtes":
      - /url: /staff/requetes
    - link "Notifications":
      - /url: /staff/notifications
    - link "Paramètres":
      - /url: /staff/parametres
  - button "Déconnexion"
- banner:
  - heading "Tableau de bord" [level=1]
  - paragraph: 25/06/2026 10:42
  - button "Notifications"
  - link "Nouvelle requête":
    - /url: /requetes/nouvelle
- main:
  - paragraph: "2"
  - paragraph: Totaux
  - paragraph: "0"
  - paragraph: En attentes
  - paragraph: "1"
  - paragraph: En cours
  - paragraph: "1"
  - paragraph: Résolues
  - paragraph: "0"
  - paragraph: Rejetés
  - heading "Mes requêtes" [level=2]
  - button "En attente"
  - button "En cours"
  - button "Résolues"
  - button "Rejetés"
  - table:
    - rowgroup:
      - row "N° Sujet Date Statut":
        - columnheader "N°"
        - columnheader "Sujet"
        - columnheader "Date"
        - columnheader "Statut"
    - rowgroup:
      - row "#2 Effet académique 25/06/2026 En cours":
        - cell "#2"
        - cell "Effet académique"
        - cell "25/06/2026"
        - cell "En cours"
      - row "#11 Contestation note 25/06/2026 Validée":
        - cell "#11"
        - cell "Contestation note"
        - cell "25/06/2026"
        - cell "Validée"
- button "Ouvrir l'assistant IUTRequest"
- button
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs, STUDENT_2, SECRETARIAT, DIRECTEUR } from './helpers';
  3  | 
  4  | /**
  5  |  * WORKFLOW 2: Correction de Nom
  6  |  *
  7  |  * Steps:
  8  |  * 1. Student (Austin DEUTOU) submits a Correction de Nom request
  9  |  * 2. Secretariat réceptionne the request
  10 |  * 3. Directeur asks for additional info (demander-info)
  11 |  * 4. Directeur then rejects the request (rejeter)
  12 |  * 5. Student sees the REJETEE status and notification
  13 |  */
  14 | test.describe('Workflow 2 — Correction de Nom (avec rejet)', () => {
  15 | 
  16 |   test('Step 1: Student submits a Correction de Nom request', async ({ page }) => {
  17 |     await loginAs(page, STUDENT_2.identifiant, STUDENT_2.password);
  18 |     await expect(page).toHaveURL(/dashboard/);
  19 | 
  20 |     await page.goto('/requetes/nouvelle');
  21 |     await page.getByText(/correction de nom/i).click();
  22 | 
  23 |     await page.waitForURL(/correction-nom/);
  24 | 
  25 |     // Fill the form
  26 |     await page.getByLabel(/ancien nom/i).fill('DEUTOU');
  27 |     await page.getByLabel(/nouveau nom/i).fill('DEUTOU-MARTIN');
  28 |     await page.getByLabel(/motif/i).fill('Changement légal suite à acte de naissance rectifié.');
  29 | 
  30 |     // Upload justificatif file
  31 |     await page.setInputFiles('input[type="file"]', {
  32 |       name: 'justificatif.pdf',
  33 |       mimeType: 'application/pdf',
  34 |       buffer: Buffer.from('mock pdf data'),
  35 |     });
  36 | 
  37 |     await page.getByRole('button', { name: /soumettre|envoyer/i }).click();
  38 |     
  39 |     await expect(page.getByText(/succès|soumise|créée/i)).toBeVisible({ timeout: 10000 });
  40 |   });
  41 | 
  42 |   test('Step 2: Secretariat réceptionne the Correction de Nom request', async ({ page }) => {
  43 |     await loginAs(page, SECRETARIAT.identifiant, SECRETARIAT.password);
  44 | 
  45 |     await page.goto('/staff/requetes');
  46 |     // Filter by type
  47 |     await page.getByLabel(/type/i).selectOption('correction_nom').catch(() => {});
  48 |     
  49 |     const row = page.locator('tr').filter({ hasText: /EN ATTENTE/i }).first();
  50 |     await row.getByRole('link', { name: /traiter/i }).click();
  51 |     await page.waitForURL(/staff\/requetes\/\d+/);
  52 | 
  53 |     await page.getByRole('button', { name: /réceptionner/i }).click();
  54 |     await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
  55 | 
  56 |     await expect(page.getByText(/EN_COURS|en cours/i)).toBeVisible({ timeout: 8000 });
  57 |   });
  58 | 
  59 |   test('Step 3: Directeur asks for more info', async ({ page }) => {
  60 |     await loginAs(page, DIRECTEUR.identifiant, DIRECTEUR.password);
  61 | 
  62 |     await page.goto('/staff/requetes');
  63 |     const row = page.locator('tr').filter({ hasText: /correction/i }).filter({ hasText: /EN COURS/i }).first();
  64 |     await row.getByRole('link', { name: /traiter/i }).click();
  65 |     await page.waitForURL(/staff\/requetes\/\d+/);
  66 | 
  67 |     await page.getByRole('button', { name: /demander info/i }).click();
  68 |     await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
  69 | 
  70 |     await expect(page.getByText(/ATTENTE_INFO|attente info/i)).toBeVisible({ timeout: 8000 });
  71 |   });
  72 | 
  73 |   test('Step 4: Directeur rejects the request', async ({ page }) => {
  74 |     await loginAs(page, DIRECTEUR.identifiant, DIRECTEUR.password);
  75 | 
  76 |     await page.goto('/staff/requetes');
  77 |     const row = page.locator('tr').filter({ hasText: /ATTENTE_INFO/i }).first();
  78 |     await row.getByRole('link', { name: /traiter/i }).click();
  79 |     await page.waitForURL(/staff\/requetes\/\d+/);
  80 | 
  81 |     await page.getByRole('button', { name: /rejeter/i }).click();
  82 |     await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
  83 | 
  84 |     await expect(page.getByText(/REJETEE|rejetée/i)).toBeVisible({ timeout: 8000 });
  85 |   });
  86 | 
  87 |   test('Step 5: Student sees REJETEE status on their dashboard', async ({ page }) => {
  88 |     await loginAs(page, STUDENT_2.identifiant, STUDENT_2.password);
  89 |     await page.goto('/dashboard');
  90 | 
> 91 |     await expect(page.getByText(/REJETEE|rejetée/i)).toBeVisible({ timeout: 10000 });
     |                                                      ^ Error: expect(locator).toBeVisible() failed
  92 |   });
  93 | });
  94 | 
```