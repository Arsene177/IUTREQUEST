# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow3-contestation-note.spec.ts >> Workflow 3 — Contestation de Note (end-to-end) >> Step 4: Scolarité clôture directly from VALIDEE
- Location: e2e\workflow3-contestation-note.spec.ts:74:7

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
  2   | import { loginAs, STUDENT, SECRETARIAT, DIRECTEUR, SCOLARITE } from './helpers';
  3   | 
  4   | /**
  5   |  * WORKFLOW 3: Contestation de Note
  6   |  *
  7   |  * Steps:
  8   |  * 1. Student submits a Contestation de Note request
  9   |  * 2. Secretariat réceptionne
  10  |  * 3. Directeur validates (valider)
  11  |  * 4. Scolarité clôture (cloturer directly from VALIDEE)
  12  |  * 5. Verify notifications appeared for student
  13  |  */
  14  | test.describe('Workflow 3 — Contestation de Note (end-to-end)', () => {
  15  | 
  16  |   test('Step 1: Student submits a Contestation de Note request', async ({ page }) => {
  17  |     await loginAs(page, STUDENT.identifiant, STUDENT.password);
  18  |     await expect(page).toHaveURL(/dashboard/);
  19  | 
  20  |     await page.goto('/requetes/nouvelle');
  21  |     await page.getByText(/contestation de note/i).click();
  22  | 
  23  |     await page.waitForURL(/contestation-note/);
  24  | 
  25  |     // Fill the form
  26  |     await page.getByLabel(/code matière|matiere/i).fill('INF301');
  27  |     await page.getByLabel(/note actuelle/i).fill('8');
  28  |     await page.getByLabel(/note contestée|contestee/i).fill('12');
  29  |     await page.getByLabel(/motif/i).fill(
  30  |       'Je conteste cette note car ma copie corrigée rendue en classe indique un résultat supérieur. La correction ne correspond pas au barème annoncé lors de la séance de cours.'
  31  |     );
  32  | 
  33  |     // Upload justificatif file
  34  |     await page.setInputFiles('input[type="file"]', {
  35  |       name: 'justificatif.pdf',
  36  |       mimeType: 'application/pdf',
  37  |       buffer: Buffer.from('mock pdf data'),
  38  |     });
  39  | 
  40  |     await page.getByRole('button', { name: /soumettre|envoyer/i }).click();
  41  |     
  42  |     await expect(page.getByText(/succès|soumise|créée/i)).toBeVisible({ timeout: 10000 });
  43  |   });
  44  | 
  45  |   test('Step 2: Secretariat réceptionne the Contestation de Note', async ({ page }) => {
  46  |     await loginAs(page, SECRETARIAT.identifiant, SECRETARIAT.password);
  47  | 
  48  |     await page.goto('/staff/requetes');
  49  |     
  50  |     const row = page.locator('tr').filter({ hasText: /contestation/i }).filter({ hasText: /EN ATTENTE/i }).first();
  51  |     await row.getByRole('link', { name: /traiter/i }).click();
  52  |     await page.waitForURL(/staff\/requetes\/\d+/);
  53  | 
  54  |     await page.getByRole('button', { name: /réceptionner/i }).click();
  55  |     await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
  56  | 
  57  |     await expect(page.getByText(/EN_COURS|en cours/i)).toBeVisible({ timeout: 8000 });
  58  |   });
  59  | 
  60  |   test('Step 3: Directeur valide the Contestation de Note', async ({ page }) => {
  61  |     await loginAs(page, DIRECTEUR.identifiant, DIRECTEUR.password);
  62  | 
  63  |     await page.goto('/staff/requetes');
  64  |     const row = page.locator('tr').filter({ hasText: /contestation/i }).filter({ hasText: /EN COURS/i }).first();
  65  |     await row.getByRole('link', { name: /traiter/i }).click();
  66  |     await page.waitForURL(/staff\/requetes\/\d+/);
  67  | 
  68  |     await page.getByRole('button', { name: /valider/i }).click();
  69  |     await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
  70  | 
  71  |     await expect(page.getByText(/VALIDEE|validée/i)).toBeVisible({ timeout: 8000 });
  72  |   });
  73  | 
  74  |   test('Step 4: Scolarité clôture directly from VALIDEE', async ({ page }) => {
  75  |     await loginAs(page, SCOLARITE.identifiant, SCOLARITE.password);
  76  | 
> 77  |     await page.goto('/staff/requetes');
      |                ^ Error: page.goto: net::ERR_ABORTED at http://localhost:3000/staff/requetes
  78  |     const row = page.locator('tr').filter({ hasText: /contestation/i }).filter({ hasText: /VALIDEE/i }).first();
  79  |     await row.getByRole('link', { name: /traiter/i }).click();
  80  |     await page.waitForURL(/staff\/requetes\/\d+/);
  81  | 
  82  |     // Clôturer from VALIDEE (allowed by our state machine)
  83  |     await page.getByRole('button', { name: /clôturer|clotur/i }).click();
  84  |     await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
  85  | 
  86  |     await expect(page.getByText(/CLOTUREE|clôturée/i)).toBeVisible({ timeout: 8000 });
  87  |   });
  88  | 
  89  |   test('Step 5: Student dashboard shows CLOTUREE + notification received', async ({ page }) => {
  90  |     await loginAs(page, STUDENT.identifiant, STUDENT.password);
  91  |     await page.goto('/dashboard');
  92  | 
  93  |     // Check the request table for clôturée status
  94  |     await expect(page.getByText(/CLOTUREE|clôturée/i)).toBeVisible({ timeout: 10000 });
  95  | 
  96  |     // Check notification panel if it exists
  97  |     const notifPanel = page.locator('[data-testid="notifications"], [class*="notification"]');
  98  |     if (await notifPanel.count() > 0) {
  99  |       await expect(notifPanel).toContainText(/clôturée|clotur/i);
  100 |     }
  101 |   });
  102 | });
  103 | 
```