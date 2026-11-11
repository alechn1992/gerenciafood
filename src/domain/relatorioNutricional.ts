// Regras da avaliação nutricional que não dependem da tela: as turmas reais das
// crianças, a periodicidade das reavaliações e os relatórios (turma e
// individual) com filtros de período, turma, sexo e classificação.

import {
  avaliarMedida,
  classificarEstatura,
  classificarImc,
  classificarPeso,
  idadeEmMeses,
  type Classificacao,
  type Resultado,
  type Situacao,
  type TabelasOms,
} from './antropometria';
import type { Crianca, MedidaAntropometrica } from './types';

/** Turmas reais da escola (diferentes das turmas de montagem do cardápio). */
export const GRUPOS_CRIANCA = ['Berçário', 'Infantil 1', 'Infantil 2', 'Infantil 3', 'Infantil 4', 'Infantil 5'] as const;

/** Valor do filtro para crianças sem turma. */
export const SEM_GRUPO = '__sem';

/** Turma sugerida pela idade: Berçário até 1 ano, Infantil 1 com 1 ano ... Infantil 5 com 5. */
export function sugerirGrupo(nascimento: string, data: string): string | undefined {
  if (!nascimento) return undefined;
  const meses = idadeEmMeses(nascimento, data);
  if (meses < 0) return undefined;
  const anos = Math.floor(meses / 12);
  return GRUPOS_CRIANCA[anos];
}

/** Ordena pela ordem das turmas (Berçário, Infantil 1...), sem turma no fim. */
export function ordemGrupo(grupo?: string): number {
  const i = GRUPOS_CRIANCA.indexOf((grupo ?? '') as (typeof GRUPOS_CRIANCA)[number]);
  return i < 0 ? GRUPOS_CRIANCA.length : i;
}

// ---------------------------------------------------------------- datas

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (s: string) => new Date(`${s}T00:00:00Z`);

/** Soma meses a uma data yyyy-mm-dd (31/01 + 1 mês = 28 ou 29/02). */
export function somarMeses(data: string, meses: number): string {
  const d = utc(data);
  const dia = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + meses);
  const ultimoDia = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimoDia));
  return iso(d);
}

export const diasEntre = (de: string, ate: string) => Math.round((utc(ate).getTime() - utc(de).getTime()) / 86_400_000);

// ---------------------------------------------------------------- periodicidade

export const PERIODICIDADES = [
  { meses: 1, nome: 'Mensal' },
  { meses: 2, nome: 'Bimestral' },
  { meses: 3, nome: 'Trimestral' },
  { meses: 6, nome: 'Semestral' },
  { meses: 12, nome: 'Anual' },
] as const;

export type SituacaoAgenda = 'nunca' | 'em-dia' | 'vence' | 'atrasada';

export interface Agenda {
  situacao: SituacaoAgenda;
  /** yyyy-mm-dd da próxima avaliação (sem aferição: hoje). */
  proxima: string;
  rotulo: string;
}

/** Quando a criança deve ser reavaliada, pela periodicidade escolhida. */
export function agendaDaCrianca(ultimaData: string | undefined, periodicidadeMeses: number, hoje: string): Agenda {
  if (!ultimaData) return { situacao: 'nunca', proxima: hoje, rotulo: 'Sem avaliação' };
  const proxima = somarMeses(ultimaData, periodicidadeMeses);
  const faltam = diasEntre(hoje, proxima);
  if (faltam < 0) return { situacao: 'atrasada', proxima, rotulo: `Atrasada ${-faltam} dia(s)` };
  if (faltam <= 15) return { situacao: 'vence', proxima, rotulo: faltam === 0 ? 'Vence hoje' : `Vence em ${faltam} dia(s)` };
  return { situacao: 'em-dia', proxima, rotulo: 'Em dia' };
}

// ---------------------------------------------------------------- períodos

export type PresetPeriodo = 'mes' | 'trimestre' | 'semestre' | 'ano' | 'tudo' | 'personalizado';

export const PRESETS_PERIODO: { valor: PresetPeriodo; nome: string }[] = [
  { valor: 'mes', nome: 'Mês atual' },
  { valor: 'trimestre', nome: 'Últimos 3 meses' },
  { valor: 'semestre', nome: 'Últimos 6 meses' },
  { valor: 'ano', nome: 'Ano atual' },
  { valor: 'tudo', nome: 'Todo o histórico' },
  { valor: 'personalizado', nome: 'Personalizado' },
];

/** Datas (de, até) de um período pronto, a partir de hoje. */
export function periodoDoPreset(p: PresetPeriodo, hoje: string): { de: string; ate: string } {
  const [a, m] = hoje.split('-');
  switch (p) {
    case 'mes':
      return { de: `${a}-${m}-01`, ate: hoje };
    case 'trimestre':
      return { de: somarMeses(hoje, -3), ate: hoje };
    case 'semestre':
      return { de: somarMeses(hoje, -6), ate: hoje };
    case 'ano':
      return { de: `${a}-01-01`, ate: hoje };
    default:
      return { de: '1900-01-01', ate: hoje };
  }
}

// ---------------------------------------------------------------- relatórios

export interface Avaliada {
  medida: MedidaAntropometrica;
  r: Resultado;
}

/** As medidas de cada criança avaliadas pelas curvas, em ordem de data. */
export function avaliarTodas(t: TabelasOms, criancas: Crianca[], medidas: MedidaAntropometrica[]): Map<string, Avaliada[]> {
  const porCrianca = new Map<string, MedidaAntropometrica[]>();
  for (const m of medidas) {
    const l = porCrianca.get(m.criancaId);
    if (l) l.push(m);
    else porCrianca.set(m.criancaId, [m]);
  }
  const mapa = new Map<string, Avaliada[]>();
  for (const c of criancas) {
    const lista = (porCrianca.get(c.id) ?? []).slice().sort((a, b) => a.data.localeCompare(b.data) || a.criadoEm.localeCompare(b.criadoEm));
    mapa.set(
      c.id,
      lista.map((m) => ({ medida: m, r: avaliarMedida(t, c.sexo, c.dataNascimento, m) })),
    );
  }
  return mapa;
}

/** Filtro por classificação do IMC-para-idade (e baixa estatura). */
export type FiltroSituacao = '' | 'alterados' | 'magreza' | 'excesso' | 'baixa-estatura';

export const FILTROS_SITUACAO: { valor: FiltroSituacao; nome: string }[] = [
  { valor: '', nome: 'Todas as classificações' },
  { valor: 'alterados', nome: 'Só com alteração (fora da eutrofia ou baixa estatura)' },
  { valor: 'magreza', nome: 'Magreza (IMC abaixo do esperado)' },
  { valor: 'excesso', nome: 'Excesso de peso (risco, sobrepeso, obesidade)' },
  { valor: 'baixa-estatura', nome: 'Baixa estatura' },
];

export interface FiltrosRelatorio {
  /** '' = todas; SEM_GRUPO = sem turma. */
  grupo: string;
  de: string;
  ate: string;
  sexo: '' | 'M' | 'F';
  situacao: FiltroSituacao;
}

export interface LinhaRelatorio {
  crianca: Crianca;
  /** Última aferição dentro do período. */
  atual: Avaliada;
  /** Aferição anterior a ela (de qualquer data), para a evolução. */
  anterior?: Avaliada;
  /** Quantas aferições a criança tem no período. */
  noPeriodo: number;
  imc?: Classificacao;
  estatura?: Classificacao;
  peso?: Classificacao;
  /** Variação do escore-z do IMC desde a aferição anterior. */
  variacaoZImc?: number;
}

export interface Contagem {
  rotulo: string;
  situacao: Situacao;
  n: number;
  pct: number;
}

export interface RelatorioTurma {
  linhas: LinhaRelatorio[];
  /** Crianças do filtro (turma, sexo) sem aferição no período. */
  naoAvaliadas: Crianca[];
  /** Distribuição do IMC-para-idade (só as avaliadas que passaram no filtro). */
  imc: Contagem[];
  estatura: Contagem[];
  /** Total de crianças da turma/sexo escolhidos (avaliadas ou não). */
  totalCriancas: number;
  /** Evolução desde a aferição anterior: melhorou, piorou ou estável. */
  evolucao: { melhorou: number; piorou: number; estavel: number; semAnterior: number };
}

const ORDEM_IMC = ['Magreza acentuada', 'Magreza', 'Eutrofia', 'Risco de sobrepeso', 'Sobrepeso', 'Obesidade', 'Obesidade grave'];
const ORDEM_ESTATURA = ['Muito baixa estatura para a idade', 'Baixa estatura para a idade', 'Estatura adequada para a idade'];

function contar(classes: (Classificacao | undefined)[], ordem: string[]): Contagem[] {
  const validas = classes.filter((c): c is Classificacao => !!c);
  const mapa = new Map<string, Contagem>();
  for (const c of validas) {
    const atual = mapa.get(c.rotulo);
    if (atual) atual.n++;
    else mapa.set(c.rotulo, { rotulo: c.rotulo, situacao: c.situacao, n: 1, pct: 0 });
  }
  const pos = (r: string) => (ordem.indexOf(r) < 0 ? ordem.length : ordem.indexOf(r));
  return [...mapa.values()]
    .map((c) => ({ ...c, pct: validas.length ? (c.n / validas.length) * 100 : 0 }))
    .sort((a, b) => pos(a.rotulo) - pos(b.rotulo));
}

function passaSituacao(l: LinhaRelatorio, f: FiltroSituacao): boolean {
  if (!f) return true;
  const sImc = l.imc?.situacao;
  const baixa = l.estatura ? l.estatura.situacao !== 'adequado' : false;
  if (f === 'baixa-estatura') return baixa;
  if (f === 'magreza') return sImc === 'grave' ? (l.atual.r.zImc ?? 0) < 0 : sImc === 'alerta';
  if (f === 'excesso') return sImc === 'risco' || sImc === 'excesso' || (sImc === 'grave' && (l.atual.r.zImc ?? 0) > 0);
  return (sImc !== undefined && sImc !== 'adequado') || baixa;
}

/** Mudança mínima no escore-z para contar como melhora ou piora (abaixo disso: estável). */
const LIMIAR_EVOLUCAO = 0.1;

/**
 * Melhorou quando o escore-z do IMC se aproximou da faixa adequada (−2 a +1),
 * piorou quando se afastou. Dentro da faixa e sem sair dela, é estável.
 */
export function evolucaoImc(zAntes: number, zDepois: number): 'melhorou' | 'piorou' | 'estavel' {
  const distancia = (z: number) => (z < -2 ? -2 - z : z > 1 ? z - 1 : 0);
  const d = distancia(zDepois) - distancia(zAntes);
  if (d <= -LIMIAR_EVOLUCAO) return 'melhorou';
  if (d >= LIMIAR_EVOLUCAO) return 'piorou';
  return 'estavel';
}

export function montarRelatorioTurma(
  criancas: Crianca[],
  avaliadas: Map<string, Avaliada[]>,
  f: FiltrosRelatorio,
): RelatorioTurma {
  const doFiltro = criancas
    .filter((c) => (f.grupo === '' ? true : f.grupo === SEM_GRUPO ? !c.grupo : c.grupo === f.grupo))
    .filter((c) => !f.sexo || c.sexo === f.sexo)
    .sort((a, b) => ordemGrupo(a.grupo) - ordemGrupo(b.grupo) || a.nome.localeCompare(b.nome, 'pt-BR'));

  const todas: LinhaRelatorio[] = [];
  const naoAvaliadas: Crianca[] = [];
  for (const c of doFiltro) {
    const lista = avaliadas.get(c.id) ?? [];
    const noPeriodo = lista.filter((a) => a.medida.data >= f.de && a.medida.data <= f.ate);
    const atual = noPeriodo[noPeriodo.length - 1];
    if (!atual) {
      naoAvaliadas.push(c);
      continue;
    }
    const anterior = lista[lista.indexOf(atual) - 1];
    const { r } = atual;
    todas.push({
      crianca: c,
      atual,
      anterior,
      noPeriodo: noPeriodo.length,
      imc: r.zImc !== undefined ? classificarImc(r.zImc, r.meses) : undefined,
      estatura: r.zEstatura !== undefined ? classificarEstatura(r.zEstatura) : undefined,
      peso: r.zPeso !== undefined ? classificarPeso(r.zPeso) : undefined,
      variacaoZImc:
        r.zImc !== undefined && anterior?.r.zImc !== undefined ? Math.round((r.zImc - anterior.r.zImc) * 100) / 100 : undefined,
    });
  }
  const linhas = todas.filter((l) => passaSituacao(l, f.situacao));

  const evolucao = { melhorou: 0, piorou: 0, estavel: 0, semAnterior: 0 };
  for (const l of linhas) {
    const antes = l.anterior?.r.zImc;
    const depois = l.atual.r.zImc;
    if (antes === undefined || depois === undefined) evolucao.semAnterior++;
    else evolucao[evolucaoImc(antes, depois)]++;
  }

  return {
    linhas,
    naoAvaliadas: f.situacao ? [] : naoAvaliadas,
    imc: contar(
      linhas.map((l) => l.imc),
      ORDEM_IMC,
    ),
    estatura: contar(
      linhas.map((l) => l.estatura),
      ORDEM_ESTATURA,
    ),
    totalCriancas: doFiltro.length,
    evolucao,
  };
}

/** Medidas de uma criança dentro do período (para o relatório individual). */
export function noPeriodo(lista: Avaliada[], de: string, ate: string): Avaliada[] {
  return lista.filter((a) => a.medida.data >= de && a.medida.data <= ate);
}
