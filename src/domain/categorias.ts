// Lista de categorias de prato: as padrão mais as cadastradas pela
// nutricionista. Fica num registro do módulo porque rótulo e ordem das
// categorias são usados também fora dos componentes (gerador, impressão);
// o DataContext atualiza o registro sempre que carrega as cadastradas.

import { CATEGORIAS_PRATO, type CategoriaCadastrada, type CategoriaPrato } from './types';

let cadastradas: CategoriaCadastrada[] = [];

export function definirCategoriasCadastradas(lista: CategoriaCadastrada[]): void {
  cadastradas = lista.filter((c) => !CATEGORIAS_PRATO.some((p) => p.valor === c.valor));
}

/** Padrão + cadastradas, com "Outro" sempre por último. */
export function categoriasDisponiveis(): { valor: CategoriaPrato; nome: string }[] {
  const semOutro = CATEGORIAS_PRATO.filter((c) => c.valor !== 'outro');
  const outro = CATEGORIAS_PRATO.filter((c) => c.valor === 'outro');
  return [...semOutro, ...cadastradas.map((c) => ({ valor: c.valor, nome: c.nome })), ...outro];
}

export function rotuloCategoria(c: CategoriaPrato): string {
  return categoriasDisponiveis().find((x) => x.valor === c)?.nome ?? c;
}

/** Posição da categoria na lista, para ordenar linhas e pratos de uma célula. */
export function ordemCategoria(c: CategoriaPrato): number {
  const i = categoriasDisponiveis().findIndex((x) => x.valor === c);
  return i === -1 ? 99 : i;
}
