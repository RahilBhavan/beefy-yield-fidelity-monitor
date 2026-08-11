import { afterEach, describe, expect, it } from 'vitest';
import { GET } from '@/app/api/cron/scrape/route';

const originalCronSecret = process.env.CRON_SECRET;

afterEach(() => {
    if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalCronSecret;
});

describe('PPS scraper authentication', () => {
    it('fails closed when CRON_SECRET is missing', async () => {
        delete process.env.CRON_SECRET;
        const response = await GET(new Request('http://localhost/api/cron/scrape'));
        expect(response.status).toBe(401);
    });

    it('rejects an incorrect bearer token', async () => {
        process.env.CRON_SECRET = 'expected';
        const response = await GET(new Request('http://localhost/api/cron/scrape', {
            headers: { authorization: 'Bearer incorrect' },
        }));
        expect(response.status).toBe(401);
    });
});
