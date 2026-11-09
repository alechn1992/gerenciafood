// Filtros e fase da safra usados na tela de Sazonalidade.

import type { CategoriaSazonal, ItemSazonal, RegiaoClimatica } from '../data/sazonalidade';

export type FaseSafra = 'inicio' | 'fim' | 'unico';

const anterior = (mes: number) => (mes === 1 ? 12 : mes - 1);
const seguinte = (mes: number) => (mes === 12 ? 1 : mes + 1);

/**
 * Em que ponto da safra o mês está: "inicio" (o mês anterior não era safra),
 * "fim" (o próximo não será) ou "unico" (só este mês). Sem fase quando o mês
 * está no meio da safra, fora dela, ou a safra é o ano todo.
 */
export function faseSafra(meses: number[], mes: number): FaseSafra | undefined {
  if (!meses.includes(mes) || meses.length >= 12) return undefined;
  const comeca = !meses.includes(anterior(mes));
  const termina = !meses.includes(seguinte(mes));
  if (comeca && termina) return 'unico';
  if (comeca) return 'inicio';
  if (termina) return 'fim';
  return undefined;
}

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export interface FiltroSafra {
  busca: string;
  /** Vazio = todas as categorias. */
  categorias: CategoriaSazonal[];
  /** Só o que está em safra no mês escolhido. */
  soEmSafra: boolean;
  mes: number;
}

export function filtrarSafra(itens: ItemSazonal[], regiao: RegiaoClimatica, f: FiltroSafra): ItemSazonal[] {
  const termo = normalizar(f.busca);
  return itens.filter((i) => {
    const meses = i.meses[regiao] ?? [];
    if (meses.length === 0) return false;
    if (f.soEmSafra && !meses.includes(f.mes)) return false;
    if (f.categorias.length > 0 && !f.categorias.includes(i.categoria)) return false;
    if (termo && !normalizar(i.nome).includes(termo)) return false;
    return true;
  });
}
