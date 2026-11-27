// Linhas da grade do cardápio (uma por categoria da composição) e em qual
// linha cada item aparece.
//
// A categoria que vale é a do prato no receituário: itens importados da
// planilha ou copiados de semanas antigas guardam a categoria que receberam
// na época (a fruta do café entrava como "Sobremesa" ou "Lanche"), e não
// apareciam na linha "Fruta" da composição. Item de categoria que não está
// na composição ganha linha própria no fim, em vez de sumir da tela.

import { ordemCategoria } from './categorias';
import type { CategoriaPrato, ComposicaoRefeicao, ItemCardapio, Prato } from './types';

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Função que dá a categoria atual do prato de um item (pelo id, senão pelo nome). */
export function categoriaPeloReceituario(pratos: Prato[]): (item: ItemCardapio) => CategoriaPrato {
  const porId = new Map(pratos.map((p) => [p.id, p.categoria]));
  const porNome = new Map(pratos.map((p) => [normalizar(p.nome), p.categoria]));
  return (item) => porId.get(item.pratoId) ?? porNome.get(normalizar(item.pratoNome)) ?? item.categoria;
}

export interface LinhaGrade {
  categoria: CategoriaPrato;
  /** Itens desta categoria no dia que vão para esta linha: [inicio, fim). */
  inicio: number;
  fim: number;
  /** Linha que não está na composição (itens que sobraram). */
  extra: boolean;
}

/**
 * Linhas de uma refeição: as da composição, na ordem, e depois uma para cada
 * categoria presente nos itens que a composição não tem. Quando a mesma
 * categoria aparece em mais de uma linha (ex.: "Fruta" duas vezes), cada
 * linha fica com a sua quantidade de itens, e a última com o que sobrar.
 */
export function linhasDaRefeicao(
  composicao: ComposicaoRefeicao[],
  categoriasPresentes: CategoriaPrato[],
): LinhaGrade[] {
  const linhas: LinhaGrade[] = [];
  const usado = new Map<CategoriaPrato, number>();
  composicao.forEach((comp, i) => {
    const inicio = usado.get(comp.categoria) ?? 0;
    const ultimaDaCategoria = !composicao.slice(i + 1).some((c) => c.categoria === comp.categoria);
    const fim = ultimaDaCategoria ? Infinity : inicio + Math.max(1, comp.quantidade);
    usado.set(comp.categoria, fim);
    linhas.push({ categoria: comp.categoria, inicio, fim, extra: false });
  });
  const extras = [...new Set(categoriasPresentes)]
    .filter((c) => !composicao.some((comp) => comp.categoria === c))
    .sort((a, b) => ordemCategoria(a) - ordemCategoria(b));
  for (const categoria of extras) linhas.push({ categoria, inicio: 0, fim: Infinity, extra: true });
  return linhas;
}
