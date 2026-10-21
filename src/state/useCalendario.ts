import { useCallback, useEffect, useState } from 'react';
import type { PeriodoSemFuncionamento } from '../domain/types';
import { useData } from './DataContext';

/**
 * Períodos sem funcionamento do cliente. Sem a tabela no banco (migração
 * 0022 ainda não aplicada), devolve lista vazia e o erro, sem quebrar a tela.
 */
export function useCalendario(clienteId: string | undefined) {
  const { repo } = useData();
  const [periodos, setPeriodos] = useState<PeriodoSemFuncionamento[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!clienteId) return;
    try {
      setPeriodos(await repo.listarCalendario(clienteId));
      setErro(null);
    } catch (err) {
      console.error('[GerenciaFood] Erro ao carregar o calendário:', err);
      const o = err as { message?: string };
      setErro(o?.message ?? String(err));
    } finally {
      setCarregando(false);
    }
  }, [clienteId, repo]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { periodos, erro, carregando, recarregar };
}
