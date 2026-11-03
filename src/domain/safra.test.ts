import { describe, expect, it } from 'vitest';
import { faseSafra, filtrarSafra } from './safra';
import type { ItemSazonal } from '../data/sazonalidade';

describe('faseSafra', () => {
  it('início, fim, único, meio e ano todo', () => {
    expect(faseSafra([5, 6, 7], 5)).toBe('inicio');
    expect(faseSafra([5, 6, 7], 7)).toBe('fim');
    expect(faseSafra([5, 6, 7], 6)).toBeUndefined();
    expect(faseSafra([9], 9)).toBe('unico');
    expect(faseSafra([5, 6, 7], 8)).toBeUndefined();
    expect(faseSafra([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3)).toBeUndefined();
  });
  it('safra que atravessa o ano', () => {
    expect(faseSafra([11, 12, 1, 2], 11)).toBe('inicio');
    expect(faseSafra([11, 12, 1, 2], 1)).toBeUndefined();
    expect(faseSafra([11, 12, 1, 2], 2)).toBe('fim');
  });
});

describe('filtrarSafra', () => {
  const itens: ItemSazonal[] = [
    { id: 'm', nome: 'Mamão', categoria: 'fruta', palavrasChave: [], meses: { sul: [10, 11] } },
    { id: 'a', nome: 'Abóbora', categoria: 'legume', palavrasChave: [], meses: { sul: [3] } },
    { id: 'c', nome: 'Couve', categoria: 'verdura', palavrasChave: [], meses: { sudeste: [10] } },
  ];
  const base = { busca: '', categorias: [], soEmSafra: false, mes: 10 };
  it('sem filtros: todos com safra na região', () => {
    expect(filtrarSafra(itens, 'sul', base).map((i) => i.id)).toEqual(['m', 'a']);
  });
  it('só em safra no mês, categoria e busca sem acento', () => {
    expect(filtrarSafra(itens, 'sul', { ...base, soEmSafra: true }).map((i) => i.id)).toEqual(['m']);
    expect(filtrarSafra(itens, 'sul', { ...base, categorias: ['legume'] }).map((i) => i.id)).toEqual(['a']);
    expect(filtrarSafra(itens, 'sul', { ...base, busca: 'mamao' }).map((i) => i.id)).toEqual(['m']);
  });
});
