// Ethereum reads that only count when two independent RPC providers return the same answer.
import { JsonRpcProvider } from 'ethers';

export const DEFAULT_RPC_URLS = [
    'https://eth.drpc.org',
    'https://1rpc.io/eth',
    'https://gateway.tenderly.co/public/mainnet',
    'https://eth-mainnet.public.blastapi.io',
    'https://rpc.mevblocker.io',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// A provider that fails this many calls in a row is skipped for the rest of the run.
const MAX_CONSECUTIVE_FAILURES = 6;

/** Run `task` over `items` with at most `limit` in flight, keeping the results in input order. */
export async function mapLimit(items, limit, task) {
    const results = new Array(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const index = next;
            next += 1;
            results[index] = await task(items[index], index);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
}

export class ChainReader {
    constructor(urls = DEFAULT_RPC_URLS, createProvider = (url) => new JsonRpcProvider(url, 1, { staticNetwork: true })) {
        this.providers = urls.map((url) => ({ url, failures: 0, provider: createProvider(url) }));
        this.used = new Set();
        this.blockCache = new Map();
    }

    get #live() {
        return this.providers.filter((entry) => entry.failures < MAX_CONSECUTIVE_FAILURES);
    }

    async #attempt(entry, operation) {
        let lastError;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                const value = await operation(entry.provider);
                entry.failures = 0;
                return value;
            } catch (error) {
                lastError = error;
                entry.failures += 1;
                await sleep(250 * 2 ** attempt);
            }
        }
        throw lastError;
    }

    /** Run `operation` on providers in turn until two return the same `key`; throws when that never happens. */
    async consensus(operation, key = String) {
        const answers = new Map();
        const failures = [];
        for (const entry of this.#live) {
            try {
                const value = await this.#attempt(entry, operation);
                const bucket = answers.get(key(value)) ?? { value, urls: [] };
                bucket.urls.push(entry.url);
                answers.set(key(value), bucket);
                if (bucket.urls.length >= 2) {
                    bucket.urls.forEach((url) => this.used.add(url));
                    return bucket.value;
                }
            } catch (error) {
                failures.push(`${entry.url}: ${error.shortMessage ?? error.message}`);
            }
        }
        const answered = [...answers.values()].reduce((count, bucket) => count + bucket.urls.length, 0);
        throw new Error(answered > 1 ? 'RPC providers disagree' : `fewer than two RPC providers answered (${failures.join('; ')})`);
    }

    /** One provider is enough: used for the search probes whose result is verified afterwards. */
    async single(operation) {
        let lastError;
        for (const entry of this.#live) {
            try {
                return await this.#attempt(entry, operation);
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError;
    }

    async call(to, data, blockTag) {
        return this.consensus((provider) => provider.call({ to, data, blockTag }));
    }

    async latestBlockNumber() {
        const heads = await Promise.all(this.#live.map((entry) => this.#attempt(entry, (p) => p.getBlockNumber()).catch(() => null)));
        const live = heads.filter((head) => head !== null);
        if (live.length < 2) throw new Error('fewer than two RPC providers returned a head block');
        return Math.min(...live);
    }

    async block(number) {
        if (this.blockCache.has(number)) return this.blockCache.get(number);
        const found = await this.consensus(
            async (provider) => {
                const block = await provider.getBlock(number);
                if (!block?.hash) throw new Error(`block ${number} not available`);
                return { number: block.number, timestamp: block.timestamp, hash: block.hash };
            },
            (block) => `${block.hash}:${block.timestamp}`,
        );
        this.blockCache.set(number, found);
        return found;
    }

    async #timestampProbe(number) {
        const block = await this.single((provider) => provider.getBlock(number));
        if (!block) throw new Error(`block ${number} not available`);
        return block.timestamp;
    }

    /** Last block whose timestamp is at or before `timestamp`, found by secant steps and then confirmed by consensus. */
    async blockAtOrBefore(timestamp, hint) {
        let guess = hint.number - Math.max(0, Math.ceil((hint.timestamp - timestamp) / 12));
        for (let step = 0; step < 40; step += 1) {
            const at = await this.#timestampProbe(guess);
            if (at <= timestamp) {
                const next = await this.#timestampProbe(guess + 1);
                if (next > timestamp) return this.block(guess);
                guess += Math.max(1, Math.floor((timestamp - next) / 12) + 1);
            } else {
                guess -= Math.max(1, Math.ceil((at - timestamp) / 12));
            }
        }
        throw new Error(`could not locate a block for timestamp ${timestamp}`);
    }

    /** First block in [low, high] where `predicate(blockNumber)` holds, assuming it stays true once true. */
    async firstBlockWhere(predicate, low, high) {
        let lo = low;
        let hi = high;
        while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            if (await predicate(mid)) hi = mid; else lo = mid + 1;
        }
        return lo;
    }
}
