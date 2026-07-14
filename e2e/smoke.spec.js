import { test, expect } from '@playwright/test';

test('boots and shows Roman brand', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Imperivm Romanvm/i })).toBeVisible({ timeout: 30000 });
});

test('deep link selects event and year', async ({ page }) => {
  await page.goto('/?event=cam2&year=-55&lang=en');
  await expect(page.getByRole('heading', { name: /Imperivm Romanvm/i })).toBeVisible({ timeout: 30000 });
  await expect(page.locator('body')).toContainText(/Gallic|Gaul|War/i);
});

test('theme toggle persists allowlisted value', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Imperivm Romanvm/i })).toBeVisible({ timeout: 30000 });
  const themeBtn = page.getByRole('button', { name: /Theme|Tema/i }).first();
  if (await themeBtn.count()) {
    await themeBtn.click();
    const stored = await page.evaluate(() => localStorage.getItem('roma_theme'));
    expect(['dark', 'light']).toContain(stored);
  }
});
