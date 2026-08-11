import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseChain, getChainAdapter, withRpcRetry } from '@/lib/chains';

afterEach(() => vi.useRealTimers());

describe('chain adapters', () => {
    it('resolves the supported Base configuration', () => {
        expect(getChainAdapter('base')).toBe(baseChain);
        expect(baseChain.chainId).toBe(8453);
        expect(baseChain.rpcUrls.length).toBeGreaterThan(0);
    });

    it('rejects unsupported chains', () => {
        expect(getChainAdapter('arbitrum')).toBeNull();
    });

    it('retries transient RPC failures', async () => {
        vi.useFakeTimers();
        let attempts = 0;
        const result = withRpcRetry(async () => {
            attempts += 1;
            if (attempts < 3) throw new Error('transient');
            return 'ok';
        });

        await vi.runAllTimersAsync();
        await expect(result).resolves.toBe('ok');
        expect(attempts).toBe(3);
    });
});
