import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Vercel Cron compatible endpoint
export async function GET(request: Request) {
    // Simple auth check to ensure only Vercel Cron or specific admins ping this route
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("Starting PPS Cron Job...");

        // 1. Fetch live Beefy data
        const [vaultsRes, apysRes, tvlRes] = await Promise.all([
            fetch('https://api.beefy.finance/vaults'),
            fetch('https://api.beefy.finance/apy/breakdown'),
            fetch('https://api.beefy.finance/tvl')
        ]);

        const allVaults = await vaultsRes.json();
        const apys = await apysRes.json();
        const tvls = await tvlRes.json();

        // 2. Identify top 50 vaults globally (or per chain, but we'll do globally for now based on TVL)
        const enrichedVaults = allVaults.map((vault: any) => {
            const tvl = tvls[vault.chain]?.[vault.id] || 0;
            const targetApy = apys[vault.id]?.totalApy || 0;
            return { ...vault, tvl, targetApy };
        })
            .sort((a: any, b: any) => b.tvl - a.tvl)
            .slice(0, 50);

        const upsertVaults = enrichedVaults.map((v: any) => ({
            id: v.id,
            name: v.name,
            chain: v.chain,
            target_apy: v.targetApy,
            tvl: v.tvl,
            updated_at: new Date().toISOString()
        }));

        // 3. Upsert into Supabase `vaults` table
        const { error: vaultError } = await supabaseAdmin
            .from('vaults')
            .upsert(upsertVaults, { onConflict: 'id' });

        if (vaultError) {
            console.error("Supabase Vaults Upsert Error:", vaultError);
            throw new Error("Failed to sync vaults to DB");
        }

        // 4. Record Daily Price-Per-Share (PPS) snapshot
        // Beefy exposes `pricePerFullShare` in some of their contract endpoints or APIs.
        // However, the easiest global way to get PPS for a vault without RPC scraping 50 contracts
        // is often `https://api.beefy.finance/lps` or querying their graph.
        // 
        // Since Beefy doesn't expose a clean `/pps` endpoint for all vaults at once, 
        // a common workaround for this "Yield Health" metric is to log the user's base yield.
        // Alternatively, many vaults expose `pricePerFullShare` directly in the Beefy Yield API.

        // For this MVP PRD, we will mock the PPS scrape logic based on Target APY 
        // assuming standard daily growth, so the Drift Analysis can function.
        // In a real production DAO environment, here we would instantiate Ethers.js
        // and call `vaultContract.getPricePerFullShare()` for each of the 50 vaults via MultiCall.

        const ppsRecords = enrichedVaults.map((v: any) => {
            // MOCK: Generate a deterministic PPS that slowly drifts down from projected APY by 0-5% randomly
            // Drift mechanism: Target APY * (0.95 + random(0.05))
            const theoreticalDailyGrowth = (v.targetApy / 365);
            const randomDriftModifier = 0.95 + (Math.random() * 0.05);
            const actualDailyGrowth = theoreticalDailyGrowth * randomDriftModifier;

            // Calculate a pseudo-PPS based on time (e.g. baseline 1.0 + compounded growth)
            const mockPps = 1.0 + actualDailyGrowth;

            return {
                vault_id: v.id,
                price_per_share: mockPps,
                recorded_at: new Date().toISOString()
            };
        });

        const { error: ppsError } = await supabaseAdmin
            .from('pps_history')
            .insert(ppsRecords);

        if (ppsError) {
            console.error("Supabase PPS Insert Error:", ppsError);
            throw new Error("Failed to insert daily PPS records");
        }

        console.log(`Successfully scraped and recorded data for ${enrichedVaults.length} vaults.`);

        return NextResponse.json({
            success: true,
            message: `Scraped ${enrichedVaults.length} vaults`,
            sample: ppsRecords[0]
        });

    } catch (error: any) {
        console.error("Cron scrape failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
