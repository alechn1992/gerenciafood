import { describe, expect, it } from 'vitest';
import { ehFruta, estiloDeTextura, unificarFrutas } from './frutaUnica';
import type { Cardapio, ItemCardapio } from './types';

const item = (tipoRefeicaoId: string, pratoNome: string, dia = 1, categoria = 'sobremesa'): ItemCardapio => ({
  dia: dia as ItemCardapio['dia'],
  tipoRefeicaoId,
  categoria: categoria as ItemCardapio['categoria'],
  pratoId: pratoNome,
  pratoNome,
});
const card = (turmaId: string, itens: ItemCardapio[]): Cardapio => ({
  id: turmaId, clienteId: 'c1', turmaId, semanaInicio: '2026-11-09', itens, geradoEm: '',
});
const nomes = (c: Cardapio, refeicao: string) => c.itens.filter((i) => i.tipoRefeicaoId === refeicao).map((i) => i.pratoNome);

describe('ehFruta', () => {
  it('reconhece fruta sozinha, com textura ou descrição', () => {
    expect(ehFruta('Maçã raspada')).toBe(true);
    expect(ehFruta('Uva verde sem semente cortada')).toBe(true);
    expect(ehFruta('Melancia')).toBe(true);
    expect(ehFruta('Salada de frutas')).toBe(true);
  });
  it('não confunde preparações e bebidas', () => {
    expect(ehFruta('Bolo de banana')).toBe(false);
    expect(ehFruta('Banana com aveia')).toBe(false);
    expect(ehFruta('Suco de frutas')).toBe(false);
    expect(ehFruta('Leite materno/Fórmula Infantil')).toBe(false);
    expect(ehFruta('Pizza caseira')).toBe(false);
  });
});

describe('unificarFrutas', () => {
  // Como sai do "Gerar": cada turma sorteou uma fruta diferente para o café.
  const porTurma = {
    b1: card('b1', [item('cafe', 'Leite materno/Fórmula Infantil', 1, 'bebida'), item('cafe', 'Morango amassado')]),
    b2: card('b2', [item('cafe', 'Manga amassada')]),
    b4: card('b4', [item('cafe', 'Morango')]),
    b5: card('b5', [item('cafe', 'Banana', 1, 'lanche')]),
    inf: card('inf', [item('cafe', 'Suco de frutas', 1, 'lanche'), item('cafe', 'Pizza caseira + Melão')]),
  };
  const ordem = ['b1', 'b2', 'b4', 'b5', 'inf'];

  it('a fruta mais frequente vale para todas, cada turma com sua forma de servir', () => {
    const r = unificarFrutas(porTurma, ordem);
    expect(nomes(r.porTurma.b1, 'cafe')).toEqual(['Leite materno/Fórmula Infantil', 'Morango amassado']);
    expect(nomes(r.porTurma.b2, 'cafe')).toEqual(['Morango amassado']);
    expect(nomes(r.porTurma.b4, 'cafe')).toEqual(['Morango']);
    expect(nomes(r.porTurma.b5, 'cafe')).toEqual(['Morango']);
    expect(nomes(r.porTurma.inf, 'cafe')).toEqual(['Suco de frutas', 'Pizza caseira + Morango']);
    expect(r.trocas).toBe(3);
  });

  it('em empate vale a primeira turma; fruta firme vira raspada nos bebês', () => {
    const r = unificarFrutas(
      { a: card('a', [item('lanche_tarde', 'Maçã')]), b: card('b', [item('lanche_tarde', 'Banana amassada')]) },
      ['a', 'b'],
    );
    expect(nomes(r.porTurma.b, 'lanche_tarde')).toEqual(['Maçã raspada']);
  });

  it('cítrico não ganha textura', () => {
    const r = unificarFrutas(
      { a: card('a', [item('cafe', 'Laranja')]), b: card('b', [item('cafe', 'Mamão amassado')]) },
      ['a', 'b'],
    );
    expect(nomes(r.porTurma.b, 'cafe')).toEqual(['Laranja']);
  });

  it('dias e refeições diferentes não se misturam; já iguais não mudam', () => {
    const r = unificarFrutas(
      {
        a: card('a', [item('cafe', 'Manga', 1), item('cafe', 'Kiwi', 2)]),
        b: card('b', [item('cafe', 'Manga amassada', 1), item('lanche_tarde', 'Uva', 2)]),
      },
      ['a', 'b'],
    );
    expect(r.trocas).toBe(0);
  });

  it('usa o prato cadastrado com o novo nome, quando existe', () => {
    const r = unificarFrutas(
      { a: card('a', [item('cafe', 'Mamão')]), b: card('b', [item('cafe', 'Pera raspada')]) },
      ['a', 'b'],
      [{ id: 'p-mamao-am', nome: 'Mamão amassado', categoria: 'sobremesa', restricoes: [], tags: [], ativo: true }],
    );
    expect(r.porTurma.b.itens[0]).toMatchObject({ pratoNome: 'Mamão amassado', pratoId: 'p-mamao-am' });
  });
});

describe('estilo de textura por turma', () => {
  it('a turma recebe a textura que costuma receber, mesmo se o sorteio trouxe outra', () => {
    const historico = [
      card('bebe', [item('cafe', 'Banana amassada'), item('cafe', 'Maçã raspada', 2), item('cafe', 'Kiwi', 3)]),
      card('maior', [item('cafe', 'Banana'), item('cafe', 'Pera', 2)]),
    ];
    const estilo = estiloDeTextura(historico);
    expect(estilo).toEqual({ bebe: true, maior: false });
    const r = unificarFrutas(
      { bebe: card('bebe', [item('cafe', 'Mamão')]), maior: card('maior', [item('cafe', 'Mamão amassado')]) },
      ['bebe', 'maior'],
      [],
      estilo,
    );
    expect(nomes(r.porTurma.bebe, 'cafe')).toEqual(['Mamão amassado']);
    expect(nomes(r.porTurma.maior, 'cafe')).toEqual(['Mamão']);
  });
});

describe('fruta com preparo no nome', () => {
  it('não ganha textura em cima do preparo', () => {
    const r = unificarFrutas(
      { a: card('a', [item('cafe', 'Uva verde sem semente cortada')]), b: card('b', [item('cafe', 'Uva verde sem semente cortada')]), c: card('c', [item('cafe', 'Banana amassada')]) },
      ['a', 'b', 'c'],
      [],
      { c: true },
    );
    expect(nomes(r.porTurma.c, 'cafe')).toEqual(['Uva verde sem semente cortada']);
  });
});
