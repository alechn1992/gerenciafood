import { describe, expect, it } from 'vitest';
import { dataNaSemana, mesDaSemana, mesesDasSemanas, mesInicialDaLista, rotuloMes, semanasDoMes, turmaPadraoCozinha } from './cozinhaMensal';
import type { DiaSemana } from './types';

const SEG_SEX: DiaSemana[] = [1, 2, 3, 4, 5];

describe('semanasDoMes', () => {
  it('novembro de 2026 (dia 1 é domingo): semanas de 02 a 30', () => {
    expect(semanasDoMes('2026-11', SEG_SEX)).toEqual(['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30']);
  });
  it('inclui a semana que começa no mês anterior quando tem dia útil no mês', () => {
    // 1º de outubro de 2026 é quinta-feira.
    expect(semanasDoMes('2026-10', SEG_SEX)[0]).toBe('2026-09-28');
  });
  it('ignora a semana cujo único dia no mês não é de funcionamento', () => {
    // 1º de agosto de 2026 é sábado: a semana de 27/07 não entra para seg–sex.
    expect(semanasDoMes('2026-08', SEG_SEX)[0]).toBe('2026-08-03');
    expect(semanasDoMes('2026-08', [1, 2, 3, 4, 5, 6])[0]).toBe('2026-07-27');
  });
});

describe('datas', () => {
  it('dataNaSemana e mesDaSemana', () => {
    expect(dataNaSemana('2026-11-30', 5)).toBe('2026-12-04');
    expect(dataNaSemana('2026-11-30', 0)).toBe('2026-12-06');
    expect(mesDaSemana('2026-11-30')).toBe('2026-12');
    expect(mesDaSemana('2026-09-28')).toBe('2026-10');
    expect(rotuloMes('2026-03')).toBe('Março de 2026');
  });
});

describe('turmaPadraoCozinha', () => {
  it('prefere a turma dos infantis', () => {
    expect(turmaPadraoCozinha([{ nome: 'Baby 1' }, { nome: 'INFANTIS (2 a 5 anos)' }])?.nome).toBe('INFANTIS (2 a 5 anos)');
    expect(turmaPadraoCozinha([{ nome: 'Baby 1' }, { nome: 'Infantil 3' }])?.nome).toBe('Infantil 3');
    expect(turmaPadraoCozinha([{ nome: 'Baby 1' }])?.nome).toBe('Baby 1');
  });
});

describe('lista de semanas salvas por mês', () => {
  const semanas = ['2026-09-28', '2026-10-05', '2026-10-26', '2026-11-02', '2026-11-30'];
  it('agrupa pelo mês da quinta-feira, do mais recente ao mais antigo', () => {
    expect(mesesDasSemanas(semanas)).toEqual(['2026-12', '2026-11', '2026-10']);
  });
  it('abre no mês atual quando ele tem semana salva', () => {
    expect(mesInicialDaLista(['2026-12', '2026-11', '2026-10'], new Date(2026, 10, 9))).toBe('2026-11');
  });
  it('sem o mês atual, abre no mais próximo (empate: o seguinte)', () => {
    expect(mesInicialDaLista(['2026-12', '2026-10'], new Date(2026, 10, 9))).toBe('2026-12');
    expect(mesInicialDaLista(['2026-08', '2026-07'], new Date(2026, 10, 9))).toBe('2026-08');
    expect(mesInicialDaLista([], new Date(2026, 10, 9))).toBeUndefined();
  });
});
