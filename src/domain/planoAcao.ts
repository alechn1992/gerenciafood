// Plano de ação unificado do cliente: uma lista de ações corretivas para as
// não conformidades do checklist de boas práticas e das visitas, com o
// acompanhamento até o item voltar a ficar conforme.

import type { AcaoCorretiva, OrigemAcao, Relatorio, StatusAcao, Visita } from './types';

export interface ItemChecklist {
  id: string;
  texto: string;
}

export function origemDe(a: AcaoCorretiva): OrigemAcao {
  if (a.origem) return a.origem;
  return a.itemId.startsWith('manual-') ? 'manual' : 'checklist';
}

/**
 * Identifica a ação: uma por item do checklist (o mesmo item não conforme em
 * checklists seguidos continua sendo a mesma pendência) e uma por item de
 * cada visita.
 */
export function chaveAcao(a: Pick<AcaoCorretiva, 'itemId' | 'origem' | 'origemId'>): string {
  const origem = origemDe(a as AcaoCorretiva);
  if (origem === 'checklist') return `checklist:${a.itemId}`;
  if (origem === 'visita') return `visita:${a.origemId ?? ''}:${a.itemId}`;
  return `manual:${a.itemId}`;
}

export function chaveChecklist(itemId: string): string {
  return `checklist:${itemId}`;
}

export function chaveVisita(visitaId: string, itemId: string): string {
  return `visita:${visitaId}:${itemId}`;
}

function somarDias(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Ação nova, em branco, para uma não conformidade. */
export function novaAcao(campos: {
  itemId: string;
  itemTexto: string;
  origem: OrigemAcao;
  origemId?: string;
  origemData?: string;
  observacao?: string;
  hoje: string;
}): AcaoCorretiva {
  return {
    itemId: campos.itemId,
    itemTexto: campos.itemTexto,
    acao: '',
    responsavel: '',
    prazo: somarDias(campos.hoje, 30),
    status: 'pendente',
    observacao: campos.observacao ?? '',
    origem: campos.origem,
    origemId: campos.origemId,
    origemData: campos.origemData,
  };
}

/**
 * Traz para o plano as não conformidades que ainda não têm ação e conclui as
 * ações cujo item voltou a ficar conforme:
 *  - checklist: vale o mais recente (por data da avaliação);
 *  - visitas: cada item não conforme de cada visita.
 * Ações já existentes mantêm o que foi preenchido.
 */
export function sincronizarPlano(
  acoes: AcaoCorretiva[],
  fontes: {
    checklists: Relatorio[];
    itensChecklist: ItemChecklist[];
    visitas: Visita[];
    hoje: string;
  },
): AcaoCorretiva[] {
  const resultado = acoes.map((a) => ({ ...a }));
  const porChave = new Map(resultado.map((a) => [chaveAcao(a), a]));
  const textoDoItem = new Map(fontes.itensChecklist.map((i) => [i.id, i.texto]));

  const ultimo = [...fontes.checklists].sort(
    (a, b) => b.dataAvaliacao.localeCompare(a.dataAvaliacao) || b.atualizadoEm.localeCompare(a.atualizadoEm),
  )[0];
  if (ultimo) {
    for (const [itemId, situacao] of Object.entries(ultimo.respostas)) {
      if (!textoDoItem.has(itemId)) continue;
      const existente = porChave.get(chaveChecklist(itemId));
      if (situacao === 'nao_conforme') {
        if (!existente) {
          const a = novaAcao({
            itemId,
            itemTexto: textoDoItem.get(itemId)!,
            origem: 'checklist',
            origemId: ultimo.id,
            origemData: ultimo.dataAvaliacao,
            observacao: ultimo.observacoes[itemId] ?? '',
            hoje: fontes.hoje,
          });
          resultado.push(a);
          porChave.set(chaveChecklist(itemId), a);
        } else if (existente.status === 'concluido' && existente.resolvidoEm) {
          // Voltou a ficar não conforme depois de resolvido: reabre.
          existente.status = 'pendente';
          existente.resolvidoEm = undefined;
          existente.origemId = ultimo.id;
          existente.origemData = ultimo.dataAvaliacao;
        }
      } else if (situacao === 'conforme' && existente && existente.status !== 'concluido') {
        existente.status = 'concluido';
        existente.resolvidoEm = ultimo.dataAvaliacao;
      }
    }
  }

  for (const v of fontes.visitas) {
    for (const secao of v.secoes) {
      for (const item of secao.itens) {
        const chave = chaveVisita(v.id, item.id);
        const existente = porChave.get(chave);
        if (item.status === 'nao_conforme' && !existente) {
          const a = novaAcao({
            itemId: item.id,
            itemTexto: secao.nome ? `${secao.nome}: ${item.descricao}` : item.descricao,
            origem: 'visita',
            origemId: v.id,
            origemData: v.data,
            hoje: fontes.hoje,
          });
          resultado.push(a);
          porChave.set(chave, a);
        } else if (item.status === 'conforme' && existente && existente.status !== 'concluido') {
          existente.status = 'concluido';
          existente.resolvidoEm = v.data;
        }
      }
    }
  }

  return resultado;
}

export type SituacaoAcao = StatusAcao | 'atrasada';

/** Status para exibir: pendente/em andamento com prazo vencido vira "atrasada". */
export function situacaoAcao(a: AcaoCorretiva, hoje: string): SituacaoAcao {
  if (a.status !== 'concluido' && a.prazo && a.prazo < hoje) return 'atrasada';
  return a.status;
}

export interface ResumoAcoes {
  total: number;
  pendentes: number;
  emAndamento: number;
  concluidas: number;
  atrasadas: number;
  /** Concluídas sobre o total, em %. */
  progresso: number;
}

export function resumoAcoes(acoes: AcaoCorretiva[], hoje: string): ResumoAcoes {
  const r = { total: acoes.length, pendentes: 0, emAndamento: 0, concluidas: 0, atrasadas: 0, progresso: 0 };
  for (const a of acoes) {
    if (a.status === 'concluido') r.concluidas++;
    else if (a.status === 'em_andamento') r.emAndamento++;
    else r.pendentes++;
    if (situacaoAcao(a, hoje) === 'atrasada') r.atrasadas++;
  }
  r.progresso = r.total > 0 ? Math.round((r.concluidas / r.total) * 100) : 0;
  return r;
}
