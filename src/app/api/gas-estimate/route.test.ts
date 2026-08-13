import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/gas-estimate/route';

describe('prepared transaction gas API', () => {
    it('rejects malformed transaction input before calling upstream services', async () => {
        const response = await POST(new Request('http://localhost/api/gas-estimate', {
            method: 'POST',
            body: JSON.stringify({ from: 'bad', to: 'bad', data: 'not-hex' }),
        }));
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toMatchObject({ code: 'INVALID_TRANSACTION' });
    });

    it('rejects requests over the per-IP rate limit with 429', async () => {
        const makeRequest = () => POST(new Request('http://localhost/api/gas-estimate', {
            method: 'POST',
            headers: { 'x-forwarded-for': '203.0.113.7' },
            body: JSON.stringify({ from: 'bad', to: 'bad', data: 'not-hex' }),
        }));
        for (let i = 0; i < 20; i += 1) {
            expect((await makeRequest()).status).toBe(400);
        }
        const limited = await makeRequest();
        expect(limited.status).toBe(429);
        await expect(limited.json()).resolves.toMatchObject({ code: 'RATE_LIMITED' });
    });
});
