import { useCallback, useEffect, useRef, useState } from 'react';
import type { AcaoCorretiva, PlanoAcao, Relatorio, Visita } from '../domain/types';
import { CHECKLIST_BOAS_PRATICAS, CHECKLIST_CEI_SESA_162 } from '../domain/legislacao';
import { chaveAcao, novaAcao, sincronizarPlano } from '../domain/planoAcao';
import { useData } from './DataContext';

export const ITENS_CHECKLIST = [...CHECKLIST_BOAS_PRATICAS, ...CHECKLIST_CEI_SESA_162]
  .flatMap((b) => b.itens)
  .map((i) => ({ id: i.id, texto: i.texto }));

export const hojeISO = () => new Date().toISOString().slice(0, 10);

/**
 * Plano de ação do cliente, já sincronizado com o checklist mais recente e com
 * as visitas: não conformidades novas entram como ações pendentes e as que
 * voltaram a ficar conformes são concluídas.
 */
export function usePlanoAcao(clienteId: string | undefined) {
  const { repo } = useData();
  const [acoes, setAcoes] = useState<AcaoCorretiva[]>([]);
  const [checklists, setChecklists] = useState<Relatorio[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [sujo, setSujo] = useState(false);
  const meta = useRef<{ id: string; criadoEm: string }>({ id: crypto.randomUUID(), criadoEm: new Date().toISOString() });

  const carregar = useCallback(async () => {
    if (!clienteId) return;
    setCarregando(true);
    try {
      const [plano, rels, vis] = await Promise.all([
        repo.carregarPlanoAcao(clienteId).catch(() => null),
        repo.listarRelatorios(clienteId).catch(() => [] as Relatorio[]),
        repo.listarVisitas(clienteId).catch(() => [] as Visita[]),
      ]);
      if (plano) meta.current = { id: plano.id, criadoEm: plano.criadoEm };
      setChecklists(rels);
      setVisitas(vis);
      const anteriores = plano?.acoes ?? [];
      const sincronizadas = sincronizarPlano(anteriores, {
        checklists: rels,
        itensChecklist: ITENS_CHECKLIST,
        visitas: vis,
        hoje: hojeISO(),
      });
      setAcoes(sincronizadas);
      // Sincronizar mudou algo: fica pendente de salvar.
      setSujo(JSON.stringify(sincronizadas) !== JSON.stringify(anteriores));
    } finally {
      setCarregando(false);
    }
  }, [clienteId, repo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const acaoPorChave = useCallback(
    (chave: string) => acoes.find((a) => chaveAcao(a) === chave),
    [acoes],
  );

  /** Altera a ação da chave; se ainda não existe, cria a partir de `base`. */
  const atualizarAcao = useCallback(
    (chave: string, campos: Partial<AcaoCorretiva>, base?: Parameters<typeof novaAcao>[0]) => {
      setAcoes((prev) => {
        const i = prev.findIndex((a) => chaveAcao(a) === chave);
        if (i >= 0) return prev.map((a, j) => (j === i ? { ...a, ...campos } : a));
        if (!base) return prev;
        return [...prev, { ...novaAcao(base), ...campos }];
      });
      setSujo(true);
    },
    [],
  );

  const substituirAcoes = useCallback((novas: AcaoCorretiva[]) => {
    setAcoes(novas);
    setSujo(true);
  }, []);

  /** Salva o plano; com `fontes`, sincroniza antes (ex.: logo após salvar um checklist). */
  const salvar = useCallback(
    async (fontes?: { checklists?: Relatorio[]; visitas?: Visita[] }) => {
      if (!clienteId) return;
      let lista = acoes;
      if (fontes) {
        const rels = fontes.checklists ?? checklists;
        const vis = fontes.visitas ?? visitas;
        setChecklists(rels);
        setVisitas(vis);
        lista = sincronizarPlano(acoes, { checklists: rels, itensChecklist: ITENS_CHECKLIST, visitas: vis, hoje: hojeISO() });
        setAcoes(lista);
      }
      const plano: PlanoAcao = {
        id: meta.current.id,
        clienteId,
        relatorioId: checklists[0]?.id ?? '',
        acoes: lista,
        criadoEm: meta.current.criadoEm,
        atualizadoEm: new Date().toISOString(),
      };
      await repo.salvarPlanoAcao(plano);
      setSujo(false);
    },
    [acoes, checklists, visitas, clienteId, repo],
  );

  return { acoes, checklists, visitas, carregando, sujo, acaoPorChave, atualizarAcao, substituirAcoes, salvar, recarregar: carregar };
}
