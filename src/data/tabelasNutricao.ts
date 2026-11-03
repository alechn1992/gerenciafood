// Tabela combinada: TACO + USDA + IBGE.
import { TACO, type ItemTaco, type FonteNutricional } from './taco';
import { USDA } from './usda';
import { IBGE } from './ibge';

export type { ItemTaco, FonteNutricional };

export const TODAS_TABELAS: ItemTaco[] = [...TACO, ...USDA, ...IBGE];

export const ROTULO_FONTE: Record<FonteNutricional, string> = {
  taco: 'TACO',
  usda: 'USDA',
  ibge: 'IBGE',
};

export const COR_FONTE: Record<FonteNutricional, { bg: string; text: string }> = {
  taco: { bg: 'var(--tom-verde-bg, #e6f4ea)', text: 'var(--tom-verde-texto, #2d6a4f)' },
  usda: { bg: 'var(--tom-azul-bg, #e8f0fe)', text: 'var(--tom-azul-texto, #1a56db)' },
  ibge: { bg: 'var(--tom-laranja-bg, #fff3e0)', text: 'var(--tom-laranja-texto, #c76b00)' },
};
