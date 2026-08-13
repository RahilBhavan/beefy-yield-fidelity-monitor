-- Restrict ingestion RPCs to the service role; anon/authenticated must not write.

REVOKE EXECUTE ON FUNCTION public.begin_scrape_run(TEXT, DATE)
    FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.ingest_vault_snapshots(
    UUID, JSONB, JSONB, JSONB, DATE, TIMESTAMP WITH TIME ZONE, BIGINT, BIGINT, TEXT, TEXT
) FROM PUBLIC;

DO $$
BEGIN
    IF to_regrole('anon') IS NOT NULL THEN
        REVOKE EXECUTE ON FUNCTION public.begin_scrape_run(TEXT, DATE) FROM anon;
        REVOKE EXECUTE ON FUNCTION public.ingest_vault_snapshots(
            UUID, JSONB, JSONB, JSONB, DATE, TIMESTAMP WITH TIME ZONE, BIGINT, BIGINT, TEXT, TEXT
        ) FROM anon;
    END IF;

    IF to_regrole('authenticated') IS NOT NULL THEN
        REVOKE EXECUTE ON FUNCTION public.begin_scrape_run(TEXT, DATE) FROM authenticated;
        REVOKE EXECUTE ON FUNCTION public.ingest_vault_snapshots(
            UUID, JSONB, JSONB, JSONB, DATE, TIMESTAMP WITH TIME ZONE, BIGINT, BIGINT, TEXT, TEXT
        ) FROM authenticated;
    END IF;

    IF to_regrole('service_role') IS NOT NULL THEN
        GRANT EXECUTE ON FUNCTION public.begin_scrape_run(TEXT, DATE) TO service_role;
        GRANT EXECUTE ON FUNCTION public.ingest_vault_snapshots(
            UUID, JSONB, JSONB, JSONB, DATE, TIMESTAMP WITH TIME ZONE, BIGINT, BIGINT, TEXT, TEXT
        ) TO service_role;
    END IF;
END
$$;
