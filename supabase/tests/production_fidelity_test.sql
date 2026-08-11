BEGIN;

DO $$
DECLARE
    test_run_id UUID;
    test_claimed BOOLEAN;
    repeated_claim BOOLEAN;
    recorded_count INTEGER;
BEGIN
    IF to_regclass('public.scrape_runs') IS NULL THEN
        RAISE EXCEPTION 'scrape_runs table is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'pps_history'
          AND column_name = 'block_number'
    ) THEN
        RAISE EXCEPTION 'pps_history.block_number is missing';
    END IF;

    IF to_regprocedure('public.begin_scrape_run(text,date)') IS NULL THEN
        RAISE EXCEPTION 'begin_scrape_run function is missing';
    END IF;

    IF to_regprocedure('public.ingest_vault_snapshots(uuid,jsonb,jsonb,jsonb,date,timestamp with time zone,bigint,bigint,text,text)') IS NULL THEN
        RAISE EXCEPTION 'ingest_vault_snapshots function is missing';
    END IF;

    SELECT run_id, claimed INTO test_run_id, test_claimed
    FROM public.begin_scrape_run('base-test', DATE '2026-01-01');
    IF NOT test_claimed THEN
        RAISE EXCEPTION 'first scrape-run claim was not acquired';
    END IF;

    SELECT public.ingest_vault_snapshots(
        test_run_id,
        '[{"id":"test-vault","name":"Test Vault","chain":"base","earn_contract_address":"0x1","target_apy":0.1,"tvl":1000}]'::jsonb,
        '[{"vault_id":"test-vault","contract_address":"0x1","price_per_share":1.01,"raw_price_per_share":1010000000000000000,"pps_decimals":18,"target_apy":0.1,"tvl":1000}]'::jsonb,
        '[]'::jsonb,
        DATE '2026-01-01',
        TIMESTAMPTZ '2026-01-01 00:00:00+00',
        8453,
        123456,
        '0xabc',
        'test-provider'
    ) INTO recorded_count;

    IF recorded_count <> 1 THEN
        RAISE EXCEPTION 'atomic ingest recorded % rows instead of 1', recorded_count;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.pps_history
        WHERE vault_id = 'test-vault'
          AND target_apy = 0.1
          AND block_number = 123456
          AND scrape_run_id = test_run_id
          AND validation_status = 'valid'
    ) THEN
        RAISE EXCEPTION 'atomic ingest did not preserve snapshot provenance';
    END IF;

    SELECT claimed INTO repeated_claim
    FROM public.begin_scrape_run('base-test', DATE '2026-01-01');
    IF repeated_claim THEN
        RAISE EXCEPTION 'completed daily run was claimed twice';
    END IF;
END;
$$;

ROLLBACK;
