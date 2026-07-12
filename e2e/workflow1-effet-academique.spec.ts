import { test, expect } from '@playwright/test';
import { loginAs, logout, STUDENT, SECRETARIAT, DIRECTEUR, SCOLARITE } from './helpers';

/**
 * WORKFLOW 1: Effet Académique
 *
 * Steps:
 * 1. Student logs in
 * 2. Student navigates to new request → chooses "Effet académique"
 * 3. Student fills the form and submits
 * 4. Secretariat logs in → receives and processes the request (receptionner)
 * 5. Directeur logs in → validates the request (valider)
 * 6. Scolarite logs in → executes then closes the request (executer → cloturer)
 * 7. Student logs back in → confirms request status is CLOTUREE
 */
test.describe('Workflow 1 — Effet Académique (end-to-end)', () => {
  let requeteId: string;

  test('Step 1-3: Student submits an Effet Académique request', async ({ page }) => {
    await loginAs(page, STUDENT.identifiant, STUDENT.password);
    await expect(page).toHaveURL(/dashboard/);

    // Navigate to new request
    await page.goto('/requetes/nouvelle');
    await expect(page.getByText(/effet académique/i)).toBeVisible();
    await page.getByText(/effet académique/i).click();

    // Fill the form
    await page.waitForURL(/effet-academique/);
    await page.getByLabel(/nom de l'effet académique/i).selectOption('attestation_scolarite');
    await page.getByPlaceholder(/Ex: 2023/i).fill('2023');
    await page.getByPlaceholder(/Ex: 2024/i).fill('2024');
    await page.getByLabel(/description/i).fill('Demande de justification pour bourse universitaire 2024.');

    // Upload justificatif file
    await page.setInputFiles('input[type="file"]', {
      name: 'justificatif.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf data'),
    });

    // Submit
    await page.getByRole('button', { name: /soumettre|envoyer/i }).click();
    
    // Should redirect to requetes list or show success
    await expect(page.getByText(/succès|soumise|créée/i)).toBeVisible({ timeout: 10000 });

    // Store the request ID from URL or page content for later steps
    await page.waitForURL(/requetes/);
  });

  test('Step 4: Secretariat réceptionne the request', async ({ page }) => {
    await loginAs(page, SECRETARIAT.identifiant, SECRETARIAT.password);
    
    await page.goto('/staff/requetes');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Find the EN_ATTENTE request and open it
    const row = page.locator('tr').filter({ hasText: 'EN ATTENTE' }).first();
    await row.getByRole('link', { name: /traiter/i }).click();
    
    await page.waitForURL(/staff\/requetes\/\d+/);
    requeteId = page.url().split('/').pop() || '';

    // Click Réceptionner
    await page.getByRole('button', { name: /réceptionner/i }).click();
    await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
    
    await expect(page.getByText(/EN COURS|réceptionnée/i)).toBeVisible({ timeout: 8000 });
  });

  test('Step 5: Directeur validates the request', async ({ page }) => {
    await loginAs(page, DIRECTEUR.identifiant, DIRECTEUR.password);

    await page.goto('/staff/requetes');
    const row = page.locator('tr').filter({ hasText: 'EN COURS' }).first();
    await row.getByRole('link', { name: /traiter/i }).click();
    
    await page.waitForURL(/staff\/requetes\/\d+/);
    await page.getByRole('button', { name: /valider/i }).click();
    await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();

    await expect(page.getByText(/VALIDEE|validée/i)).toBeVisible({ timeout: 8000 });
  });

  test('Step 6: Scolarité exécute then clôture the request', async ({ page }) => {
    await loginAs(page, SCOLARITE.identifiant, SCOLARITE.password);

    await page.goto('/staff/requetes');
    const row = page.locator('tr').filter({ hasText: 'VALIDEE' }).first();
    await row.getByRole('link', { name: /traiter/i }).click();

    await page.waitForURL(/staff\/requetes\/\d+/);
    await page.getByRole('button', { name: /exécution|executer/i }).click();
    await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
    await expect(page.getByText(/EN_EXECUTION|exécution/i)).toBeVisible({ timeout: 8000 });

    // Clôturer
    await page.getByRole('button', { name: /clôturer|clotur/i }).click();
    await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();
    await expect(page.getByText(/CLOTUREE|clôturée/i)).toBeVisible({ timeout: 8000 });
  });

  test('Step 7: Student sees their request is CLOTUREE', async ({ page }) => {
    await loginAs(page, STUDENT.identifiant, STUDENT.password);
    await page.goto('/dashboard');

    // The student's requetes table should show CLOTUREE status
    await expect(page.getByText(/CLOTUREE|clôturée/i)).toBeVisible({ timeout: 10000 });
  });
});
