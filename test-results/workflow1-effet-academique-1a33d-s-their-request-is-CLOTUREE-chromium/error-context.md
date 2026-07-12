# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow1-effet-academique.spec.ts >> Workflow 1 — Effet Académique (end-to-end) >> Step 7: Student sees their request is CLOTUREE
- Location: e2e\workflow1-effet-academique.spec.ts:104:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/CLOTUREE|clôturée/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/CLOTUREE|clôturée/i)

```

```yaml
- complementary:
  - text: J JANNGO DB
  - paragraph: Dylane BOBDA
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
  - paragraph: 25/06/2026 10:40
  - button "Notifications"
  - link "Nouvelle requête":
    - /url: /requetes/nouvelle
- main:
  - paragraph: "3"
  - paragraph: Totaux
  - paragraph: "2"
  - paragraph: En attentes
  - paragraph: "0"
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
      - row "#13 Effet académique 25/06/2026 En attente":
        - cell "#13"
        - cell "Effet académique"
        - cell "25/06/2026"
        - cell "En attente"
      - row "#1 Effet académique 25/06/2026 En attente":
        - cell "#1"
        - cell "Effet académique"
        - cell "25/06/2026"
        - cell "En attente"
      - row "#10 Contestation note 25/06/2026 En exécution":
        - cell "#10"
        - cell "Contestation note"
        - cell "25/06/2026"
        - cell "En exécution"
- button "Ouvrir l'assistant IUTRequest"
- button
- alert
```

# Test source

```ts
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
  55  |     await page.goto('/staff/requetes');
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
> 109 |     await expect(page.getByText(/CLOTUREE|clôturée/i)).toBeVisible({ timeout: 10000 });
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  110 |   });
  111 | });
  112 | 
```