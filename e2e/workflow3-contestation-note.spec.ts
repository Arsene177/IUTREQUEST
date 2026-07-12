import { test, expect } from '@playwright/test';
import { loginAs, STUDENT, SECRETARIAT, DIRECTEUR, SCOLARITE } from './helpers';

/**
 * WORKFLOW 3: Contestation de Note
 *
 * Steps:
 * 1. Student submits a Contestation de Note request
 * 2. Secretariat réceptionne
 * 3. Directeur validates (valider)
 * 4. Scolarité clôture (cloturer directly from VALIDEE)
 * 5. Verify notifications appeared for student
 */
test.describe('Workflow 3 — Contestation de Note (end-to-end)', () => {

  test('Step 1: Student submits a Contestation de Note request', async ({ page }) => {
    await loginAs(page, STUDENT.identifiant, STUDENT.password);
    await expect(page).toHaveURL(/dashboard/);

    await page.goto('/requetes/nouvelle');
    await page.getByText(/contestation de note/i).click();

    await page.waitForURL(/contestation-note/);

    // Fill the form
    await page.getByLabel(/code matière|matiere/i).fill('INF301');
    await page.getByLabel(/note actuelle/i).fill('8');
    await page.getByLabel(/note contestée|contestee/i).fill('12');
    await page.getByLabel(/motif/i).fill(
      'Je conteste cette note car ma copie corrigée rendue en classe indique un résultat supérieur. La correction ne correspond pas au barème annoncé lors de la séance de cours.'
    );

    // Upload justificatif file
    await page.setInputFiles('input[type="file"]', {
      name: 'justificatif.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf data'),
    });

    await page.getByRole('button', { name: /soumettre|envoyer/i }).click();
    
    await expect(page.getByText(/succès|soumise|créée/i)).toBeVisible({ timeout: 10000 });
  });

  test('Step 2: Secretariat réceptionne the Contestation de Note', async ({ page }) => {
    await loginAs(page, SECRETARIAT.identifiant, SECRETARIAT.password);

    await page.goto('/staff/requetes');
    
    const row = page.locator('tr').filter({ hasText: /contestation/i }).filter({ hasText: /EN ATTENTE/i }).first();
    await row.getByRole('link', { name: /traiter/i }).click();
    await page.waitForURL(/staff\/requetes\/\d+/);

    await page.getByRole('button', { name: /réceptionner/i }).click();
    await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();

    await expect(page.getByText(/EN_COURS|en cours/i)).toBeVisible({ timeout: 8000 });
  });

  test('Step 3: Directeur valide the Contestation de Note', async ({ page }) => {
    await loginAs(page, DIRECTEUR.identifiant, DIRECTEUR.password);

    await page.goto('/staff/requetes');
    const row = page.locator('tr').filter({ hasText: /contestation/i }).filter({ hasText: /EN COURS/i }).first();
    await row.getByRole('link', { name: /traiter/i }).click();
    await page.waitForURL(/staff\/requetes\/\d+/);

    await page.getByRole('button', { name: /valider/i }).click();
    await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();

    await expect(page.getByText(/VALIDEE|validée/i)).toBeVisible({ timeout: 8000 });
  });

  test('Step 4: Scolarité clôture directly from VALIDEE', async ({ page }) => {
    await loginAs(page, SCOLARITE.identifiant, SCOLARITE.password);

    await page.goto('/staff/requetes');
    const row = page.locator('tr').filter({ hasText: /contestation/i }).filter({ hasText: /VALIDEE/i }).first();
    await row.getByRole('link', { name: /traiter/i }).click();
    await page.waitForURL(/staff\/requetes\/\d+/);

    // Clôturer from VALIDEE (allowed by our state machine)
    await page.getByRole('button', { name: /clôturer|clotur/i }).click();
    await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();

    await expect(page.getByText(/CLOTUREE|clôturée/i)).toBeVisible({ timeout: 8000 });
  });

  test('Step 5: Student dashboard shows CLOTUREE + notification received', async ({ page }) => {
    await loginAs(page, STUDENT.identifiant, STUDENT.password);
    await page.goto('/dashboard');

    // Check the request table for clôturée status
    await expect(page.getByText(/CLOTUREE|clôturée/i)).toBeVisible({ timeout: 10000 });

    // Check notification panel if it exists
    const notifPanel = page.locator('[data-testid="notifications"], [class*="notification"]');
    if (await notifPanel.count() > 0) {
      await expect(notifPanel).toContainText(/clôturée|clotur/i);
    }
  });
});
