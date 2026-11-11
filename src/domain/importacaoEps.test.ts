import { describe, expect, it } from 'vitest';
import {
  criancaDaLinha,
  grupoDaTurmaEps,
  lerAlunosEps,
  lerData,
  planejarImportacao,
  sexoPeloNome,
} from './importacaoEps';
import type { Crianca } from './types';

describe('leitura da API do GerenciaEPS', () => {
  it('aceita os formatos de campo usados pela API', () => {
    const alunos = lerAlunosEps([
      { id: 10, nome: 'Ana Clara', data_nascimento: '2023-03-15', turmas: { nome: 'Infantil III' }, ativo: true },
      { nome: 'Bruno', nascimento: '10/05/2023', turma: 'Infantil 3', sexo: 'Masculino' },
      { nome: 'Caio', data_nascimento: '2024-01-02T00:00:00Z', turma_nome: 'Berçário II', ativo: false },
      { nome: '', turma: 'x' },
      null,
    ]);
    expect(alunos).toHaveLength(3);
    expect(alunos[0]).toMatchObject({ idExterno: '10', dataNascimento: '2023-03-15', turmaEps: 'Infantil III', ativo: true });
    expect(alunos[0].sexo).toBeUndefined();
    expect(alunos[1]).toMatchObject({ dataNascimento: '2023-05-10', sexo: 'M', turmaEps: 'Infantil 3' });
    expect(alunos[2]).toMatchObject({ dataNascimento: '2024-01-02', ativo: false });
    expect(lerData('2023-3-5')).toBe('');
  });

  it('converte a turma da escola para Berçário / Infantil 1 a 5', () => {
    expect(grupoDaTurmaEps('Berçário II')).toBe('Berçário');
    expect(grupoDaTurmaEps('BERCARIO')).toBe('Berçário');
    expect(grupoDaTurmaEps('Infantil III - Manhã')).toBe('Infantil 3');
    expect(grupoDaTurmaEps('Infantil 5')).toBe('Infantil 5');
    expect(grupoDaTurmaEps('infantil-IV')).toBe('Infantil 4');
    expect(grupoDaTurmaEps('Infantil 8')).toBeUndefined();
    expect(grupoDaTurmaEps('1º ano')).toBeUndefined();
    expect(grupoDaTurmaEps('')).toBeUndefined();
  });

  it('palpite de sexo pelo primeiro nome', () => {
    expect(sexoPeloNome('Ana Clara Souza')).toBe('F');
    expect(sexoPeloNome('Alice')).toBe('F');
    expect(sexoPeloNome('Davi Lucca')).toBe('M');
    expect(sexoPeloNome('Luca Rossi')).toBe('M');
  });
});

describe('plano de importação', () => {
  const existente: Crianca = {
    id: 'x1',
    clienteId: 'c1',
    nome: 'Ana Clara',
    dataNascimento: '2023-03-15',
    sexo: 'F',
    grupo: 'Infantil 2',
    ativo: true,
    criadoEm: '2026-01-01',
  };
  const igual: Crianca = { ...existente, id: 'x2', nome: 'Bruno Lima', dataNascimento: '2023-05-10', sexo: 'M', grupo: 'Infantil 3' };
  const alunos = lerAlunosEps([
    { nome: 'ANA CLARA', data_nascimento: '2023-03-15', turma: 'Infantil III' },
    { nome: 'Bruno Lima', data_nascimento: '2023-05-10', turma: 'Infantil III' },
    { nome: 'Carla Dias', data_nascimento: '2023-01-20', turma: 'Infantil III' },
    { nome: 'Carla Dias', data_nascimento: '2023-01-20', turma: 'Infantil III' },
    { nome: 'Davi', turma: 'Infantil IV' },
    { nome: 'Eva', data_nascimento: '2025-01-01', turma: 'Berçário', ativo: false },
  ]);
  const plano = planejarImportacao(alunos, [existente, igual]);

  it('separa novas, troca de turma, já cadastradas e sem nascimento', () => {
    const por = Object.fromEntries(plano.linhas.map((l) => [l.aluno.nome, l]));
    expect(plano.linhas.map((l) => l.situacao)).toEqual(['nova', 'mudou-turma', 'sem-nascimento', 'ja-cadastrada']);
    expect(por['Carla Dias']).toMatchObject({ grupo: 'Infantil 3', sexo: 'F', sexoPalpite: true });
    expect(por['ANA CLARA']).toMatchObject({ grupo: 'Infantil 3', existente: { id: 'x1' }, sexoPalpite: false });
    expect(plano.inativos).toBe(1);
    expect(plano.porTurmaEps).toEqual([
      { turma: 'Infantil III', grupo: 'Infantil 3', n: 4 },
      { turma: 'Infantil IV', grupo: 'Infantil 4', n: 1 },
    ]);
  });

  it('gera a criança nova e a troca de turma; ignora as demais', () => {
    const [nova, troca, semNasc, ja] = plano.linhas;
    expect(criancaDaLinha(nova, 'c1', 'agora', () => 'novo')).toMatchObject({
      id: 'novo',
      clienteId: 'c1',
      nome: 'Carla Dias',
      grupo: 'Infantil 3',
      sexo: 'F',
    });
    expect(criancaDaLinha(troca, 'c1', 'agora', () => 'novo')).toMatchObject({ id: 'x1', grupo: 'Infantil 3' });
    expect(criancaDaLinha(semNasc, 'c1', 'agora', () => 'novo')).toBeNull();
    expect(criancaDaLinha(ja, 'c1', 'agora', () => 'novo')).toBeNull();
  });
});
