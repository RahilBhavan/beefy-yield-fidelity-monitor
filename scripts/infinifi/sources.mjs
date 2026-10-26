// Parsers for the two inputs that are not read from the chain: infiniFi's docs pages and its public stats API.
// Anything a parser cannot find comes back as null so the report can list it as missing.

const ADDRESS = /0x[0-9a-fA-F]{40}/;

/** Contract addresses from the docs "Contract Addresses" page, Ethereum Mainnet section only. */
export function parseContractsPage(markdown) {
    const mainnet = markdown.split(/^## /m).find((section) => section.startsWith('Ethereum Mainnet')) ?? '';
    const found = {};
    for (const line of mainnet.split('\n')) {
        const cells = line.split('|').map((cell) => cell.trim());
        if (cells.length < 3) continue;
        const address = cells[2].match(ADDRESS)?.[0];
        if (address) found[cells[1].replace(/\*/g, '').trim()] = address;
    }
    const lockedTokens = {};
    for (const [label, address] of Object.entries(found)) {
        const week = label.match(/^liUSD-(\d+)w$/);
        if (week) lockedTokens[Number(week[1])] = address;
    }
    return {
        gateway: found['Gateway V1'] ?? null,
        core: found['Core'] ?? null,
        iUSD: found['iUSD (Receipt Token)'] ?? null,
        siUSD: found['siUSD (Staked Token)'] ?? null,
        farmRegistry: found['Farm Registry'] ?? null,
        lockedTokens,
    };
}

/** Farm names and liquid/illiquid section from the docs "Vaults" page, keyed by lower-case farm address. */
export function parseVaultsPage(markdown) {
    const farms = {};
    let section = null;
    let name = null;
    for (const line of markdown.split('\n')) {
        const sectionMatch = line.match(/^### (Liquid|Illiquid)\s*$/);
        if (sectionMatch) { section = sectionMatch[1].toLowerCase(); continue; }
        const nameMatch = line.match(/^#### (.+?)\s*$/);
        if (nameMatch) { name = nameMatch[1]; continue; }
        const farmMatch = line.match(/^\* Farm address: .*?(0x[0-9a-fA-F]{40})/);
        if (farmMatch && name) farms[farmMatch[1].toLowerCase()] = { name, section };
    }
    return farms;
}

const finite = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

function advertised(entry) {
    return {
        average1d: finite(entry?.average1dAPY),
        average7d: finite(entry?.average7dAPY),
        average30d: finite(entry?.average30dAPY),
    };
}

/** The advertised-APY fields and cross-check totals from infiniFi's /api/protocol/data response. */
export function parseProtocolData(json) {
    const stats = json?.data?.stats;
    if (!stats) return null;
    const locked = {};
    for (const entry of Object.values(stats.locked ?? {})) {
        if (!entry?.address) continue;
        locked[entry.address.toLowerCase()] = {
            name: entry.name,
            bucketWeeks: entry.bucketMaturity,
            ...advertised(entry),
            exchangeRate: finite(entry.exchangeRateNormalized),
            totalLocked: finite(entry.totalLockedNormalized),
        };
    }
    return {
        siUSD: { ...advertised(stats.staked), exchangeRate: finite(stats.staked?.exchangeRateNormalized) },
        locked,
        totals: {
            tvl: finite(stats.asset?.totalTVLAssetNormalized),
            liquid: finite(stats.asset?.totalLiquidAssetNormalized),
            illiquid: finite(stats.asset?.totalIlliquidAssetNormalized),
            iusdSupply: finite(stats.receipt?.totalSupplyNormalized),
        },
    };
}
