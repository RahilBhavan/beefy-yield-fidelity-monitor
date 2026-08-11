import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('calculator presents its model and methodology', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /yield/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Break-Even Analyzer' })).toBeVisible();
    await expect(page.getByRole('link', { name: /methodology and limitations/i })).toBeVisible({ timeout: 20_000 });
});

test('dashboard reports an honest unconfigured state', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /command center/i })).toBeVisible();
    await expect(page.getByText(/Supabase read credentials are not configured/i)).toBeVisible();
    await expect(page.getByText('Not Ready')).toBeVisible();
});

test('methodology page has no automated WCAG A/AA violations', async ({ page }) => {
    await page.goto('/methodology');
    await expect(page.getByRole('heading', { name: 'Methodology' })).toBeVisible();
    const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
    expect(results.violations).toEqual([]);
});

test('health and export expose explicit unconfigured states', async ({ request }) => {
    const health = await request.get('/api/health');
    expect(health.status()).toBe(503);
    await expect(health.json()).resolves.toMatchObject({ status: 'degraded' });

    const exportResponse = await request.get('/api/export');
    expect(exportResponse.status()).toBe(503);
    await expect(exportResponse.json()).resolves.toMatchObject({ code: 'DATA_NOT_CONFIGURED' });
});
