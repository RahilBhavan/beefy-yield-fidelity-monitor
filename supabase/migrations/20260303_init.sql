-- Migration: 20260303_init
-- Purpose: Initialize the schema for tracking Beefy Vaults and historical Price-Per-Share (PPS)

-- 1. Vaults Table
-- Stores the metadata for each vault tracked by the DAO/Platform
CREATE TABLE public.vaults (
    id TEXT PRIMARY KEY, -- e.g. "aero-usdc-base"
    name TEXT NOT NULL,
    chain TEXT NOT NULL,
    target_apy NUMERIC DEFAULT 0,
    tvl NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Price-Per-Share History Table
-- This powers the "Drift Analysis". Storing daily snapshots of PPS
CREATE TABLE public.pps_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id TEXT NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
    price_per_share NUMERIC NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for quick lookups on time-series charts
CREATE INDEX idx_pps_history_vault_time ON public.pps_history(vault_id, recorded_at DESC);

-- Example RLS (Row Level Security) - read only public access, write only service role
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pps_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to vaults" ON public.vaults FOR SELECT USING (true);
CREATE POLICY "Allow public read access to pps_history" ON public.pps_history FOR SELECT USING (true);
