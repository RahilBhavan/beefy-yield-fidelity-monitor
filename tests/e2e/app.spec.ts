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

// Share price compounding at 3% a year while Beefy recorded 12%, one snapshot every 10 days.
const historyRows = [0, 10, 20, 30].map((day) => ({
    vault_id: 'base-test-vault',
    price_per_share: Math.pow(1.03, day / 365),
    target_apy: 0.12,
    tvl: 1_250_000,
    recorded_at: new Date(Date.UTC(2026, 6, 13) + day * 86_400_000).toISOString(),
    block_number: 1 + day,
    block_hash: '0xabc',
    contract_address: '0xvault',
    provider_label: 'e2e-fixture',
    validation_status: 'valid',
}));

test('calculator flips break-even days between headline and realized rates', async ({ page }) => {
    await page.route('**/api/data', (route) => route.fulfill({ json: calculatorData }));
    await page.route('**/api/export?*', (route) => route.fulfill({ json: { data: historyRows, requestId: 'e2e' } }));
    await page.goto('/');

    await page.getByLabel(/intended deposit size/i).fill('10');
    const rateGroup = page.getByRole('group', { name: /apy input/i });
    const headline = rateGroup.getByRole('radio', { name: /headline apy/i });
    const realized = rateGroup.getByRole('radio', { name: /realized share-price growth/i });
    const status = page.getByRole('status').filter({ hasText: /estimated time to recover fees/i });

    await expect(headline).toBeChecked();
    await expect(status).toContainText('42 days using the Headline APY (live) of 12.00%');
    await expect(realized).toBeEnabled();
    await expect(rateGroup).toContainText('Jul 13 to Aug 12, 2026 · 30.0 measured days · 4 snapshots');
    await expect(page.getByText(/share price is measured in the vault's lp token/i)).toBeVisible();

    await headline.focus();
    await page.keyboard.press('ArrowDown');
    await expect(rateGroup.getByRole('radio', { name: /time-weighted recorded apy/i })).toBeChecked();
    await page.keyboard.press('ArrowDown');
    await expect(realized).toBeChecked();
    await expect(status).toContainText('161 days using the Realized share-price growth of 3.00%');
    await expect(page.getByRole('table', { name: /break-even sensitivity/i })).toContainText('3.00%');
});

test('calculator disables historical rates when snapshot history is unavailable', async ({ page }) => {
    await page.route('**/api/data', (route) => route.fulfill({ json: calculatorData }));
    await page.goto('/');

    const realized = page.getByRole('radio', { name: /realized share-price growth/i });
    await expect(realized).toBeDisabled();
    await expect(page.getByRole('group', { name: /apy input/i }))
        .toContainText('Snapshot history is not configured on this deployment.');
    await expect(page.getByRole('radio', { name: /headline apy/i })).toBeChecked();
});

test('calculator presents its model and methodology', async ({ page }) => {
    await page.route('**/api/data', (route) => route.fulfill({ json: calculatorData }));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /make yield/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Break-Even Analyzer' })).toBeVisible();
    await expect(page.getByRole('link', { name: /methodology and limitations/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Test Vault/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sensitivity analysis' })).toBeVisible();
    await expect(page.getByRole('table', { name: /break-even sensitivity/i })).toBeVisible();
});

test('homepage is accessible and does not overflow a mobile viewport', async ({ page }) => {
    await page.route('**/api/data', (route) => route.fulfill({ json: calculatorData }));
    await page.route('**/api/export?*', (route) => route.fulfill({ json: { data: historyRows, requestId: 'e2e' } }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('radio', { name: /realized share-price growth/i }).check();
    // Hover an unselected rate so its hover background is part of the contrast check.
    await page.getByText('Headline APY (live)').hover();

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


test('deposit planning stays discoverable and recovers from invalid input and search', async ({ page }) => {
    await page.route('**/api/data', (route) => route.fulfill({ json: calculatorData }));
    await page.goto('/');
    const deposit = page.getByLabel(/intended deposit size/i);
    await expect(deposit).toBeVisible();
    const position = await deposit.boundingBox();
    expect(position?.y).toBeLessThan(page.viewportSize()!.width < 768 ? 720 : 900);
    await deposit.fill('0');
    await expect(page.getByText('Choose a vault and enter a deposit greater than $0 to see an estimate.')).toBeVisible();
    await deposit.fill('10');
    await expect(page.getByRole('status').filter({ hasText: /estimated time to recover fees/i })).toContainText('42 days');
    await expect(page.locator('.estimate-result')).toContainText('Test Vault');
    await page.getByLabel('Search vaults').fill('no such vault');
    await expect(page.getByText('No vaults match your search.')).toBeVisible();
    await page.getByLabel('Search vaults').fill('Test');
    await expect(page.getByRole('button', { name: /Test Vault/ })).toBeVisible();
});

test('calculator retries a failed rate request', async ({ page }) => {
    let unavailable = true;
    await page.route('**/api/data', (route) => {
        return route.fulfill(unavailable ? { status: 503, json: { error: 'Unavailable' } } : { json: calculatorData });
    });
    await page.goto('/');
    await expect(page.getByRole('alert').filter({ hasText: /Live vault or network data/i })).toBeVisible();
    unavailable = false;
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByLabel(/intended deposit size/i)).toBeVisible();
    await expect(page.locator('.estimate-result')).toContainText('Test Vault');
});
