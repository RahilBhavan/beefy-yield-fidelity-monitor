import { afterEach, describe, expect, it, vi } from 'vitest';

const originalVercel = process.env.VERCEL;

afterEach(() => {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
});

async function makeRequest(headers?: HeadersInit) {
    const { POST } = await import('@/app/api/gas-estimate/route');
    return POST(new Request('http://localhost/api/gas-estimate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ from: 'bad', to: 'bad', data: 'not-hex' }),
    }));
}

describe('prepared transaction gas API', () => {
    it('rejects malformed transaction input before calling upstream services', async () => {
        vi.resetModules();
        const response = await makeRequest();
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toMatchObject({ code: 'INVALID_TRANSACTION' });
    });

    it('ignores spoofed forwarding headers outside Vercel', async () => {
        vi.resetModules();
        process.env.VERCEL = '';
        for (let i = 0; i < 20; i += 1) {
            const response = await makeRequest({
                'x-forwarded-for': `203.0.113.${i}`,
                'x-vercel-forwarded-for': `198.51.100.${i}`,
            });
            expect(response.status).toBe(400);
        }
        const limited = await makeRequest({ 'x-forwarded-for': '203.0.113.200' });
        expect(limited.status).toBe(429);
        await expect(limited.json()).resolves.toMatchObject({ code: 'RATE_LIMITED' });
    });

    it('limits each Vercel supplied client IP separately', async () => {
        vi.resetModules();
        process.env.VERCEL = '1';
        for (let i = 0; i < 20; i += 1) {
            expect((await makeRequest({ 'x-vercel-forwarded-for': '203.0.113.7' })).status).toBe(400);
        }
        expect((await makeRequest({ 'x-vercel-forwarded-for': '203.0.113.7' })).status).toBe(429);
        expect((await makeRequest({ 'x-vercel-forwarded-for': '203.0.113.8' })).status).toBe(400);
    });
});
