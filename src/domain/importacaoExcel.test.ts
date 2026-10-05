import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parsearPlanilha, type DadosParseados } from './importacaoExcel';

const DIAS = ['SEGUNDA', 'TERÇA ', 'QUARTA', 'QUINTA', 'SEXTA'];

/** Datas de segunda a sexta a partir de uma segunda-feira (AAAA-MM-DD). */
function datasDaSemana(segunda: string): Date[] {
  const base = new Date(`${segunda}T00:00:00Z`);
  return Array.from({ length: 5 }, (_, i) => new Date(base.getTime() + i * 86_400_000));
}

/** Monta um bloco semanal no formato da aba SEM LACTOSE. */
function blocoSemLactose(segunda: string, cabecalho: string[], almoco: string[]): unknown[][] {
  return [
    [null, ...cabecalho],
    [null, ...datasDaSemana(segunda)],
    ['Almoço', ...almoco],
    // Em dia de feriado a planilha repete o marcador em vez de um prato.
    ['Jantar', ...almoco.map((a) => (!a || /^(FERIADO|RECESSO)$/.test(a) ? a : `Sopa de ${a.toLowerCase()}`))],
  ];
}

function abaSemana(segunda: string, cabecalho: string[], almoco: string[]): unknown[][] {
  return [
    [null, ...cabecalho],
    [null, ...datasDaSemana(segunda)],
    ['INFANTIS', null, null, null, null, null],
    ['Almoço', ...almoco],
  ];
}

function planilha(abas: Record<string, unknown[][]>): DadosParseados {
  const wb = XLSX.utils.book_new();
  for (const [nome, linhas] of Object.entries(abas)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhas, { cellDates: true }), nome);
  }
  // Ida e volta em binário para reproduzir a leitura real do navegador.
  const bin = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return parsearPlanilha(XLSX.read(bin, { type: 'array', cellDates: true }));
}

function pratosDe(dados: DadosParseados, semana: string, turma: string) {
  const t = dados.semanas.find((s) => s.semanaInicio === semana)?.turmas.find((x) => x.nome === turma);
  if (!t) return undefined;
  return t.refeicoes.flatMap((r) =>
    r.dias.flatMap((d) => d.pratos.map((p) => `${r.tipoId}:${d.dia}:${p.nome}`)),
  );
}

function avisosDe(dados: DadosParseados, semana: string, turma: string) {
  const t = dados.semanas.find((s) => s.semanaInicio === semana)?.turmas.find((x) => x.nome === turma);
  return t?.avisos.map((a) => `${a.dia}:${a.texto}`);
}

describe('parsearPlanilha — aba SEM LACTOSE', () => {
  it('lê todas as semanas empilhadas no formato padrão', () => {
    const dados = planilha({
      'SEMANA 1': abaSemana('2026-08-03', DIAS, ['Arroz', 'Arroz', 'Arroz', 'Arroz', 'Arroz']),
      'SEM LACTOSE.': [
        ['ESCOLA PONTE DO SABER'],
        ['CARDÁPIO INFANTIL (Infantil I ao V)'],
        ...blocoSemLactose('2026-08-03', DIAS, ['Frango', 'Carne', 'Ovo', 'Peixe', 'Frango']),
        ...blocoSemLactose('2026-08-10', DIAS, ['Carne', 'Frango', 'Ovo', 'Carne', 'Peixe']),
      ],
    });

    expect(pratosDe(dados, '2026-08-03', 'Sem Lactose')).toHaveLength(10);
    expect(pratosDe(dados, '2026-08-10', 'Sem Lactose')).toContain('almoco:1:Carne');
  });

  it('reconhece a semana mesmo com "FERIADO" no lugar de "SEGUNDA" no cabeçalho', () => {
    // Caso real de outubro: a segunda 05/10 vem rotulada FERIADO, mas com cardápio servido.
    const dados = planilha({
      'SEMANA 1': abaSemana('2026-09-28', DIAS, ['Arroz', 'Arroz', 'Arroz', 'Arroz', 'Arroz']),
      'SEM LACTOSE.': [
        ['CARDÁPIO INFANTIL'],
        ...blocoSemLactose('2026-09-28', DIAS, ['Frango', 'Carne', 'Ovo', 'Peixe', 'Frango']),
        ...blocoSemLactose('2026-10-05', ['FERIADO', ...DIAS.slice(1)], ['Crepioca', 'Lasanha', 'Risoto', 'Carne', 'Nuggets']),
      ],
    });

    const semana05 = pratosDe(dados, '2026-10-05', 'Sem Lactose');
    expect(semana05).toBeDefined();
    expect(semana05).toContain('almoco:1:Crepioca');

    // E a semana anterior não absorve nada da seguinte.
    expect(pratosDe(dados, '2026-09-28', 'Sem Lactose')).toHaveLength(10);

    // Rótulo FERIADO com cardápio servido no dia: o cardápio prevalece, sem aviso.
    expect(avisosDe(dados, '2026-10-05', 'Sem Lactose')).toEqual([]);
  });

  it('não importa marcadores de feriado, nomes de dia nem datas como prato', () => {
    const dados = planilha({
      'SEMANA 1': abaSemana('2026-10-12', DIAS, ['Arroz', 'Arroz', 'Arroz', 'Arroz', 'Arroz']),
      'SEM LACTOSE.': [
        ['CARDÁPIO INFANTIL'],
        ...blocoSemLactose('2026-10-05', DIAS, ['Frango', 'Carne', 'Ovo', 'Peixe', 'Frango']),
        ...blocoSemLactose(
          '2026-10-12',
          ['FERIADO', 'TERÇA ', 'QUARTA', 'FERIADO', 'FERIADO'],
          ['FERIADO', 'Carne', 'Frango', 'FERIADO', 'RECESSO'],
        ),
      ],
    });

    const todos = dados.semanas.flatMap((s) =>
      s.turmas.flatMap((t) => t.refeicoes.flatMap((r) => r.dias.flatMap((d) => d.pratos.map((p) => p.nome)))),
    );
    expect(todos).not.toContain('FERIADO');
    expect(todos).not.toContain('RECESSO');
    expect(todos.some((n) => /TERÇA|QUARTA|GMT|\d{4}/.test(n))).toBe(false);
    expect(pratosDe(dados, '2026-10-12', 'Sem Lactose')).toEqual([
      'almoco:2:Carne', 'almoco:3:Frango', 'jantar:2:Sopa de carne', 'jantar:3:Sopa de frango',
    ]);
  });

  it('guarda FERIADO e RECESSO como aviso do dia, como vêm da planilha', () => {
    const dados = planilha({
      'SEMANA 1': abaSemana('2026-10-12', DIAS, ['Arroz', 'Arroz', 'Arroz', 'Arroz', 'Arroz']),
      'SEM LACTOSE.': [
        ['CARDÁPIO INFANTIL'],
        ...blocoSemLactose('2026-10-05', DIAS, ['Frango', 'Carne', 'Ovo', 'Peixe', 'Frango']),
        ...blocoSemLactose(
          '2026-10-12',
          ['FERIADO', 'TERÇA ', 'QUARTA', 'FERIADO', 'FERIADO'],
          ['FERIADO', 'Carne', 'Frango', 'FERIADO', 'RECESSO'],
        ),
      ],
    });

    expect(avisosDe(dados, '2026-10-12', 'Sem Lactose')).toEqual(['1:FERIADO', '4:FERIADO', '5:RECESSO']);
  });
});

describe('parsearPlanilha — abas SEMANA', () => {
  it('mapeia o dia pela data quando o cabeçalho traz "FERIADO"', () => {
    const dados = planilha({
      'SEMANA 3': abaSemana('2026-10-12', ['FERIADO', 'TERÇA ', 'QUARTA', 'QUINTA', 'SEXTA'], ['Arroz', 'Feijão', 'Carne', 'Ovo', 'Peixe']),
    });

    // A segunda tem refeição apesar do rótulo: antes a coluna inteira era descartada.
    expect(pratosDe(dados, '2026-10-12', 'Infantis')).toContain('almoco:1:Arroz');
    expect(avisosDe(dados, '2026-10-12', 'Infantis')).toEqual([]);
  });

  it('usa o rótulo do cabeçalho como aviso de dia sem nenhuma refeição', () => {
    const dados = planilha({
      'SEMANA 3': abaSemana('2026-10-12', ['FERIADO', 'TERÇA ', 'QUARTA', 'QUINTA', 'SEXTA'], [null as unknown as string, 'Feijão', 'Carne', 'Ovo', 'Peixe']),
    });

    expect(avisosDe(dados, '2026-10-12', 'Infantis')).toEqual(['1:FERIADO']);
  });
});
