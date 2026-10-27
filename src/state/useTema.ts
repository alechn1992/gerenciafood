import { useCallback, useEffect, useState } from 'react';
import { aplicarTema, lerPreferencia, salvarPreferencia, type PreferenciaTema } from '../lib/tema';

export function useTema() {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(lerPreferencia);

  useEffect(() => {
    aplicarTema(preferencia);
    if (preferencia !== 'automatico') return;
    // Em "automático", acompanha a troca do sistema (ex.: celular ao anoitecer).
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const mudou = () => aplicarTema('automatico');
    mq.addEventListener('change', mudou);
    return () => mq.removeEventListener('change', mudou);
  }, [preferencia]);

  const escolher = useCallback((p: PreferenciaTema) => {
    salvarPreferencia(p);
    setPreferencia(p);
  }, []);

  return { preferencia, escolher };
}
