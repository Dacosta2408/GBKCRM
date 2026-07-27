import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Add these to your Google AI Studio Secrets panel. ' +
    'Data will not persist until these are configured.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Quick health check — returns true if Supabase is reachable.
 * Call this on app startup to verify the connection.
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase.from('clients').select('id').limit(1);
    // A "table not found" error still means the connection works —
    // only a network/auth error means it's truly offline.
    if (error && error.code === 'PGRST116') return true; // table exists but empty
    if (error && error.message?.includes('fetch')) return false; // network error
    return true;
  } catch {
    return false;
  }
}
