// Importação das crianças do GerenciaEPS (FinanceDesk): lê a resposta da API,
// converte a turma da escola para as turmas da avaliação (Berçário a
// Infantil 5) e compara com quem já está cadastrado, para a nutricionista
// conferir antes de importar.

import { GRUPOS_CRIANCA } from './relatorioNutricional';
import type { Crianca } from './types';

export interface AlunoEps {
  idExterno?: string;
  nome: string;
  /** yyyy-mm-dd (vazio quando o EPS não tem). */
  dataNascimento: string;
  /** Só quando o EPS informa. */
  sexo?: 'M' | 'F';
  turmaEps: string;
  ativo: boolean;
}

export const normalizar = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** "2023-03-15", "2023-03-15T00:00:00Z" ou "15/03/2023" → "2023-03-15". */
export function lerData(v: unknown): string {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return '';
}

export function lerSexo(v: unknown): 'M' | 'F' | undefined {
  if (typeof v !== 'string') return undefined;
  const s = normalizar(v);
  if (['m', 'masc', 'masculino', 'menino', 'male'].includes(s)) return 'M';
  if (['f', 'fem', 'feminino', 'menina', 'female'].includes(s)) return 'F';
  return undefined;
}

const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');

/** Converte a lista crua da API (os nomes dos campos variam um pouco). */
export function lerAlunosEps(lista: unknown[]): AlunoEps[] {
  const out: AlunoEps[] = [];
  for (const bruto of lista) {
    if (!bruto || typeof bruto !== 'object') continue;
    const a = bruto as Record<string, unknown>;
    const nome = texto(a.nome) || texto(a.nome_completo) || texto(a.name);
    if (!nome) continue;
    const turmaObj = (a.turmas ?? a.turma) as unknown;
    const turmaEps =
      (turmaObj && typeof turmaObj === 'object' ? texto((turmaObj as Record<string, unknown>).nome) : texto(turmaObj)) ||
      texto(a.turma_nome) ||
      texto(a.classe);
    out.push({
      idExterno: texto(a.id) || undefined,
      nome,
      dataNascimento: lerData(a.data_nascimento ?? a.dataNascimento ?? a.nascimento ?? a.nasc),
      sexo: lerSexo(a.sexo ?? a.genero ?? a.sex),
      turmaEps,
      ativo: a.ativo !== false && a.status !== 'inativo',
    });
  }
  return out;
}

const ROMANOS: [RegExp, string][] = [
  [/\bv\b/g, '5'],
  [/\biv\b/g, '4'],
  [/\biii\b/g, '3'],
  [/\bii\b/g, '2'],
  [/\bi\b/g, '1'],
];

/** "Berçário II" → Berçário; "Infantil III - Manhã" → Infantil 3; outros nomes → sem turma. */
export function grupoDaTurmaEps(nome: string): string | undefined {
  let s = normalizar(nome);
  if (!s) return undefined;
  if (s.includes('bercario')) return 'Berçário';
  for (const [re, n] of ROMANOS) s = s.replace(re, n);
  const m = s.match(/infantil\s*-?\s*(\d)/);
  if (m) {
    const g = `Infantil ${m[1]}`;
    return (GRUPOS_CRIANCA as readonly string[]).includes(g) ? g : undefined;
  }
  return undefined;
}

/** Palpite pelo primeiro nome, quando o EPS não informa o sexo (a nutricionista confere). */
export function sexoPeloNome(nome: string): 'M' | 'F' {
  const primeiro = normalizar(nome).split(' ')[0] ?? '';
  const masculinosEmA = ['luca', 'joshua', 'nicola', 'elias', 'josua', 'jonas', 'mattia'];
  if (masculinosEmA.includes(primeiro)) return 'M';
  return /a$/.test(primeiro) || /(ely|elly|ane|ine|ice|ise|riz|beth|ah)$/.test(primeiro) ? 'F' : 'M';
}

export type SituacaoImportacao = 'nova' | 'mudou-turma' | 'ja-cadastrada' | 'sem-nascimento';

export interface LinhaImportacao {
  aluno: AlunoEps;
  /** Turma da avaliação para a qual vai (pode ser trocada na tela). */
  grupo?: string;
  sexo: 'M' | 'F';
  /** O sexo veio do palpite pelo nome (conferir). */
  sexoPalpite: boolean;
  existente?: Crianca;
  situacao: SituacaoImportacao;
}

export interface PlanoImportacao {
  linhas: LinhaImportacao[];
  inativos: number;
  /** Alunos ativos por turma do EPS (para a quantidade de alunos). */
  porTurmaEps: { turma: string; grupo?: string; n: number }[];
}

export function planejarImportacao(alunos: AlunoEps[], criancas: Crianca[]): PlanoImportacao {
  const porNome = new Map<string, Crianca[]>();
  for (const c of criancas) {
    const k = normalizar(c.nome);
    porNome.set(k, [...(porNome.get(k) ?? []), c]);
  }
  const ativos = alunos.filter((a) => a.ativo);
  const vistos = new Set<string>();
  const linhas: LinhaImportacao[] = [];
  for (const aluno of ativos) {
    const chave = `${normalizar(aluno.nome)}|${aluno.dataNascimento}`;
    if (vistos.has(chave)) continue; // aluno repetido na resposta
    vistos.add(chave);
    const mesmos = porNome.get(normalizar(aluno.nome)) ?? [];
    const existente = mesmos.find((c) => c.dataNascimento === aluno.dataNascimento) ?? (mesmos.length === 1 ? mesmos[0] : undefined);
    const grupo = grupoDaTurmaEps(aluno.turmaEps);
    const situacao: SituacaoImportacao = existente
      ? grupo && grupo !== existente.grupo
        ? 'mudou-turma'
        : 'ja-cadastrada'
      : aluno.dataNascimento
        ? 'nova'
        : 'sem-nascimento';
    linhas.push({
      aluno,
      grupo: existente && situacao === 'ja-cadastrada' ? existente.grupo : grupo,
      sexo: existente?.sexo ?? aluno.sexo ?? sexoPeloNome(aluno.nome),
      sexoPalpite: !existente && !aluno.sexo,
      existente,
      situacao,
    });
  }
  const ordem: Record<SituacaoImportacao, number> = { nova: 0, 'mudou-turma': 1, 'sem-nascimento': 2, 'ja-cadastrada': 3 };
  linhas.sort((a, b) => ordem[a.situacao] - ordem[b.situacao] || a.aluno.nome.localeCompare(b.aluno.nome, 'pt-BR'));

  const contagem = new Map<string, number>();
  for (const a of ativos) contagem.set(a.turmaEps || '(sem turma)', (contagem.get(a.turmaEps || '(sem turma)') ?? 0) + 1);
  const porTurmaEps = [...contagem.entries()]
    .map(([turma, n]) => ({ turma, grupo: grupoDaTurmaEps(turma), n }))
    .sort((a, b) => a.turma.localeCompare(b.turma, 'pt-BR', { numeric: true }));

  return { linhas, inativos: alunos.length - ativos.length, porTurmaEps };
}

/** A criança a gravar para uma linha marcada para importar (nova ou troca de turma). */
export function criancaDaLinha(l: LinhaImportacao, clienteId: string, agora: string, novoId: () => string): Crianca | null {
  if (l.situacao === 'mudou-turma' && l.existente) return { ...l.existente, grupo: l.grupo };
  if (l.situacao !== 'nova') return null;
  return {
    id: novoId(),
    clienteId,
    grupo: l.grupo,
    nome: l.aluno.nome.trim(),
    dataNascimento: l.aluno.dataNascimento,
    sexo: l.sexo,
    ativo: true,
    criadoEm: agora,
  };
}
