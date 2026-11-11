// Busca os alunos do GerenciaEPS pela função do Supabase (a chave da API fica
// no servidor, como secret EPS_API_KEY).

import { supabase } from './supabase';

declare global {
  interface Window {
    /** Só em desenvolvimento: lista de alunos de teste no lugar da API. */
    __alunosEpsTeste?: unknown[];
  }
}

export async function buscarAlunosEps(): Promise<unknown[]> {
  if (import.meta.env.DEV && window.__alunosEpsTeste) return window.__alunosEpsTeste;
  if (!supabase) throw new Error('A importação do GerenciaEPS precisa do modo online (Supabase).');
  const { data, error } = await supabase.functions.invoke('importar-alunos-eps', { body: {} });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    let msg = '';
    try {
      if (ctx && typeof ctx.json === 'function') msg = ((await ctx.json()) as { error?: string })?.error ?? '';
    } catch {
      // resposta sem JSON
    }
    if (!msg && ctx?.status === 404) msg = 'A função de importação ainda não foi publicada no Supabase.';
    throw new Error(msg || error.message || 'Não foi possível falar com o GerenciaEPS.');
  }
  const corpo = data as { alunos?: unknown[]; error?: string } | null;
  if (corpo?.error) throw new Error(corpo.error);
  if (!Array.isArray(corpo?.alunos)) throw new Error('Resposta inesperada da importação.');
  return corpo!.alunos;
}
