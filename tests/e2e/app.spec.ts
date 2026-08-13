import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const calculatorData = {
    vaults: [{
        id: 'base-test-vault',
        name: 'Test Vault',
        chain: 'base',
        tvl: 1_250_000,
        apy: 0.12,
        performanceFee: 0.045,
    }],
    gas: {
        priceGwei: '0.01',
        entryCostUsd: 0.08,
        exitCostUsd: 0.05,
        estimatedCostUsd: 0.13,
        ethPrice: 3_000,
        assumptions: 'Deterministic browser-test estimate.',
        estimatedAt: '2026-08-12T12:00:00.000Z',
    },
    source: {
        beefyFetchedAt: '2026-08-12T12:00:00.000Z',
        chainId: 8453,
        requestId: 'e2e-fixture',
    },
};

test('calculator presents its model and methodology', async ({ page }) => {
    await page.route('**/api/data', (route) => route.fulfill({ json: calculatorData }));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /yield/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Break-Even Analyzer' })).toBeVisible();
    await expect(page.getByRole('link', { name: /methodology and limitations/i })).toBeVisible();
    await expect(page.getByText('Test Vault')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sensitivity analysis' })).toBeVisible();
    await expect(page.getByRole('table', { name: /break-even sensitivity/i })).toBeVisible();
});

test('homepage is accessible and does not overflow a mobile viewport', async ({ page }) => {
    await page.route('**/api/data', (route) => route.fulfill({ json: calculatorData }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
    expect(results.violations).toEqual([]);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('dashboard reports an honest unconfigured state', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/Supabase read credentials are not configured/i).first()).toBeVisible();
    await expect(page.getByText(/unavailable|not ready/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /restore the data pipeline/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Observation data unavailable' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Active Base vaults' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Active Base vaults' })).toBeVisible();

    const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
    expect(results.violations).toEqual([]);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('flagged strategies keeps one main landmark and fits mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/strategies');
    await expect(page.getByRole('heading', { name: 'Exceptions Requiring Review' })).toBeVisible();
    await expect(page.locator('main')).toHaveCount(1);
    const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
    expect(results.violations).toEqual([]);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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
