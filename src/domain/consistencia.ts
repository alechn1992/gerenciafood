// Consistência das frutas para o berçário (amassada / raspada), sem precisar
// cadastrar o mesmo prato duas vezes: o nome do item no cardápio ganha ou perde
// o complemento, e o prato cadastrado continua um só.

import type { ItemCardapio } from './types';
import { ehFormula } from './pratosEspeciais';

export type Consistencia = 'amassada' | 'raspada';

const SUFIXO = /\s+(amassad|raspad)([oa])s?$/i;

/** Consistência já escrita no nome (ex.: "Melão raspado" → 'raspada'). */
export function consistenciaDe(nome: string): Consistencia | null {
  const m = nome.trim().match(SUFIXO);
  if (!m) return null;
  return m[1].toLowerCase() === 'amassad' ? 'amassada' : 'raspada';
}

/** Nome sem a consistência: "Banana amassada" → "Banana". */
export function nomeBase(nome: string): string {
  return nome.trim().replace(SUFIXO, '');
}

/** Concordância pelo primeiro nome: "Mamão amassado", "Maçã raspada", "Salada de frutas amassada". */
function flexionar(c: Consistencia, base: string): string {
  const primeira = base.split(/\s+/)[0] ?? '';
  const feminino = /[aã]$/i.test(primeira);
  const raiz = c === 'amassada' ? 'amassad' : 'raspad';
  return raiz + (feminino ? 'a' : 'o');
}

/** Nome com a consistência escolhida (ou sem nenhuma, com null). */
export function aplicarConsistencia(nome: string, c: Consistencia | null): string {
  const base = nomeBase(nome);
  return c ? `${base} ${flexionar(c, base)}` : base;
}

/** Frutas de polpa firme costumam ser raspadas; as macias, amassadas. */
const RASPADAS = /^(ma[cç][aã]|pera|mel[aã]o|goiaba|caqui|nectarina|pêssego|pessego)(?=\s|$)/i;

/** Cítricos vão em gomos ou suco: o atalho "todas" não mexe neles. */
const SEM_CONSISTENCIA = /^(laranja|mexerica|tangerina|ponkan|bergamota|lim[aã]o)(?=\s|$)/i;

/** Consistência indicada para a fruta; null quando não se aplica (cítricos). */
export function consistenciaSugerida(nome: string): Consistencia | null {
  const base = nomeBase(nome);
  if (SEM_CONSISTENCIA.test(base)) return null;
  return RASPADAS.test(base) ? 'raspada' : 'amassada';
}

/**
 * O item é uma fruta simples, que admite consistência? Frutas ficam em
 * "Sobremesa" (ou numa categoria cadastrada com "fruta" no nome); combinações
 * ("Bolo + Maçã") e fórmula ficam de fora.
 */
export function aceitaConsistencia(item: ItemCardapio): boolean {
  const categoria = String(item.categoria).toLowerCase();
  return (
    (categoria === 'sobremesa' || categoria.includes('fruta')) &&
    !ehFormula(item.pratoNome) &&
    !/[+,]/.test(item.pratoNome)
  );
}
