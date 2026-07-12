import { Page } from '@playwright/test';

// ─── Seed accounts from seed.ts ───────────────────────────────────────────
export const STUDENT = {
  identifiant: 'IUT2024001', // Dylane BOBDA
  password: 'password123',
};
export const STUDENT_2 = {
  identifiant: 'IUT2024002', // Austin DEUTOU
  password: 'password123',
};
export const SECRETARIAT = {
  email: 'paul.essomba@iut.cm',
  password: 'password123',
  identifiant: 'paul.essomba@iut.cm',
};
export const DIRECTEUR = {
  email: 'pierre.mvondo@iut.cm',
  password: 'password123',
  identifiant: 'pierre.mvondo@iut.cm',
};
export const SCOLARITE = {
  email: 'jules.abega@iut.cm',
  password: 'password123',
  identifiant: 'jules.abega@iut.cm',
};

// ─── Helper: Login ─────────────────────────────────────────────────────────
export async function loginAs(page: Page, identifiant: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/matricule|id/i).fill(identifiant);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole('button', { name: /connexion/i }).click();
  // Wait for navigation away from login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

// ─── Helper: Logout ────────────────────────────────────────────────────────
export async function logout(page: Page) {
  // Navigate to home which should redirect to login if token is cleared
  await page.evaluate(() => {
    localStorage.removeItem('iutrequest_token');
    localStorage.removeItem('janngo_user');
  });
  await page.goto('/login');
}
