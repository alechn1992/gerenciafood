import { describe, expect, it } from 'vitest';
import { categoriaPeloReceituario, linhasDaRefeicao } from './gradeCardapio';
import type { ItemCardapio, Prato } from './types';

const prato = (id: string, nome: string, categoria: string): Prato => ({
  id,
  nome,
  categoria,
  restricoes: [],
  tags: [],
  ativo: true,
});
const item = (pratoId: string, pratoNome: string, categoria: string): ItemCardapio => ({
  dia: 1,
  tipoRefeicaoId: 'cafe',
  categoria,
  pratoId,
  pratoNome,
});

describe('categoria do item pelo receituário', () => {
  const cat = categoriaPeloReceituario([prato('p1', 'Banana amassada', 'fruta'), prato('p2', 'Mamão', 'fruta')]);
  it('usa a categoria atual do prato (id ou nome) e cai na do item se não achar', () => {
    expect(cat(item('p1', 'Banana amassada', 'sobremesa'))).toBe('fruta');
    expect(cat(item('id-antigo', 'MAMÃO', 'lanche'))).toBe('fruta');
    expect(cat(item('x', 'Bolo de cenoura', 'lanche'))).toBe('lanche');
  });
});

describe('linhas da grade', () => {
  it('fórmula + fruta + lanche + fruta: cada linha de fruta com o seu item', () => {
    const linhas = linhasDaRefeicao(
      [
        { categoria: 'bebida', quantidade: 1 },
        { categoria: 'fruta', quantidade: 1 },
        { categoria: 'lanche', quantidade: 1 },
        { categoria: 'fruta', quantidade: 1 },
      ],
      ['bebida', 'fruta', 'fruta'],
    );
    expect(linhas.map((l) => [l.categoria, l.inicio, l.fim])).toEqual([
      ['bebida', 0, Infinity],
      ['fruta', 0, 1],
      ['lanche', 0, Infinity],
      ['fruta', 1, Infinity],
    ]);
  });

  it('categoria fora da composição ganha linha própria no fim', () => {
    const linhas = linhasDaRefeicao([{ categoria: 'proteina', quantidade: 1 }], ['proteina', 'outro', 'sobremesa']);
    expect(linhas.map((l) => [l.categoria, l.extra])).toEqual([
      ['proteina', false],
      ['sobremesa', true],
      ['outro', true],
    ]);
  });

  it('sem composição: uma linha por categoria presente', () => {
    expect(linhasDaRefeicao([], ['lanche', 'bebida']).map((l) => l.categoria)).toEqual(['bebida', 'lanche']);
  });
});
