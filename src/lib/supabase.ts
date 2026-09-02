import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

function isValidSupabaseUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

const hasValidUrl = isValidSupabaseUrl(url);
const hasValidKey = Boolean(key) && !key.includes('placeholder');

let supabase: SupabaseClient | null = null;
if (hasValidUrl && hasValidKey) supabase = createClient(url, key);

export { supabase };
export const isSupabaseConfigured = Boolean(supabase);
export const supabaseConfigurationError = isSupabaseConfigured
  ? null
  : 'Supabase の URL または anon key が未設定、または形式が正しくありません。';
