// Compares infiniFi's published APY with the growth of its share prices on Ethereum, and reads the
// reserve ratio from the farm registry. Usage: node scripts/infinifi/collect.mjs [--out reports/infinifi/DATE.json]
// Every on-chain value is read from two RPC providers that must agree. An input that cannot be read is
// listed under `missing` and never estimated.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Interface } from 'ethers';
import { ChainReader, DEFAULT_RPC_URLS, mapLimit } from './chain.mjs';
import {
    compareWindow, dailyApyDeviation, daysBetween, realizedApy, reserveRatios, toNumber, worstWeeklyFall,
} from './fidelity.mjs';
import { parseContractsPage, parseProtocolData, parseVaultsPage } from './sources.mjs';

const DOCS = 'https://docs.infinifi.xyz';
const CONTRACTS_URL = `${DOCS}/dev-docs/contracts.md`;
const VAULTS_URL = `${DOCS}/vaults.md`;
const API_URL = 'https://eth-api.infinifi.xyz/api/protocol/data';
const USDC_DECIMALS = 6;
const WAD = 10n ** 18n;
// A locked bucket holding less than this is not evaluated: a few dollars of shares say nothing about yield.
const MIN_BUCKET_IUSD = 10_000;
const WINDOW_DAYS = [1, 7, 30];
const FARM_TYPES = { 0: 'protocol', 1: 'liquid', 2: 'maturity' };

const erc20 = new Interface(['function totalSupply() view returns (uint256)', 'function balanceOf(address) view returns (uint256)']);
const staked = new Interface(['function convertToAssets(uint256) view returns (uint256)', 'function totalAssets() view returns (uint256)']);
const registry = new Interface([
    'function getEnabledAssets() view returns (address[])',
    'function getAssetTypeFarms(address,uint256) view returns (address[])',
]);
const farm = new Interface(['function assets() view returns (uint256)', 'function liquidity() view returns (uint256)', 'function assetToken() view returns (address)']);
const gateway = new Interface(['function getAddress(string) view returns (address)']);
const locking = new Interface([
    'function getEnabledBuckets() view returns (uint32[])',
    'function shareToken(uint32) view returns (address)',
    'function exchangeRate(uint32) view returns (uint256)',
    'function buckets(uint32) view returns (address shareToken, uint256 totalReceiptTokens, uint256 multiplier)',
]);

const CONCURRENCY = 4;
const progress = (message) => console.error(`[infinifi] ${message}`);
const missing = [];
const note = (field, reason) => missing.push({ field, reason });
const iso = (timestamp) => new Date(timestamp * 1000).toISOString();
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

async function fetchText(url) {
    const response = await fetch(url, { headers: { accept: '*/*' } });
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
    const body = await response.text();
    return { body, httpDate: response.headers.get('date'), fetchedAt: new Date().toISOString(), sha256: sha256(body) };
}

async function tryFetch(field, url) {
    try {
        return await fetchText(url);
    } catch (error) {
        note(field, error.message);
        return null;
    }
}

function decode(iface, name, raw) {
    return iface.decodeFunctionResult(name, raw);
}

export async function collect({ rpcUrls = DEFAULT_RPC_URLS, now = () => new Date() } = {}) {
    const reader = new ChainReader(rpcUrls);

    // 1. Contract addresses, from infiniFi's own docs.
    const contractsPage = await fetchText(CONTRACTS_URL);
    const vaultsPage = await tryFetch('docs vault names', VAULTS_URL);
    const addresses = parseContractsPage(contractsPage.body);
    for (const key of ['gateway', 'core', 'iUSD', 'siUSD', 'farmRegistry']) {
        if (!addresses[key]) throw new Error(`docs contracts page does not list ${key}`);
    }
    const farmNames = vaultsPage ? parseVaultsPage(vaultsPage.body) : {};

    // 2. The advertised APY, as infiniFi's API publishes it right now.
    const api = await tryFetch('advertised APY (infiniFi API)', API_URL);
    let protocol = null;
    if (api) {
        try { protocol = parseProtocolData(JSON.parse(api.body)); } catch { protocol = null; }
        if (!protocol) note('advertised APY (infiniFi API)', 'response had no stats object');
    }

    // 3. The block every "now" read is pinned to.
    const endNumber = (await reader.latestBlockNumber()) - 2;
    const end = await reader.block(endNumber);
    const callAt = async (to, iface, name, args, blockNumber) =>
        decode(iface, name, await reader.call(to, iface.encodeFunctionData(name, args), blockNumber));

    // 4. siUSD share price over every window and over its whole life.
    const siRate = async (blockNumber) => (await callAt(addresses.siUSD, staked, 'convertToAssets', [WAD], blockNumber))[0];
    const siSupplyAt = async (blockNumber) => (await callAt(addresses.siUSD, erc20, 'totalSupply', [], blockNumber))[0];
    const endRate = await siRate(end.number);
    progress(`end block ${end.number} pinned`);

    const windows = {};
    const startBlocks = {};
    for (const days of WINDOW_DAYS) {
        startBlocks[days] = await reader.blockAtOrBefore(end.timestamp - days * 86_400, end);
    }
    for (const days of WINDOW_DAYS) {
        const start = startBlocks[days];
        const startRate = await siRate(start.number);
        const actualDays = daysBetween(start.timestamp, end.timestamp);
        const advertisedApy = protocol?.siUSD?.[`average${days}d`] ?? null;
        if (advertisedApy === null) note(`siUSD advertised ${days}d APY`, 'not in the API response');
        windows[days] = {
            days: actualDays,
            startBlock: start.number, startTimestamp: start.timestamp, startHash: start.hash,
            startRate: Number(startRate) / 1e18, endRate: Number(endRate) / 1e18,
            ...compareWindow({ startRate: Number(startRate), endRate: Number(endRate), days: actualDays, advertisedApy }),
        };
    }

    // Daily samples over the last 30 days give the ordinary day-to-day spread of the realised APY.
    const sampleAt = async (timestamp) => {
        const block = timestamp >= end.timestamp ? end : await reader.blockAtOrBefore(timestamp, end);
        return { timestamp: block.timestamp, block: block.number, rate: Number(block.number === end.number ? endRate : await siRate(block.number)) / 1e18 };
    };
    const dailySamples = await mapLimit(Array.from({ length: 31 }, (_, index) => 30 - index), CONCURRENCY, (day) => sampleAt(end.timestamp - day * 86_400));
    progress('daily samples read');

    const firstBlockNumber = await reader.firstBlockWhere(
        async (blockNumber) => {
            try {
                return (await reader.single(async (provider) => {
                    const raw = await provider.call({ to: addresses.siUSD, data: erc20.encodeFunctionData('totalSupply'), blockTag: blockNumber });
                    return BigInt(raw === '0x' ? 0 : raw);
                })) > 0n;
            } catch { return false; }
        },
        15_500_000,
        end.number,
    );
    const first = await reader.block(firstBlockNumber);
    const firstRate = await siRate(first.number);
    const firstSupply = await siSupplyAt(first.number);
    // The seed deposit sits at rate 1.0 until yield starts, so also find the first block where the rate moved.
    const firstYieldNumber = await reader.firstBlockWhere(
        async (blockNumber) => {
            try {
                return await reader.single(async (provider) => {
                    const raw = await provider.call({ to: addresses.siUSD, data: staked.encodeFunctionData('convertToAssets', [WAD]), blockTag: blockNumber });
                    return BigInt(raw) > firstRate;
                });
            } catch { return false; }
        },
        first.number,
        end.number,
    );
    const firstYield = await reader.block(firstYieldNumber);
    const firstYieldRate = await siRate(firstYield.number);
    const history = {
        firstBlock: first.number, firstTimestamp: first.timestamp, firstHash: first.hash,
        firstRate: Number(firstRate) / 1e18, firstSupplyIusd: toNumber(firstSupply, 18),
        endRate: Number(endRate) / 1e18,
        days: daysBetween(first.timestamp, end.timestamp),
        advertisedApy: null,
    };
    Object.assign(history, compareWindow({ startRate: Number(firstRate), endRate: Number(endRate), days: history.days, advertisedApy: null }));
    history.sinceFirstYield = {
        block: firstYield.number, timestamp: firstYield.timestamp, iso: iso(firstYield.timestamp), hash: firstYield.hash,
        startRate: Number(firstYieldRate) / 1e18,
        days: daysBetween(firstYield.timestamp, end.timestamp),
        realizedApy: realizedApy(Number(firstYieldRate), Number(endRate), daysBetween(firstYield.timestamp, end.timestamp)),
    };
    note('siUSD advertised APY over its whole life', 'the API publishes only 1-, 7- and 30-day averages; it has no history');

    const weekly = [{ timestamp: first.timestamp, block: first.number, rate: history.firstRate }];
    const weeklyTimes = [];
    for (let weeks = Math.floor(history.days / 7); weeks >= 0; weeks -= 1) {
        const timestamp = end.timestamp - weeks * 7 * 86_400;
        if (timestamp > first.timestamp) weeklyTimes.push(timestamp);
    }
    weekly.push(...await mapLimit(weeklyTimes, CONCURRENCY, sampleAt));
    progress('weekly samples read');
    history.weeklySamples = weekly.length;
    history.worstWeeklyFall = worstWeeklyFall(weekly);
    history.dailyApyDeviation = dailyApyDeviation(dailySamples);
    history.weekly = weekly;
    history.daily = dailySamples;
    history.dailyApyDeviationWindow = { from: iso(dailySamples[0].timestamp), to: iso(dailySamples.at(-1).timestamp) };

    progress('siUSD history read');
    // 5. Locked tokens (liUSD). Their controller is not in the docs, so it is read from the documented Gateway
    // and accepted only if its share tokens are the liUSD addresses the docs list.
    let controller = null;
    const locked = [];
    try {
        const [controllerAddress] = await callAt(addresses.gateway, gateway, 'getAddress', ['lockingController'], end.number);
        const [enabled] = await callAt(controllerAddress, locking, 'getEnabledBuckets', [], end.number);
        let verified = enabled.length > 0;
        for (const weeks of enabled.map(Number)) {
            const [token] = await callAt(controllerAddress, locking, 'shareToken', [weeks], end.number);
            if (addresses.lockedTokens[weeks]?.toLowerCase() !== token.toLowerCase()) verified = false;
        }
        if (!verified) throw new Error('controller share tokens do not match the docs liUSD addresses');
        controller = { address: controllerAddress, resolvedVia: `Gateway.getAddress("lockingController") at ${addresses.gateway}`, verifiedAgainstDocs: true };

        for (const weeks of enabled.map(Number).sort((a, b) => a - b)) {
            const token = addresses.lockedTokens[weeks];
            const rateAt = async (blockNumber) => (await callAt(controllerAddress, locking, 'exchangeRate', [weeks], blockNumber))[0];
            const [, totalReceiptTokens] = await callAt(controllerAddress, locking, 'buckets', [weeks], end.number);
            const lockedIusd = toNumber(totalReceiptTokens, 18);
            const advertised = protocol?.locked?.[token.toLowerCase()] ?? null;
            const entry = { name: `liUSD-${weeks}w`, bucketWeeks: weeks, address: token, lockedIusd, evaluated: lockedIusd >= MIN_BUCKET_IUSD, windows: {} };
            if (!entry.evaluated) {
                entry.skippedBecause = `holds ${lockedIusd.toFixed(2)} iUSD, below the ${MIN_BUCKET_IUSD} iUSD minimum`;
                locked.push(entry);
                continue;
            }
            const endBucketRate = await rateAt(end.number);
            for (const days of [7, 30]) {
                const start = startBlocks[days];
                const startBucketRate = await rateAt(start.number);
                const advertisedApy = advertised?.[`average${days}d`] ?? null;
                if (advertisedApy === null) note(`liUSD-${weeks}w advertised ${days}d APY`, 'not in the API response');
                const actualDays = daysBetween(start.timestamp, end.timestamp);
                const comparison = startBucketRate === 0n || endBucketRate === 0n
                    ? null
                    : compareWindow({ startRate: Number(startBucketRate), endRate: Number(endBucketRate), days: actualDays, advertisedApy });
                if (!comparison) note(`liUSD-${weeks}w realised ${days}d APY`, `exchange rate was 0 at block ${startBucketRate === 0n ? start.number : end.number}`);
                entry.windows[days] = comparison && {
                    days: actualDays, startBlock: start.number, startRate: Number(startBucketRate) / 1e18, endRate: Number(endBucketRate) / 1e18, ...comparison,
                };
            }
            locked.push(entry);
        }
    } catch (error) {
        note('liUSD realised APY', `locked-token controller could not be read and verified: ${error.message}`);
    }

    progress('locked tokens read');
    // 6. Reserves, all pinned to the end block.
    const reserves = await readReserves({ callAt, addresses, farmNames, end });
    if (reserves.readable && protocol?.totals?.liquid != null) {
        reserves.apiCrossCheck = {
            note: 'infiniFi API totals fetched about a minute after the pinned block; shown to confirm the on-chain read, not used in any ratio',
            apiLiquid: protocol.totals.liquid, apiIlliquid: protocol.totals.illiquid, apiIusdSupply: protocol.totals.iusdSupply,
            liquidDifference: protocol.totals.liquid - reserves.liquidReserves,
            illiquidDifference: protocol.totals.illiquid - reserves.maturityFarmAssets - reserves.protocolFarmAssets,
            iusdSupplyDifference: protocol.totals.iusdSupply - reserves.totalDeposits,
        };
    }

    const apiAfter = await tryFetch('advertised APY re-check', API_URL);
    let apiUnchanged = null;
    if (api && apiAfter) {
        const before = JSON.stringify(protocol);
        let after = null;
        try { after = parseProtocolData(JSON.parse(apiAfter.body)); } catch { /* left null */ }
        apiUnchanged = after !== null && JSON.stringify(after) === before;
    }

    const exchangeRateMatchesApi = protocol?.siUSD?.exchangeRate == null
        ? null
        : Math.abs(protocol.siUSD.exchangeRate - Number(endRate) / 1e18) < 1e-6;

    return {
        schemaVersion: 1,
        generatedAt: now().toISOString(),
        method: 'Realised APY = expm1(ln(endRate / startRate) * 365 / days), the interval maths of src/lib/drift.ts. siUSD rate = convertToAssets(1e18) in iUSD; liUSD rate = LockingController.exchangeRate(weeks). Gap = realised minus advertised, in percentage points.',
        endBlock: { number: end.number, hash: end.hash, timestamp: end.timestamp, iso: iso(end.timestamp) },
        sources: {
            docsContracts: { url: CONTRACTS_URL, ...pick(contractsPage) },
            docsVaults: vaultsPage ? { url: VAULTS_URL, ...pick(vaultsPage) } : null,
            api: api ? { url: API_URL, ...pick(api), unchangedOnRecheck: apiUnchanged } : null,
            rpcProvidersAgreeing: [...reader.used],
        },
        contracts: { ...addresses, lockingController: controller },
        siUSD: {
            address: addresses.siUSD,
            advertised: protocol?.siUSD ? { average1d: protocol.siUSD.average1d, average7d: protocol.siUSD.average7d, average30d: protocol.siUSD.average30d } : null,
            apiExchangeRateMatchesChain: exchangeRateMatchesApi,
            windows,
            history,
        },
        locked,
        reserves,
        missing,
    };
}

const pick = ({ httpDate, fetchedAt, sha256: digest }) => ({ httpDate, fetchedAt, sha256: digest });

async function readReserves({ callAt, addresses, farmNames, end }) {
    const result = { block: end.number, hash: end.hash, timestamp: end.timestamp, iso: iso(end.timestamp) };
    let usdc = null;
    try {
        const [assets] = await callAt(addresses.farmRegistry, registry, 'getEnabledAssets', [], end.number);
        // USDC is the asset iUSD is minted against; the enabled-asset list is read, and USDC is the one with farms.
        const withFarms = [];
        for (const asset of assets) {
            let count = 0;
            for (const type of Object.keys(FARM_TYPES)) {
                count += (await callAt(addresses.farmRegistry, registry, 'getAssetTypeFarms', [asset, Number(type)], end.number))[0].length;
            }
            if (count > 0) withFarms.push(asset);
        }
        if (withFarms.length !== 1) throw new Error(`expected one enabled asset with farms, found ${withFarms.length}`);
        usdc = withFarms[0];
    } catch (error) {
        note('reserve ratio', `farm registry could not be read: ${error.message}`);
        return { ...result, readable: false };
    }

    const farms = [];
    for (const [type, kind] of Object.entries(FARM_TYPES)) {
        const [list] = await callAt(addresses.farmRegistry, registry, 'getAssetTypeFarms', [usdc, Number(type)], end.number);
        for (const address of list) {
            const [assets] = await callAt(address, farm, 'assets', [], end.number);
            const liquidity = await callAt(address, farm, 'liquidity', [], end.number).then((value) => value[0]).catch(() => null);
            if (liquidity === null) note(`liquidity() of farm ${address}`, 'call reverted or is not implemented');
            const named = farmNames[address.toLowerCase()];
            farms.push({
                address, type: kind, name: named?.name ?? null, docsSection: named?.section ?? null,
                assets: toNumber(assets, USDC_DECIMALS), liquidity: liquidity === null ? null : toNumber(liquidity, USDC_DECIMALS),
                rawAssets: assets, rawLiquidity: liquidity,
            });
        }
    }
    const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0n);
    const liquidRows = farms.filter((row) => row.type === 'liquid');
    const maturityRows = farms.filter((row) => row.type === 'maturity');
    const [supply] = await callAt(addresses.iUSD, erc20, 'totalSupply', [], end.number);
    const depositsUsdc = supply / 10n ** 12n;
    const totalBacking = sum(farms, 'rawAssets');
    const maturityInstant = maturityRows.every((row) => row.rawLiquidity !== null) ? sum(maturityRows, 'rawLiquidity') : null;
    const ratios = reserveRatios({
        liquidReserves: sum(liquidRows, 'rawAssets'),
        maturityInstant: maturityInstant ?? 0n,
        totalDeposits: depositsUsdc,
        totalBacking,
    });
    if (maturityInstant === null) {
        note('instantly withdrawable reserves', 'a maturity farm did not return liquidity()');
        ratios.instantRatio = null;
    }
    return {
        ...result,
        readable: true,
        asset: usdc,
        totalDeposits: toNumber(depositsUsdc, USDC_DECIMALS),
        totalDepositsDefinition: 'iUSD totalSupply, taken at par with USDC (iUSD is minted 1:1 against USDC)',
        liquidReserves: toNumber(sum(liquidRows, 'rawAssets'), USDC_DECIMALS),
        maturityFarmAssets: toNumber(sum(maturityRows, 'rawAssets'), USDC_DECIMALS),
        maturityFarmInstantLiquidity: maturityInstant === null ? null : toNumber(maturityInstant, USDC_DECIMALS),
        protocolFarmAssets: toNumber(sum(farms.filter((row) => row.type === 'protocol'), 'rawAssets'), USDC_DECIMALS),
        totalBacking: toNumber(totalBacking, USDC_DECIMALS),
        ...ratios,
        farms: farms.map((row) => ({
            address: row.address, type: row.type, name: row.name, docsSection: row.docsSection,
            assets: row.assets, liquidity: row.liquidity,
        })),
    };
}

function parseArguments(argv) {
    const out = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : null;
    return { out };
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const { out } = parseArguments(process.argv.slice(2));
    const rpcUrls = process.env.INFINIFI_RPC_URLS ? process.env.INFINIFI_RPC_URLS.split(',').map((url) => url.trim()).filter(Boolean) : DEFAULT_RPC_URLS;
    const report = await collect({ rpcUrls });
    const target = out ?? path.join('reports', 'infinifi', `${report.endBlock.iso.slice(0, 10)}.json`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`wrote ${target}`);
    console.log(`end block ${report.endBlock.number} (${report.endBlock.iso}); missing inputs: ${report.missing.length}`);
}
