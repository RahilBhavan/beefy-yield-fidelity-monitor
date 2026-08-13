-- Restrict ingestion RPCs to the service role; anon/authenticated must not write.

REVOKE EXECUTE ON FUNCTION public.begin_scrape_run(TEXT, DATE)
    FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.ingest_vault_snapshots(
    UUID, JSONB, JSONB, JSONB, DATE, TIMESTAMP WITH TIME ZONE, BIGINT, BIGINT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.begin_scrape_run(TEXT, DATE)
    TO service_role;

GRANT EXECUTE ON FUNCTION public.ingest_vault_snapshots(
    UUID, JSONB, JSONB, JSONB, DATE, TIMESTAMP WITH TIME ZONE, BIGINT, BIGINT, TEXT, TEXT
) TO service_role;
