# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow1-effet-academique.spec.ts >> Workflow 1 — Effet Académique (end-to-end) >> Step 4: Secretariat réceptionne the request
- Location: e2e\workflow1-effet-academique.spec.ts:52:7

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
  - alert [ref=e25]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAs, logout, STUDENT, SECRETARIAT, DIRECTEUR, SCOLARITE } from './helpers';
  3   | 
  4   | /**
  5   |  * WORKFLOW 1: Effet Académique
  6   |  *
  7   |  * Steps:
  8   |  * 1. Student logs in
  9   |  * 2. Student navigates to new request → chooses "Effet académique"
  10  |  * 3. Student fills the form and submits
  11  |  * 4. Secretariat logs in → receives and processes the request (receptionner)
  12  |  * 5. Directeur logs in → validates the request (valider)
  13  |  * 6. Scolarite logs in → executes then closes the request (executer → cloturer)
  14  |  * 7. Student logs back in → confirms request status is CLOTUREE
  15  |  */
  16  | test.describe('Workflow 1 — Effet Académique (end-to-end)', () => {
  17  |   let requeteId: string;
  18  | 
  19  |   test('Step 1-3: Student submits an Effet Académique request', async ({ page }) => {
  20  |     await loginAs(page, STUDENT.identifiant, STUDENT.password);
  21  |     await expect(page).toHaveURL(/dashboard/);
  22  | 
  23  |     // Navigate to new request
  24  |     await page.goto('/requetes/nouvelle');
  25  |     await expect(page.getByText(/effet académique/i)).toBeVisible();
  26  |     await page.getByText(/effet académique/i).click();
  27  | 
  28  |     // Fill the form
  29  |     await page.waitForURL(/effet-academique/);
  30  |     await page.getByLabel(/nom de l'effet académique/i).selectOption('attestation_scolarite');
  31  |     await page.getByPlaceholder(/Ex: 2023/i).fill('2023');
  32  |     await page.getByPlaceholder(/Ex: 2024/i).fill('2024');
  33  |     await page.getByLabel(/description/i).fill('Demande de justification pour bourse universitaire 2024.');
  34  | 
  35  |     // Upload justificatif file
  36  |     await page.setInputFiles('input[type="file"]', {
  37  |       name: 'justificatif.pdf',
  38  |       mimeType: 'application/pdf',
  39  |       buffer: Buffer.from('mock pdf data'),
  40  |     });
  41  | 
  42  |     // Submit
  43  |     await page.getByRole('button', { name: /soumettre|envoyer/i }).click();
  44  |     
  45  |     // Should redirect to requetes list or show success
  46  |     await expect(page.getByText(/succès|soumise|créée/i)).toBeVisible({ timeout: 10000 });
  47  | 
  48  |     // Store the request ID from URL or page content for later steps
  49  |     await page.waitForURL(/requetes/);
  50  |   });
  51  | 
  52  |   test('Step 4: Secretariat réceptionne the request', async ({ page }) => {
  53  |     await loginAs(page, SECRETARIAT.identifiant, SECRETARIAT.password);
  54  |     
> 55  |     await page.goto('/staff/requetes');
      |                ^ Error: page.goto: net::ERR_ABORTED at http://localhost:3000/staff/requetes
  56  |     await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
  57  | 
  58  |     // Find the EN_ATTENTE request and open it
  59  |     const row = page.locator('tr').filter({ hasText: 'EN ATTENTE' }).first();
  60  |     await row.getByRole('link', { name: /traiter/i }).click();
  61  |     
  62  |     await page.waitForURL(/staff\/requetes\/\d+/);
  63  |     requeteId = page.url().split('/').pop() || '';
  64  | 
  65  |     // Click Réceptionner
  66  |     await page.getByRole('button', { name: /réceptionner/i }).click();
  67  |     await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
  68  |     
  69  |     await expect(page.getByText(/EN COURS|réceptionnée/i)).toBeVisible({ timeout: 8000 });
  70  |   });
  71  | 
  72  |   test('Step 5: Directeur validates the request', async ({ page }) => {
  73  |     await loginAs(page, DIRECTEUR.identifiant, DIRECTEUR.password);
  74  | 
  75  |     await page.goto('/staff/requetes');
  76  |     const row = page.locator('tr').filter({ hasText: 'EN COURS' }).first();
  77  |     await row.getByRole('link', { name: /traiter/i }).click();
  78  |     
  79  |     await page.waitForURL(/staff\/requetes\/\d+/);
  80  |     await page.getByRole('button', { name: /valider/i }).click();
  81  |     await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
  82  | 
  83  |     await expect(page.getByText(/VALIDEE|validée/i)).toBeVisible({ timeout: 8000 });
  84  |   });
  85  | 
  86  |   test('Step 6: Scolarité exécute then clôture the request', async ({ page }) => {
  87  |     await loginAs(page, SCOLARITE.identifiant, SCOLARITE.password);
  88  | 
  89  |     await page.goto('/staff/requetes');
  90  |     const row = page.locator('tr').filter({ hasText: 'VALIDEE' }).first();
  91  |     await row.getByRole('link', { name: /traiter/i }).click();
  92  | 
  93  |     await page.waitForURL(/staff\/requetes\/\d+/);
  94  |     await page.getByRole('button', { name: /exécution|executer/i }).click();
  95  |     await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
  96  |     await expect(page.getByText(/EN_EXECUTION|exécution/i)).toBeVisible({ timeout: 8000 });
  97  | 
  98  |     // Clôturer
  99  |     await page.getByRole('button', { name: /clôturer|clotur/i }).click();
  100 |     await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
  101 |     await expect(page.getByText(/CLOTUREE|clôturée/i)).toBeVisible({ timeout: 8000 });
  102 |   });
  103 | 
  104 |   test('Step 7: Student sees their request is CLOTUREE', async ({ page }) => {
  105 |     await loginAs(page, STUDENT.identifiant, STUDENT.password);
  106 |     await page.goto('/dashboard');
  107 | 
  108 |     // The student's requetes table should show CLOTUREE status
  109 |     await expect(page.getByText(/CLOTUREE|clôturée/i)).toBeVisible({ timeout: 10000 });
  110 |   });
  111 | });
  112 | 
```