import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Hash da URL no momento em que a página carregou.
 *
 * Precisa ser lido aqui, antes de `createClient`: com `detectSessionInUrl`
 * ligado (o padrão), o supabase-js consome o token e limpa o hash: quando o
 * React renderiza, `location.hash` já pode estar vazio. Guardar o valor
 * original é o que permite saber que a visita veio de um link de convite ou
 * de recuperação de senha.
 */
export const hashInicial =
  typeof window !== 'undefined' ? window.location.hash : '';

/**
 * Cliente Supabase. É `null` quando as variáveis de ambiente não estão
 * definidas — nesse caso o app opera em modo local (localStorage).
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
