# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow2-correction-nom.spec.ts >> Workflow 2 — Correction de Nom (avec rejet) >> Step 1: Student submits a Correction de Nom request
- Location: e2e\workflow2-correction-nom.spec.ts:16:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel(/ancien nom/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e6]: J
        - generic [ref=e7]: JANNGO
      - generic [ref=e9]:
        - generic [ref=e11]: AD
        - generic [ref=e12]:
          - paragraph [ref=e13]: Austin DEUTOU
          - paragraph [ref=e14]: Étudiant
      - navigation [ref=e15]:
        - link "Tableau de bord" [ref=e16] [cursor=pointer]:
          - /url: /staff/dashboard
          - img [ref=e17]
          - text: Tableau de bord
        - link "Requêtes" [ref=e22] [cursor=pointer]:
          - /url: /staff/requetes
          - img [ref=e23]
          - text: Requêtes
        - link "Notifications" [ref=e26] [cursor=pointer]:
          - /url: /staff/notifications
          - img [ref=e27]
          - text: Notifications
        - link "Paramètres" [ref=e30] [cursor=pointer]:
          - /url: /staff/parametres
          - img [ref=e31]
          - text: Paramètres
      - button "Déconnexion" [ref=e35]:
        - img [ref=e36]
        - text: Déconnexion
    - generic [ref=e39]:
      - banner [ref=e40]:
        - generic [ref=e42]:
          - heading "Tableau de bord" [level=1] [ref=e43]
          - paragraph [ref=e44]: 25/06/2026 10:41
        - button "Notifications" [ref=e47]:
          - img [ref=e48]
      - main [ref=e51]:
        - navigation [ref=e52]:
          - link "Mes requêtes" [ref=e53] [cursor=pointer]:
            - /url: /dashboard
            - img [ref=e54]
            - text: Mes requêtes
          - generic [ref=e56]: ">"
          - generic [ref=e57]: correction de nom
        - generic [ref=e58]:
          - generic [ref=e59]:
            - heading "Correction de nom" [level=1] [ref=e60]
            - paragraph [ref=e61]: Modification de l'état civil dans les registres de l'IUT
          - generic [ref=e62]:
            - generic [ref=e63]:
              - generic [ref=e64]: Nom actuel (incorrect)
              - textbox "Nom actuel (incorrect)" [ref=e65]:
                - /placeholder: Nom tel qu'il apparaît dans le registre
            - generic [ref=e66]:
              - generic [ref=e67]: Nom correct (souhaité)
              - textbox "Nom correct (souhaité)" [ref=e68]:
                - /placeholder: Nom correct tel qu'il doit apparaître
            - generic [ref=e69]:
              - generic [ref=e70]: Description
              - textbox "Description" [ref=e71]:
                - /placeholder: Expliquez brièvement l'origine de l'erreur……
            - generic [ref=e72]:
              - generic [ref=e73]: Justificatif (CNI, acte de naissance)
              - button "Cliquer pour ajouter un fichier PDF, JPG, JPEG, PNG — MAX 5Mo" [ref=e74] [cursor=pointer]:
                - img [ref=e75]
                - generic [ref=e77]:
                  - paragraph [ref=e78]: Cliquer pour ajouter un fichier
                  - paragraph [ref=e79]: PDF, JPG, JPEG, PNG — MAX 5Mo
            - generic [ref=e80]:
              - link "Annuler" [ref=e81] [cursor=pointer]:
                - /url: /dashboard
                - button "Annuler" [ref=e82]
              - button "Soumettre la requête" [ref=e83] [cursor=pointer]
  - button [ref=e85]:
    - img [ref=e86]
  - alert [ref=e88]
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
> 26 |     await page.getByLabel(/ancien nom/i).fill('DEUTOU');
     |                                          ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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
  91 |     await expect(page.getByText(/REJETEE|rejetée/i)).toBeVisible({ timeout: 10000 });
  92 |   });
  93 | });
  94 | 
```