import { describe, expect, it } from 'vitest';
import { parseContractsPage, parseProtocolData, parseVaultsPage } from './sources.mjs';

const contracts = `
## Ethereum Mainnet

### Core Contracts

| Contract | Address |
| - | - |
| **Gateway V1** | [\`0x3f04b65Ddbd87f9CE0A2e7Eb24d80e7fb87625b5\`](https://etherscan.io/address/0x3f04b65Ddbd87f9CE0A2e7Eb24d80e7fb87625b5) |
| **Core** | [\`0xF6d48735EcCf12bDC1DF2674b1ce3fcb3bD25490\`](https://etherscan.io/address/0xF6d48735EcCf12bDC1DF2674b1ce3fcb3bD25490) |

| **iUSD (Receipt Token)** | [\`0x48f9e38f3070AD8945DFEae3FA70987722E3D89c\`](x) |
| **siUSD (Staked Token)** | [\`0xDBDC1Ef57537E34680B898E1FEBD3D68c7389bCB\`](x) |
| liUSD-1w | [\`0x12b004719fb632f1E7c010c6F5D6009Fb4258442\`](x) |
| liUSD-13w | [\`0xbd3f9814eB946E617f1d774A6762cDbec0bf087A\`](x) |
| **Farm Registry** | [\`0xF5f2718708f471e43968271956CC01aaA8c46119\`](x) |

## Plasma Network

| **Core** | [\`0x4dE0B0fAE1544f82640fa9FBAeC44023800713DB\`](x) |
| **iUSD** | [\`0x626c23fE62F5C3a45fe0F1E79Ea577Bd7d134d54\`](x) |
`;

describe('parseContractsPage', () => {
    it('reads the Ethereum Mainnet addresses and ignores other networks', () => {
        const parsed = parseContractsPage(contracts);
        expect(parsed.gateway).toBe('0x3f04b65Ddbd87f9CE0A2e7Eb24d80e7fb87625b5');
        expect(parsed.core).toBe('0xF6d48735EcCf12bDC1DF2674b1ce3fcb3bD25490');
        expect(parsed.iUSD).toBe('0x48f9e38f3070AD8945DFEae3FA70987722E3D89c');
        expect(parsed.siUSD).toBe('0xDBDC1Ef57537E34680B898E1FEBD3D68c7389bCB');
        expect(parsed.farmRegistry).toBe('0xF5f2718708f471e43968271956CC01aaA8c46119');
        expect(parsed.lockedTokens).toEqual({
            1: '0x12b004719fb632f1E7c010c6F5D6009Fb4258442',
            13: '0xbd3f9814eB946E617f1d774A6762cDbec0bf087A',
        });
    });

    it('returns null for an address the page does not list', () => {
        expect(parseContractsPage('## Ethereum Mainnet\n').siUSD).toBeNull();
    });
});

describe('parseVaultsPage', () => {
    it('keys farm names and their liquid/illiquid section by lower-case address', () => {
        const farms = parseVaultsPage(`### Liquid

#### Aave USDC

* Farm address: [\`0xbFd5FC8DecA3C6128bfCE0FE46c25616811c3580\`](https://etherscan.io/address/0xbFd5FC8DecA3C6128bfCE0FE46c25616811c3580)

### Illiquid

#### August USDC

* Farm address: [\`0x1330902050dB4edAc0D9D8ca33FdAb5DbE986c9c\`](x)
`);
        expect(farms['0xbfd5fc8deca3c6128bfce0fe46c25616811c3580']).toEqual({ name: 'Aave USDC', section: 'liquid' });
        expect(farms['0x1330902050db4edac0d9d8ca33fdab5dbe986c9c']).toEqual({ name: 'August USDC', section: 'illiquid' });
    });
});

describe('parseProtocolData', () => {
    const payload = {
        data: {
            stats: {
                asset: { totalTVLAssetNormalized: 100, totalLiquidAssetNormalized: 15, totalIlliquidAssetNormalized: 85 },
                receipt: { totalSupplyNormalized: 99.9 },
                staked: { exchangeRateNormalized: 1.09, average1dAPY: 0.06, average7dAPY: 0.065, average30dAPY: 0.064 },
                locked: {
                    '0xAbC': { name: 'liUSD-1w', address: '0xAbC', bucketMaturity: 1, average7dAPY: 0.07, totalLockedNormalized: 5 },
                },
            },
        },
    };

    it('extracts the advertised APY fields and totals', () => {
        const parsed = parseProtocolData(payload);
        expect(parsed.siUSD.average30d).toBe(0.064);
        expect(parsed.locked['0xabc']).toMatchObject({ bucketWeeks: 1, average7d: 0.07, average30d: null, totalLocked: 5 });
        expect(parsed.totals).toEqual({ tvl: 100, liquid: 15, illiquid: 85, iusdSupply: 99.9 });
    });

    it('returns null when the response has no stats, and null for any APY field that is not a number', () => {
        expect(parseProtocolData({ code: 'ERR' })).toBeNull();
        const broken = structuredClone(payload);
        broken.data.stats.staked.average7dAPY = '0.065';
        expect(parseProtocolData(broken).siUSD.average7d).toBeNull();
    });
});
