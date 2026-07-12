import { test, expect } from '@playwright/test';
import { loginAs, STUDENT_2, SECRETARIAT, DIRECTEUR } from './helpers';

/**
 * WORKFLOW 2: Correction de Nom
 *
 * Steps:
 * 1. Student (Austin DEUTOU) submits a Correction de Nom request
 * 2. Secretariat réceptionne the request
 * 3. Directeur asks for additional info (demander-info)
 * 4. Directeur then rejects the request (rejeter)
 * 5. Student sees the REJETEE status and notification
 */
test.describe('Workflow 2 — Correction de Nom (avec rejet)', () => {

  test('Step 1: Student submits a Correction de Nom request', async ({ page }) => {
    await loginAs(page, STUDENT_2.identifiant, STUDENT_2.password);
    await expect(page).toHaveURL(/dashboard/);

    await page.goto('/requetes/nouvelle');
    await page.getByText(/correction de nom/i).click();

    await page.waitForURL(/correction-nom/);

    // Fill the form
    await page.getByLabel(/ancien nom/i).fill('DEUTOU');
    await page.getByLabel(/nouveau nom/i).fill('DEUTOU-MARTIN');
    await page.getByLabel(/motif/i).fill('Changement légal suite à acte de naissance rectifié.');

    // Upload justificatif file
    await page.setInputFiles('input[type="file"]', {
      name: 'justificatif.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf data'),
    });

    await page.getByRole('button', { name: /soumettre|envoyer/i }).click();
    
    await expect(page.getByText(/succès|soumise|créée/i)).toBeVisible({ timeout: 10000 });
  });

  test('Step 2: Secretariat réceptionne the Correction de Nom request', async ({ page }) => {
    await loginAs(page, SECRETARIAT.identifiant, SECRETARIAT.password);

    await page.goto('/staff/requetes');
    // Filter by type
    await page.getByLabel(/type/i).selectOption('correction_nom').catch(() => {});
    
    const row = page.locator('tr').filter({ hasText: /EN ATTENTE/i }).first();
    await row.getByRole('link', { name: /traiter/i }).click();
    await page.waitForURL(/staff\/requetes\/\d+/);

    await page.getByRole('button', { name: /réceptionner/i }).click();
    await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();

    await expect(page.getByText(/EN_COURS|en cours/i)).toBeVisible({ timeout: 8000 });
  });

  test('Step 3: Directeur asks for more info', async ({ page }) => {
    await loginAs(page, DIRECTEUR.identifiant, DIRECTEUR.password);

    await page.goto('/staff/requetes');
    const row = page.locator('tr').filter({ hasText: /correction/i }).filter({ hasText: /EN COURS/i }).first();
    await row.getByRole('link', { name: /traiter/i }).click();
    await page.waitForURL(/staff\/requetes\/\d+/);

    await page.getByRole('button', { name: /demander info/i }).click();
    await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();

    await expect(page.getByText(/ATTENTE_INFO|attente info/i)).toBeVisible({ timeout: 8000 });
  });

  test('Step 4: Directeur rejects the request', async ({ page }) => {
    await loginAs(page, DIRECTEUR.identifiant, DIRECTEUR.password);

    await page.goto('/staff/requetes');
    const row = page.locator('tr').filter({ hasText: /ATTENTE_INFO/i }).first();
    await row.getByRole('link', { name: /traiter/i }).click();
    await page.waitForURL(/staff\/requetes\/\d+/);

    await page.getByRole('button', { name: /rejeter/i }).click();
    await page.getByRole('button', { name: /oui|confirmer|ok/i }).click();

    await expect(page.getByText(/REJETEE|rejetée/i)).toBeVisible({ timeout: 8000 });
  });

  test('Step 5: Student sees REJETEE status on their dashboard', async ({ page }) => {
    await loginAs(page, STUDENT_2.identifiant, STUDENT_2.password);
    await page.goto('/dashboard');

    await expect(page.getByText(/REJETEE|rejetée/i)).toBeVisible({ timeout: 10000 });
  });
});
