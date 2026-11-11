import { describe, expect, it } from 'vitest';
import ate5 from '../data/oms/oms-0a5anos.json';
import de5a19 from '../data/oms/oms-5a19anos.json';
import type { TabelasOms } from './antropometria';
import {
  agendaDaCrianca,
  avaliarTodas,
  evolucaoImc,
  montarRelatorioTurma,
  periodoDoPreset,
  SEM_GRUPO,
  somarMeses,
  sugerirGrupo,
} from './relatorioNutricional';
import type { Crianca, MedidaAntropometrica } from './types';

const t = { ate5, de5a19 } as unknown as TabelasOms;

const crianca = (id: string, nome: string, nascimento: string, grupo?: string, sexo: 'M' | 'F' = 'F'): Crianca => ({
  id,
  clienteId: 'c1',
  nome,
  dataNascimento: nascimento,
  sexo,
  grupo,
  ativo: true,
  criadoEm: '2026-01-01T00:00:00Z',
});
const medida = (criancaId: string, data: string, pesoKg: number, alturaCm: number): MedidaAntropometrica => ({
  id: `${criancaId}-${data}`,
  criancaId,
  data,
  pesoKg,
  alturaCm,
  forma: 'em_pe',
  criadoEm: `${data}T10:00:00Z`,
});

describe('datas e periodicidade', () => {
  it('soma meses respeitando o fim do mês', () => {
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(somarMeses('2026-11-11', 3)).toBe('2027-02-11');
    expect(somarMeses('2026-05-15', -6)).toBe('2025-11-15');
  });

  it('agenda: em dia, vencendo, atrasada e sem avaliação', () => {
    expect(agendaDaCrianca(undefined, 3, '2026-11-11').situacao).toBe('nunca');
    expect(agendaDaCrianca('2026-10-01', 3, '2026-11-11')).toMatchObject({ situacao: 'em-dia', proxima: '2027-01-01' });
    expect(agendaDaCrianca('2026-08-20', 3, '2026-11-11')).toMatchObject({ situacao: 'vence', rotulo: 'Vence em 9 dia(s)' });
    expect(agendaDaCrianca('2026-05-01', 3, '2026-11-11')).toMatchObject({ situacao: 'atrasada', proxima: '2026-08-01' });
    expect(agendaDaCrianca('2026-10-01', 1, '2026-11-11').situacao).toBe('atrasada');
  });

  it('períodos prontos', () => {
    expect(periodoDoPreset('mes', '2026-11-11')).toEqual({ de: '2026-11-01', ate: '2026-11-11' });
    expect(periodoDoPreset('trimestre', '2026-11-11')).toEqual({ de: '2026-08-11', ate: '2026-11-11' });
    expect(periodoDoPreset('ano', '2026-11-11')).toEqual({ de: '2026-01-01', ate: '2026-11-11' });
  });
});

describe('turma sugerida pela idade', () => {
  it('Berçário até 1 ano e Infantil 1 a 5 depois', () => {
    expect(sugerirGrupo('2026-03-01', '2026-11-11')).toBe('Berçário');
    expect(sugerirGrupo('2025-06-01', '2026-11-11')).toBe('Infantil 1');
    expect(sugerirGrupo('2023-03-15', '2026-11-11')).toBe('Infantil 3');
    expect(sugerirGrupo('2021-01-01', '2026-11-11')).toBe('Infantil 5');
    expect(sugerirGrupo('2018-01-01', '2026-11-11')).toBeUndefined();
    expect(sugerirGrupo('', '2026-11-11')).toBeUndefined();
  });
});

describe('evolução do IMC', () => {
  it('dentro da eutrofia é estável; aproximar da faixa é melhora', () => {
    expect(evolucaoImc(-0.5, 0.3)).toBe('estavel');
    expect(evolucaoImc(2.4, 1.6)).toBe('melhorou');
    expect(evolucaoImc(0.8, 1.7)).toBe('piorou');
    expect(evolucaoImc(-2.6, -2.1)).toBe('melhorou');
    expect(evolucaoImc(-1.8, -2.4)).toBe('piorou');
    expect(evolucaoImc(2.5, 2.55)).toBe('estavel');
  });
});

describe('relatório da turma', () => {
  const criancas = [
    crianca('a', 'Ana', '2023-03-15', 'Infantil 3'),
    crianca('b', 'Bruno', '2023-05-10', 'Infantil 3', 'M'),
    crianca('c', 'Carla', '2023-01-20', 'Infantil 3'),
    crianca('d', 'Davi', '2024-04-02', 'Infantil 2', 'M'),
    crianca('e', 'Eva', '2023-07-07'),
  ];
  const medidas = [
    medida('a', '2026-05-10', 13.4, 94),
    medida('a', '2026-10-10', 13.2, 98.5), // eutrofia
    medida('b', '2026-10-15', 19.5, 97), // IMC alto
    medida('c', '2026-03-01', 13, 92), // fora do período
    medida('d', '2026-10-20', 12, 88),
  ];
  const avaliadas = avaliarTodas(t, criancas, medidas);
  const base = { grupo: 'Infantil 3', de: '2026-08-11', ate: '2026-11-11', sexo: '' as const, situacao: '' as const };

  it('usa a última avaliação no período e lista quem ficou sem', () => {
    const rel = montarRelatorioTurma(criancas, avaliadas, base);
    expect(rel.totalCriancas).toBe(3);
    expect(rel.linhas.map((l) => l.crianca.nome)).toEqual(['Ana', 'Bruno']);
    expect(rel.linhas[0].atual.medida.data).toBe('2026-10-10');
    expect(rel.linhas[0].anterior?.medida.data).toBe('2026-05-10');
    expect(rel.naoAvaliadas.map((c) => c.nome)).toEqual(['Carla']);
    expect(rel.imc.reduce((s, c) => s + c.n, 0)).toBe(2);
    expect(rel.imc.reduce((s, c) => s + c.pct, 0)).toBeCloseTo(100);
    expect(rel.evolucao.semAnterior).toBe(1);
  });

  it('filtra por classificação e por sexo', () => {
    const alterados = montarRelatorioTurma(criancas, avaliadas, { ...base, situacao: 'excesso' });
    expect(alterados.linhas.map((l) => l.crianca.nome)).toEqual(['Bruno']);
    expect(alterados.naoAvaliadas).toEqual([]);
    const meninas = montarRelatorioTurma(criancas, avaliadas, { ...base, sexo: 'F' });
    expect(meninas.linhas.map((l) => l.crianca.nome)).toEqual(['Ana']);
    expect(meninas.totalCriancas).toBe(2);
  });

  it('todas as turmas em ordem (Berçário... Infantil 5, sem turma no fim) e só sem turma', () => {
    const todas = montarRelatorioTurma(criancas, avaliadas, { ...base, grupo: '' });
    expect(todas.linhas.map((l) => l.crianca.nome)).toEqual(['Davi', 'Ana', 'Bruno']);
    expect(todas.naoAvaliadas.map((c) => c.nome)).toEqual(['Carla', 'Eva']);
    const sem = montarRelatorioTurma(criancas, avaliadas, { ...base, grupo: SEM_GRUPO });
    expect(sem.totalCriancas).toBe(1);
  });
});
