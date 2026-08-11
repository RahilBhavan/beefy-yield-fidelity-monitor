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
});
