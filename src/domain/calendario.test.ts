import { describe, it, expect } from 'vitest';
import { aplicarCalendario, avisosDaSemana, dataDoDia, feriadosNacionais } from './calendario';
import type { Cardapio, ItemCardapio, PeriodoSemFuncionamento } from './types';

const periodo = (inicio: string, fim: string, motivo: string): PeriodoSemFuncionamento => ({
  id: inicio, clienteId: 'c1', inicio, fim, motivo,
});

function cardapio(semanaInicio: string, avisos: Cardapio['avisos'] = []): Cardapio {
  const itens: ItemCardapio[] = ([1, 2, 3, 4, 5] as const).map((dia) => ({
    dia, tipoRefeicaoId: 'almoco', categoria: 'proteina', pratoId: `p${dia}`, pratoNome: `Prato ${dia}`,
  }));
  return { id: 'x', clienteId: 'c1', semanaInicio, itens, avisos, geradoEm: '' };
}

describe('calendário de funcionamento', () => {
  it('calcula a data de cada dia da semana', () => {
    expect(dataDoDia('2026-10-12', 1)).toBe('2026-10-12');
    expect(dataDoDia('2026-10-12', 5)).toBe('2026-10-16');
    expect(dataDoDia('2026-10-12', 0)).toBe('2026-10-18');
  });

  it('marca feriado de um dia e recesso de vários dias', () => {
    const periodos = [periodo('2026-10-12', '2026-10-12', 'FERIADO'), periodo('2026-10-15', '2026-10-16', 'RECESSO')];
    expect(avisosDaSemana(periodos, '2026-10-12')).toEqual([
      { dia: 1, texto: 'FERIADO' },
      { dia: 4, texto: 'RECESSO' },
      { dia: 5, texto: 'RECESSO' },
    ]);
    expect(avisosDaSemana(periodos, '2026-10-19')).toEqual([]);
  });

  it('tira os pratos dos dias fechados e mantém os avisos da planilha nos outros dias', () => {
    const c = aplicarCalendario(cardapio('2026-10-12', [{ dia: 3, texto: 'ENTREGA PARECERES' }]), [
      periodo('2026-10-12', '2026-10-12', 'FERIADO'),
    ]);
    expect(c.itens.map((i) => i.dia)).toEqual([2, 3, 4, 5]);
    expect(c.avisos).toEqual([
      { dia: 1, texto: 'FERIADO' },
      { dia: 3, texto: 'ENTREGA PARECERES' },
    ]);
  });

  it('o calendário vence o aviso da planilha no mesmo dia', () => {
    const c = aplicarCalendario(cardapio('2026-10-12', [{ dia: 1, texto: 'ENTREGA PARECERES' }]), [
      periodo('2026-10-12', '2026-10-12', 'FERIADO'),
    ]);
    expect(c.avisos).toEqual([{ dia: 1, texto: 'FERIADO' }]);
  });

  it('recesso que atravessa semanas fecha a semana inteira', () => {
    const c = aplicarCalendario(cardapio('2026-12-21'), [periodo('2026-12-19', '2027-01-04', 'RECESSO')]);
    expect(c.itens).toEqual([]);
    expect(c.avisos?.filter((a) => a.dia >= 1 && a.dia <= 5)).toHaveLength(5);
  });

  it('sem período na semana, devolve o cardápio intacto', () => {
    const original = cardapio('2026-10-19');
    expect(aplicarCalendario(original, [periodo('2026-10-12', '2026-10-12', 'FERIADO')])).toBe(original);
  });

  it('lista os feriados nacionais com as datas móveis certas', () => {
    const f = Object.fromEntries(feriadosNacionais(2026).map((x) => [x.nome, x.data]));
    expect(f['Sexta-feira Santa']).toBe('2026-04-03'); // Páscoa 05/04/2026
    expect(f['Carnaval (terça)']).toBe('2026-02-17');
    expect(f['Corpus Christi']).toBe('2026-06-04');
    expect(f['Nossa Senhora Aparecida']).toBe('2026-10-12');
    expect(feriadosNacionais(2027).find((x) => x.nome === 'Sexta-feira Santa')?.data).toBe('2027-03-26');
  });
});
