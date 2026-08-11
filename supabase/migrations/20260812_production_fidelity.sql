-- Production-grade scrape provenance and atomic snapshot ingestion.

CREATE TABLE IF NOT EXISTS public.scrape_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain TEXT NOT NULL,
    run_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMP WITH TIME ZONE,
    requested_vaults INTEGER NOT NULL DEFAULT 0,
    recorded_snapshots INTEGER NOT NULL DEFAULT 0,
    skipped_vaults INTEGER NOT NULL DEFAULT 0,
    block_number BIGINT,
    block_hash TEXT,
    provider_label TEXT,
    error_message TEXT,
    UNIQUE (chain, run_date)
);

ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.scrape_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scrape_run_id UUID NOT NULL REFERENCES public.scrape_runs(id) ON DELETE CASCADE,
    vault_id TEXT NOT NULL,
    contract_address TEXT,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (scrape_run_id, vault_id)
);

ALTER TABLE public.scrape_failures ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.pps_history
    ADD COLUMN IF NOT EXISTS target_apy NUMERIC,
    ADD COLUMN IF NOT EXISTS tvl NUMERIC,
    ADD COLUMN IF NOT EXISTS chain_id BIGINT,
    ADD COLUMN IF NOT EXISTS contract_address TEXT,
    ADD COLUMN IF NOT EXISTS block_number BIGINT,
    ADD COLUMN IF NOT EXISTS block_hash TEXT,
    ADD COLUMN IF NOT EXISTS raw_price_per_share NUMERIC,
    ADD COLUMN IF NOT EXISTS pps_decimals INTEGER,
    ADD COLUMN IF NOT EXISTS provider_label TEXT,
    ADD COLUMN IF NOT EXISTS scrape_run_id UUID REFERENCES public.scrape_runs(id),
    ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'valid'
        CHECK (validation_status IN ('valid', 'rejected')),
    ADD COLUMN IF NOT EXISTS validation_error TEXT;

CREATE INDEX IF NOT EXISTS idx_pps_history_block
    ON public.pps_history(chain_id, block_number DESC);

ALTER TABLE public.vaults
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

CREATE OR REPLACE FUNCTION public.begin_scrape_run(
    p_chain TEXT,
    p_run_date DATE
)
RETURNS TABLE(run_id UUID, claimed BOOLEAN, existing_status TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    current_run public.scrape_runs%ROWTYPE;
BEGIN
    SELECT * INTO current_run
    FROM public.scrape_runs
    WHERE chain = p_chain AND run_date = p_run_date
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.scrape_runs(chain, run_date, status)
        VALUES (p_chain, p_run_date, 'running')
        RETURNING * INTO current_run;

        RETURN QUERY SELECT current_run.id, true, current_run.status;
        RETURN;
    END IF;

    IF current_run.status = 'failed'
        OR (current_run.status = 'running' AND current_run.started_at < now() - interval '1 hour') THEN
        UPDATE public.scrape_runs
        SET status = 'running',
            started_at = timezone('utc'::text, now()),
            completed_at = NULL,
            error_message = NULL
        WHERE id = current_run.id
        RETURNING * INTO current_run;

        RETURN QUERY SELECT current_run.id, true, current_run.status;
        RETURN;
    END IF;

    RETURN QUERY SELECT current_run.id, false, current_run.status;
END;
$$;

CREATE OR REPLACE FUNCTION public.ingest_vault_snapshots(
    p_run_id UUID,
    p_vaults JSONB,
    p_snapshots JSONB,
    p_failures JSONB,
    p_snapshot_date DATE,
    p_recorded_at TIMESTAMP WITH TIME ZONE,
    p_chain_id BIGINT,
    p_block_number BIGINT,
    p_block_hash TEXT,
    p_provider_label TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    UPDATE public.vaults
    SET is_active = false
    WHERE chain = (p_vaults -> 0 ->> 'chain');

    INSERT INTO public.vaults (
        id, name, chain, earn_contract_address, target_apy, tvl,
        is_active, last_seen_at, updated_at
    )
    SELECT
        v.id, v.name, v.chain, v.earn_contract_address, v.target_apy, v.tvl,
        true, p_recorded_at, p_recorded_at
    FROM jsonb_to_recordset(p_vaults) AS v(
        id TEXT,
        name TEXT,
        chain TEXT,
        earn_contract_address TEXT,
        target_apy NUMERIC,
        tvl NUMERIC
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        chain = EXCLUDED.chain,
        earn_contract_address = EXCLUDED.earn_contract_address,
        target_apy = EXCLUDED.target_apy,
        tvl = EXCLUDED.tvl,
        is_active = true,
        last_seen_at = EXCLUDED.last_seen_at,
        updated_at = EXCLUDED.updated_at;

    INSERT INTO public.pps_history (
        vault_id,
        price_per_share,
        snapshot_date,
        recorded_at,
        target_apy,
        tvl,
        chain_id,
        contract_address,
        block_number,
        block_hash,
        raw_price_per_share,
        pps_decimals,
        provider_label,
        scrape_run_id,
        validation_status
    )
    SELECT
        s.vault_id,
        s.price_per_share,
        p_snapshot_date,
        p_recorded_at,
        s.target_apy,
        s.tvl,
        p_chain_id,
        s.contract_address,
        p_block_number,
        p_block_hash,
        s.raw_price_per_share,
        s.pps_decimals,
        p_provider_label,
        p_run_id,
        'valid'
    FROM jsonb_to_recordset(p_snapshots) AS s(
        vault_id TEXT,
        contract_address TEXT,
        price_per_share NUMERIC,
        raw_price_per_share NUMERIC,
        pps_decimals INTEGER,
        target_apy NUMERIC,
        tvl NUMERIC
    )
    ON CONFLICT (vault_id, snapshot_date) DO UPDATE SET
        price_per_share = EXCLUDED.price_per_share,
        recorded_at = EXCLUDED.recorded_at,
        target_apy = EXCLUDED.target_apy,
        tvl = EXCLUDED.tvl,
        chain_id = EXCLUDED.chain_id,
        contract_address = EXCLUDED.contract_address,
        block_number = EXCLUDED.block_number,
        block_hash = EXCLUDED.block_hash,
        raw_price_per_share = EXCLUDED.raw_price_per_share,
        pps_decimals = EXCLUDED.pps_decimals,
        provider_label = EXCLUDED.provider_label,
        scrape_run_id = EXCLUDED.scrape_run_id,
        validation_status = EXCLUDED.validation_status,
        validation_error = NULL;

    GET DIAGNOSTICS inserted_count = ROW_COUNT;

    INSERT INTO public.scrape_failures (
        scrape_run_id, vault_id, contract_address, reason
    )
    SELECT p_run_id, f.vault_id, f.contract_address, f.reason
    FROM jsonb_to_recordset(p_failures) AS f(
        vault_id TEXT,
        contract_address TEXT,
        reason TEXT
    )
    ON CONFLICT (scrape_run_id, vault_id) DO UPDATE SET
        contract_address = EXCLUDED.contract_address,
        reason = EXCLUDED.reason,
        created_at = timezone('utc'::text, now());

    UPDATE public.scrape_runs
    SET status = 'completed',
        completed_at = timezone('utc'::text, now()),
        requested_vaults = jsonb_array_length(p_vaults),
        recorded_snapshots = inserted_count,
        skipped_vaults = jsonb_array_length(p_failures),
        block_number = p_block_number,
        block_hash = p_block_hash,
        provider_label = p_provider_label,
        error_message = NULL
    WHERE id = p_run_id;

    RETURN inserted_count;
END;
$$;
