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
  taco: { bg: '#e6f4ea', text: '#2d6a4f' },
  usda: { bg: '#e8f0fe', text: '#1a56db' },
  ibge: { bg: '#fff3e0', text: '#c76b00' },
};
