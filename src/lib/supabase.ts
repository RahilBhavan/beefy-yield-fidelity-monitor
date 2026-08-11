import { createClient } from '@supabase/supabase-js';

function requiredEnvironmentVariable(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is required`);
    return value;
}

const serverAuthOptions = {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
};

export function createSupabaseAdmin() {
    return createClient(
        requiredEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL'),
        requiredEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY'),
        serverAuthOptions,
    );
}

export function createSupabaseReader() {
    return createClient(
        requiredEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL'),
        requiredEnvironmentVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        serverAuthOptions,
    );
}

export function hasSupabaseReaderConfiguration() {
    return Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL
        && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
}
