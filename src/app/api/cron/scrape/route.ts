import { NextResponse } from 'next/server';
import { getBaseVaultMarketData } from '@/lib/beefy';
import { readBasePricePerShares } from '@/lib/pps';
import { createSupabaseAdmin } from '@/lib/supabase';
import { baseChain } from '@/lib/chains';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshotDate = new Date().toISOString().slice(0, 10);
    let runId: string | null = null;
    let supabase: ReturnType<typeof createSupabaseAdmin> | null = null;

    try {
        supabase = createSupabaseAdmin();
        const { data: claimData, error: claimError } = await supabase.rpc('begin_scrape_run', {
            p_chain: baseChain.slug,
            p_run_date: snapshotDate,
        });
        if (claimError) throw new Error(`Could not claim scrape run: ${claimError.message}`);

        const claim = Array.isArray(claimData) ? claimData[0] : null;
        if (!claim?.run_id) throw new Error('Scrape run claim returned no run identifier');
        runId = claim.run_id;

        if (!claim.claimed) {
            return NextResponse.json({
                success: true,
                alreadyProcessed: true,
                runId,
                status: claim.existing_status,
                snapshotDate,
            });
        }

        const { vaults } = await getBaseVaultMarketData(50, { fresh: true });
        const batch = await readBasePricePerShares(vaults);
        const snapshots = batch.snapshots;

        if (snapshots.length === 0) {
            throw new Error('No Base vaults returned a valid on-chain PPS');
        }

        const now = new Date();
        const recordedAt = now.toISOString();
        const vaultPayload = vaults.map((vault) => ({
                id: vault.id,
                name: vault.name,
                chain: vault.chain,
                earn_contract_address: vault.earnContractAddress,
                target_apy: vault.apy,
                tvl: vault.tvl,
            }));
        const vaultById = new Map(vaults.map((vault) => [vault.id, vault]));
        const validationFailures = [...batch.failures];
        const snapshotPayload = snapshots.flatMap((snapshot) => {
            const vault = vaultById.get(snapshot.vaultId);
            if (!vault || Number(snapshot.pricePerShare) <= 0) {
                validationFailures.push({
                    vaultId: snapshot.vaultId,
                    contractAddress: snapshot.contractAddress,
                    reason: 'PPS was missing, non-positive, or did not match a tracked vault',
                });
                return [];
            }
            return [{
                vault_id: snapshot.vaultId,
                contract_address: snapshot.contractAddress,
                price_per_share: snapshot.pricePerShare,
                raw_price_per_share: snapshot.rawPricePerShare,
                pps_decimals: snapshot.decimals,
                target_apy: vault.apy,
                tvl: vault.tvl,
            }];
        });

        const { data: recordedCount, error: ingestError } = await supabase.rpc(
            'ingest_vault_snapshots',
            {
                p_run_id: runId,
                p_vaults: vaultPayload,
                p_snapshots: snapshotPayload,
                p_failures: validationFailures.map((failure) => ({
                    vault_id: failure.vaultId,
                    contract_address: failure.contractAddress,
                    reason: failure.reason,
                })),
                p_snapshot_date: snapshotDate,
                p_recorded_at: recordedAt,
                p_chain_id: baseChain.chainId,
                p_block_number: batch.blockNumber,
                p_block_hash: batch.blockHash,
                p_provider_label: batch.providerLabel,
            },
        );
        if (ingestError) throw new Error(`Atomic ingest failed: ${ingestError.message}`);

        return NextResponse.json({
            success: true,
            runId,
            chain: baseChain.slug,
            chainId: baseChain.chainId,
            blockNumber: batch.blockNumber,
            blockHash: batch.blockHash,
            trackedVaults: vaults.length,
            recordedSnapshots: Number(recordedCount ?? snapshotPayload.length),
            skippedVaults: validationFailures.length,
            snapshotDate,
        });
    } catch (error: unknown) {
        console.error('Cron scrape failed:', error);
        if (runId && supabase) {
            await supabase
                .from('scrape_runs')
                .update({
                    status: 'failed',
                    completed_at: new Date().toISOString(),
                    error_message: error instanceof Error ? error.message : 'Unknown error',
                })
                .eq('id', runId);
        }
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
        );
    }
}
