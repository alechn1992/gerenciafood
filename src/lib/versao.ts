import { useEffect, useState } from 'react';

interface Versao {
  id: string;
  commit: string;
  geradaEm: string;
}

// Injetada no build pelo vite.config.ts.
declare const __APP_VERSION__: Versao;

export const VERSAO: Versao = __APP_VERSION__;

/** Ex.: "05/10/2026 14:18 · 2f57f7f" — no horário de Brasília. */
export function rotuloVersao(v: Versao = VERSAO): string {
  const quando = new Date(v.geradaEm).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${quando.replace(',', '')} · ${v.commit}`;
}

const INTERVALO_MS = 5 * 60 * 1000;

/**
 * Indica se o servidor já publicou uma versão diferente da que está aberta.
 * Uma aba aberta antes do deploy continua rodando o código antigo até ser
 * recarregada — foi assim que uma reimportação já rodou a versão sem a
 * correção. Consulta o /version.json ao abrir, a cada 5 minutos e sempre que
 * a aba volta a ficar visível.
 */
export function useNovaVersaoDisponivel(): boolean {
  const [nova, setNova] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) return; // em desenvolvimento não há version.json

    let ativo = true;
    const verificar = async () => {
      try {
        const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!r.ok) return;
        const publicada = (await r.json()) as Partial<Versao>;
        if (ativo && publicada.id && publicada.id !== VERSAO.id) setNova(true);
      } catch {
        // Sem rede: tenta de novo na próxima rodada.
      }
    };

    const aoVoltar = () => {
      if (document.visibilityState === 'visible') verificar();
    };

    verificar();
    const timer = window.setInterval(verificar, INTERVALO_MS);
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      ativo = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, []);

  return nova;
}
