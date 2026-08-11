-- Add on-chain vault addresses and make daily PPS snapshots idempotent.
ALTER TABLE public.vaults
    ADD COLUMN IF NOT EXISTS earn_contract_address TEXT;

ALTER TABLE public.pps_history
    ADD COLUMN IF NOT EXISTS snapshot_date DATE;

UPDATE public.pps_history
SET snapshot_date = (recorded_at AT TIME ZONE 'UTC')::date
WHERE snapshot_date IS NULL;

WITH duplicates AS (
    SELECT
        id,
        row_number() OVER (
            PARTITION BY vault_id, snapshot_date
            ORDER BY recorded_at DESC, id DESC
        ) AS duplicate_number
    FROM public.pps_history
)
DELETE FROM public.pps_history
WHERE id IN (
    SELECT id FROM duplicates WHERE duplicate_number > 1
);

ALTER TABLE public.pps_history
    ALTER COLUMN snapshot_date SET NOT NULL,
    ALTER COLUMN snapshot_date SET DEFAULT (timezone('utc'::text, now()))::date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pps_history_vault_date
    ON public.pps_history(vault_id, snapshot_date);
