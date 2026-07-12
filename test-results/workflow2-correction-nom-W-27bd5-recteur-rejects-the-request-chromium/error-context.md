# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow2-correction-nom.spec.ts >> Workflow 2 — Correction de Nom (avec rejet) >> Step 4: Directeur rejects the request
- Location: e2e\workflow2-correction-nom.spec.ts:73:7

# Error details

```
Error: page.goto: net::ERR_ABORTED at http://localhost:3000/staff/requetes
Call log:
  - navigating to "http://localhost:3000/staff/requetes", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: IR
      - generic [ref=e7]: IUTRequest
    - generic [ref=e8]:
      - heading "CONNEXION" [level=1] [ref=e9]
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]: Matricule/ID
          - textbox "Matricule/ID" [ref=e13]:
            - /placeholder: "Ex: IUT2024001"
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]: Mot de passe
            - textbox "Mot de passe" [ref=e17]
          - link "Mot de passe oublié?" [ref=e19] [cursor=pointer]:
            - /url: /mot-de-passe-oublie
        - button "CONNEXION" [ref=e20] [cursor=pointer]
  - button [ref=e22]:
    - img [ref=e23]
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
> 76 |     await page.goto('/staff/requetes');
     |                ^ Error: page.goto: net::ERR_ABORTED at http://localhost:3000/staff/requetes
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