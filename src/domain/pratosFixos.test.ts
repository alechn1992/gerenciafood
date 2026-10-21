import { describe, it, expect } from 'vitest';
import { aplicarPratosFixos, fixoDaCelula } from './pratosFixos';
import { gerarCardapio } from './gerador';
import type { Cliente, DiaSemana, ItemCardapio, Prato, PratoFixoCliente, Turma } from './types';

const DIAS: DiaSemana[] = [1, 2, 3, 4, 5];
const prato = (id: string, nome: string, categoria: Prato['categoria']): Prato => ({
  id, nome, categoria, restricoes: [], tags: [], ativo: true,
});
const formula = prato('f', 'Leite materno/Fórmula Infantil', 'bebida');
const suco = prato('s', 'Suco de laranja', 'bebida');
const fruta = prato('b', 'Banana amassada', 'sobremesa');

const fixo = (over: Partial<PratoFixoCliente>): PratoFixoCliente => ({
  diaId: 1, tipoRefeicaoId: 'cafe', categoria: 'bebida', pratoId: formula.id, pratoNome: formula.nome, ...over,
});

describe('pratos fixos', () => {
  it('"todos os dias" vale para qualquer dia, e o do dia específico vence', () => {
    const fixos = [fixo({ todosOsDias: true }), fixo({ diaId: 5, pratoId: suco.id, pratoNome: suco.nome })];
    expect(fixoDaCelula(fixos, { dia: 3, tipoRefeicaoId: 'cafe', categoria: 'bebida' })?.pratoId).toBe('f');
    expect(fixoDaCelula(fixos, { dia: 5, tipoRefeicaoId: 'cafe', categoria: 'bebida' })?.pratoId).toBe('s');
    expect(fixoDaCelula(fixos, { dia: 3, tipoRefeicaoId: 'almoco', categoria: 'bebida' })).toBeUndefined();
  });

  it('respeita as turmas escolhidas; sem turma marcada, vale para todas', () => {
    const soBaby1 = fixo({ todosOsDias: true, turmaIds: ['baby1'] });
    expect(fixoDaCelula([soBaby1], { dia: 1, tipoRefeicaoId: 'cafe', categoria: 'bebida', turmaId: 'baby1' })).toBeDefined();
    expect(fixoDaCelula([soBaby1], { dia: 1, tipoRefeicaoId: 'cafe', categoria: 'bebida', turmaId: 'infantis' })).toBeUndefined();
    expect(fixoDaCelula([fixo({ todosOsDias: true })], { dia: 1, tipoRefeicaoId: 'cafe', categoria: 'bebida', turmaId: 'infantis' })).toBeDefined();
  });

  it('no cardápio gerado pelo histórico, troca o item da categoria ou inclui no começo da refeição', () => {
    const itens: ItemCardapio[] = DIAS.flatMap((dia) => [
      { dia, tipoRefeicaoId: 'cafe', categoria: 'bebida', pratoId: suco.id, pratoNome: suco.nome },
      { dia, tipoRefeicaoId: 'lanche_tarde', categoria: 'sobremesa', pratoId: fruta.id, pratoNome: fruta.nome },
    ]);
    const fixos = [
      fixo({ todosOsDias: true }),
      fixo({ todosOsDias: true, tipoRefeicaoId: 'lanche_tarde' }),
    ];
    const r = aplicarPratosFixos(itens, fixos, { dias: DIAS, turmaId: 'baby1', pratos: [formula, suco, fruta] });
    for (const dia of DIAS) {
      expect(r.filter((i) => i.dia === dia && i.tipoRefeicaoId === 'cafe').map((i) => i.pratoNome)).toEqual([formula.nome]);
      expect(r.filter((i) => i.dia === dia && i.tipoRefeicaoId === 'lanche_tarde').map((i) => i.pratoNome)).toEqual([
        formula.nome,
        fruta.nome,
      ]);
    }
  });

  it('não aplica prato desativado nem em turma fora da lista', () => {
    const itens: ItemCardapio[] = [{ dia: 1, tipoRefeicaoId: 'cafe', categoria: 'bebida', pratoId: suco.id, pratoNome: suco.nome }];
    expect(aplicarPratosFixos(itens, [fixo({})], { dias: DIAS, pratos: [{ ...formula, ativo: false }, suco] })).toEqual(itens);
    expect(aplicarPratosFixos(itens, [fixo({ turmaIds: ['baby1'] })], { dias: DIAS, turmaId: 'infantis', pratos: [formula, suco] })).toEqual(itens);
  });

  it('o gerador por composição aplica "todos os dias" só nas turmas escolhidas', () => {
    const turma = (id: string): Turma => ({
      id, clienteId: 'c1', nome: id, ordem: 0, restricoes: [],
      refeicoes: [{ tipoRefeicaoId: 'cafe', composicao: [{ categoria: 'bebida', quantidade: 1 }] }],
    });
    const cliente: Cliente = {
      id: 'c1', nome: 'Escola', uf: 'PR', diasOperacao: DIAS, refeicoes: [], restricoes: [], criadoEm: '',
      pratosFixos: [fixo({ todosOsDias: true, turmaIds: ['baby1'] })],
    };
    const pratos = [formula, suco, prato('c', 'Chá', 'bebida')];
    const baby = gerarCardapio({ cliente, turma: turma('baby1'), pratos, semanaInicio: '2026-11-02', seed: 1 }).cardapio;
    const infantis = gerarCardapio({ cliente, turma: turma('infantis'), pratos, semanaInicio: '2026-11-02', seed: 1 }).cardapio;
    expect(baby.itens.every((i) => i.pratoId === 'f')).toBe(true);
    expect(infantis.itens.some((i) => i.pratoId !== 'f')).toBe(true);
  });
});
