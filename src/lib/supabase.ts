import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Captura erros de OAuth devolvidos na URL (?error_description=... ou #error_description=...)
 * ANTES de o cliente Supabase limpar a URL, para exibi-los na tela de login.
 */
function readOAuthError(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const hashQuery = window.location.hash.includes('=') ? window.location.hash.replace(/^#\/?/, '') : '';
    const hash = new URLSearchParams(hashQuery);
    return params.get('error_description') ?? hash.get('error_description');
  } catch {
    return null;
  }
}
export const initialOAuthError = readOAuthError();

export const isConfigured = Boolean(url && anon);

export const supabase = createClient(url || 'http://localhost:54321', anon || 'public-anon-key-missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
});

export const EVIDENCE_BUCKET = 'evidences';
