import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

if (url && key && url !== '' && !url.includes('placeholder')) {
  supabase = createClient(url, key);
}

export { supabase };
export const isSupabaseConfigured = !!supabase;
