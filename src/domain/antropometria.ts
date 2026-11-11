// Avaliação antropométrica de crianças e adolescentes pelas curvas da OMS,
// as mesmas adotadas pelo Ministério da Saúde (Caderneta da Criança / SISVAN):
//   • 0 a 5 anos: Padrões de Crescimento Infantil da OMS (2006), tabelas por dia;
//   • 5 a 19 anos: Referência de Crescimento da OMS (2007), tabelas por mês.
// O escore-z segue o método LMS publicado pela OMS, com o ajuste acima de +3 e
// abaixo de −3 para peso e IMC. Nada aqui depende da tela: é testado à parte.

export type Sexo = 'M' | 'F';
export type Indicador = 'imc' | 'estatura' | 'peso';
/** Como a altura foi medida: deitada (comprimento, até 2 anos) ou em pé. */
export type FormaMedida = 'deitado' | 'em_pe';

type Lms = [number, number, number];
interface TabelaOms {
  idadeInicial: number;
  imc: Record<Sexo, Lms[]>;
  estatura: Record<Sexo, Lms[]>;
  peso: Record<Sexo, Lms[]>;
}
export interface TabelasOms {
  /** 0 a 5 anos, uma linha por dia de idade. */
  ate5: TabelaOms;
  /** 5 a 19 anos, uma linha por mês de idade (a partir de 60). */
  de5a19: TabelaOms;
}

/** Carrega as tabelas só quando a avaliação é aberta (são ~70 KB compactados). */
export async function carregarTabelasOms(): Promise<TabelasOms> {
  const [a, b] = await Promise.all([import('../data/oms/oms-0a5anos.json'), import('../data/oms/oms-5a19anos.json')]);
  return { ate5: a.default as unknown as TabelaOms, de5a19: b.default as unknown as TabelaOms };
}

const DIAS_POR_MES = 30.4375;

const isoParaData = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(a, m - 1, d);
};

/** Idade em dias inteiros entre o nascimento e a data da medida. */
export function idadeEmDias(nascimento: string, data: string): number {
  return Math.round((isoParaData(data) - isoParaData(nascimento)) / 86_400_000);
}

export function idadeEmMeses(nascimento: string, data: string): number {
  return idadeEmDias(nascimento, data) / DIAS_POR_MES;
}

/** "2 anos e 3 meses", "8 meses", "15 dias". */
export function idadePorExtenso(nascimento: string, data: string): string {
  const dias = idadeEmDias(nascimento, data);
  if (dias < 0) return 'data anterior ao nascimento';
  if (dias < 31) return `${dias} dia${dias === 1 ? '' : 's'}`;
  const mesesTotais = Math.floor(dias / DIAS_POR_MES);
  const anos = Math.floor(mesesTotais / 12);
  const meses = mesesTotais % 12;
  const a = anos > 0 ? `${anos} ano${anos === 1 ? '' : 's'}` : '';
  const m = meses > 0 ? `${meses} ${meses === 1 ? 'mês' : 'meses'}` : '';
  return [a, m].filter(Boolean).join(' e ') || '0 meses';
}

/** Arredonda .5 para cima, como a OMS faz com a idade em dias. */
const arredondar = (x: number) => Math.floor(x + 0.5);

/**
 * Padroniza a altura como a OMS: até 2 anos (731 dias) a referência é o
 * comprimento deitado; depois, a estatura em pé. Medida no outro modo: ±0,7 cm.
 */
export function alturaPadronizada(alturaCm: number, dias: number, forma: FormaMedida): number {
  if (dias < 731 && forma === 'em_pe') return alturaCm + 0.7;
  if (dias >= 731 && forma === 'deitado') return alturaCm - 0.7;
  return alturaCm;
}

export function calcularImc(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100;
  return pesoKg / (m * m);
}

/** Valor da medida num escore-z (para desenhar as curvas). */
export function valorNoEscore([l, m, s]: Lms, z: number): number {
  return l === 0 ? m * Math.exp(s * z) : m * Math.pow(1 + l * s * z, 1 / l);
}

function escoreZ(y: number, [l, m, s]: Lms, ajustado: boolean): number {
  const z = l === 0 ? Math.log(y / m) / s : (Math.pow(y / m, l) - 1) / (s * l);
  if (!ajustado) return z;
  // Ajuste da OMS: fora de ±3, a distância é medida em "unidades" entre ±2 e ±3.
  if (z > 3) {
    const sd3 = valorNoEscore([l, m, s], 3);
    return 3 + (y - sd3) / (sd3 - valorNoEscore([l, m, s], 2));
  }
  if (z < -3) {
    const sd3 = valorNoEscore([l, m, s], -3);
    return -3 + (y - sd3) / (valorNoEscore([l, m, s], -2) - sd3);
  }
  return z;
}

/** Limite superior de idade (em meses, exclusivo) de cada indicador. */
const LIMITE_MESES: Record<Indicador, number> = { imc: 229, estatura: 229, peso: 121 };

/**
 * Parâmetros LMS do indicador numa idade. Abaixo de 60 meses usa a tabela
 * diária; de 60 em diante interpola entre os meses vizinhos (como a OMS).
 * Fora da faixa do indicador, undefined.
 */
export function lmsNaIdade(t: TabelasOms, indicador: Indicador, sexo: Sexo, dias: number): Lms | undefined {
  const meses = dias / DIAS_POR_MES;
  if (dias < 0 || meses >= LIMITE_MESES[indicador]) return undefined;
  if (meses < 60) return t.ate5[indicador][sexo][arredondar(dias)];
  const tabela = t.de5a19[indicador][sexo];
  const base = Math.trunc(meses);
  const frac = meses - base;
  const a = tabela[base - t.de5a19.idadeInicial];
  const b = tabela[base + 1 - t.de5a19.idadeInicial];
  if (!a) return undefined;
  if (!b || frac === 0) return a;
  return [a[0] + frac * (b[0] - a[0]), a[1] + frac * (b[1] - a[1]), a[2] + frac * (b[2] - a[2])];
}

export interface Medida {
  data: string;
  pesoKg: number;
  alturaCm: number;
  forma?: FormaMedida;
}

export interface Resultado {
  dias: number;
  meses: number;
  alturaCm: number;
  imc: number;
  zImc?: number;
  zEstatura?: number;
  zPeso?: number;
}

const arred2 = (x: number | undefined) =>
  x === undefined || !Number.isFinite(x) ? undefined : Math.round(x * 100) / 100 || 0; // sem "−0"

/** Escores-z de uma medida (arredondados a 2 casas, como nos relatórios da OMS). */
export function avaliarMedida(t: TabelasOms, sexo: Sexo, nascimento: string, m: Medida): Resultado {
  const dias = idadeEmDias(nascimento, m.data);
  const forma = m.forma ?? (dias < 731 ? 'deitado' : 'em_pe');
  const alturaCm = alturaPadronizada(m.alturaCm, dias, forma);
  const imc = calcularImc(m.pesoKg, alturaCm);
  return {
    dias,
    meses: dias / DIAS_POR_MES,
    alturaCm,
    imc,
    zImc: escoreNaIdade(t, 'imc', sexo, dias, imc),
    zEstatura: escoreNaIdade(t, 'estatura', sexo, dias, alturaCm),
    zPeso: escoreNaIdade(t, 'peso', sexo, dias, m.pesoKg),
  };
}

/**
 * Escore-z de um valor numa idade (em dias). Estatura usa o escore simples;
 * peso e IMC, o ajustado da OMS. Fora da faixa do indicador: undefined.
 */
export function escoreNaIdade(t: TabelasOms, indicador: Indicador, sexo: Sexo, dias: number, valor: number): number | undefined {
  const lms = lmsNaIdade(t, indicador, sexo, dias);
  return lms && valor > 0 ? arred2(escoreZ(valor, lms, indicador !== 'estatura')) : undefined;
}

// ── Classificação (Ministério da Saúde / SISVAN, a partir das curvas da OMS) ──

export type Situacao = 'grave' | 'alerta' | 'adequado' | 'risco' | 'excesso';

export interface Classificacao {
  rotulo: string;
  situacao: Situacao;
}

/** IMC-para-idade. Os nomes mudam a partir dos 5 anos. */
export function classificarImc(z: number, meses: number): Classificacao {
  const ate5 = meses < 60;
  if (z < -3) return { rotulo: 'Magreza acentuada', situacao: 'grave' };
  if (z < -2) return { rotulo: 'Magreza', situacao: 'alerta' };
  if (z <= 1) return { rotulo: 'Eutrofia', situacao: 'adequado' };
  if (z <= 2) return ate5 ? { rotulo: 'Risco de sobrepeso', situacao: 'risco' } : { rotulo: 'Sobrepeso', situacao: 'risco' };
  if (z <= 3) return ate5 ? { rotulo: 'Sobrepeso', situacao: 'excesso' } : { rotulo: 'Obesidade', situacao: 'excesso' };
  return ate5 ? { rotulo: 'Obesidade', situacao: 'grave' } : { rotulo: 'Obesidade grave', situacao: 'grave' };
}

export function classificarEstatura(z: number): Classificacao {
  if (z < -3) return { rotulo: 'Muito baixa estatura para a idade', situacao: 'grave' };
  if (z < -2) return { rotulo: 'Baixa estatura para a idade', situacao: 'alerta' };
  return { rotulo: 'Estatura adequada para a idade', situacao: 'adequado' };
}

export function classificarPeso(z: number): Classificacao {
  if (z < -3) return { rotulo: 'Muito baixo peso para a idade', situacao: 'grave' };
  if (z < -2) return { rotulo: 'Baixo peso para a idade', situacao: 'alerta' };
  if (z <= 2) return { rotulo: 'Peso adequado para a idade', situacao: 'adequado' };
  return { rotulo: 'Peso elevado para a idade', situacao: 'risco' };
}

// ── Avaliação em texto ─────────────────────────────────────────────────────

const fmt = (n: number, casas = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

/**
 * Pequena avaliação em linguagem simples, para a nutricionista revisar. Usa a
 * medida atual e, se houver, a anterior (tendência do IMC-para-idade).
 */
export function avaliacaoEmTexto(atual: Resultado, anterior?: Resultado): string[] {
  const frases: string[] = [];
  if (atual.zImc !== undefined) {
    const c = classificarImc(atual.zImc, atual.meses);
    const comparacao =
      c.situacao === 'adequado'
        ? 'dentro da faixa esperada para a idade'
        : atual.zImc < -2
          ? 'abaixo da faixa esperada para a idade'
          : 'acima da faixa esperada para a idade';
    frases.push(
      `IMC de ${fmt(atual.imc)} kg/m² (escore-z ${fmt(atual.zImc, 2)}): ${c.rotulo.toLowerCase()}, ${comparacao}.`,
    );
  }
  if (atual.zEstatura !== undefined) {
    const c = classificarEstatura(atual.zEstatura);
    frases.push(`Estatura de ${fmt(atual.alturaCm)} cm (escore-z ${fmt(atual.zEstatura, 2)}): ${c.rotulo.toLowerCase()}.`);
  }
  if (atual.zPeso !== undefined) {
    const c = classificarPeso(atual.zPeso);
    frases.push(`Peso: ${c.rotulo.toLowerCase()} (escore-z ${fmt(atual.zPeso, 2)}).`);
  }
  if (anterior?.zImc !== undefined && atual.zImc !== undefined) {
    const delta = atual.zImc - anterior.zImc;
    const intervalo = Math.max(1, Math.round(atual.meses - anterior.meses));
    if (Math.abs(delta) < 0.3) frases.push(`Em relação à medida anterior (${intervalo} mês(es) antes), o IMC-para-idade se manteve estável.`);
    else
      frases.push(
        `Em relação à medida anterior (${intervalo} mês(es) antes), o IMC-para-idade ${delta > 0 ? 'subiu' : 'caiu'} ${fmt(Math.abs(delta), 2)} escore-z${
          (delta < 0 && atual.zImc < 0) || (delta > 0 && atual.zImc > 1) ? ': vale observar a tendência' : ''
        }.`,
      );
  }
  const situacoes = [
    atual.zImc !== undefined ? classificarImc(atual.zImc, atual.meses).situacao : 'adequado',
    atual.zEstatura !== undefined ? classificarEstatura(atual.zEstatura).situacao : 'adequado',
    atual.zPeso !== undefined ? classificarPeso(atual.zPeso).situacao : 'adequado',
  ];
  if (situacoes.includes('grave'))
    frases.push('Sugestão: avaliação individual com a nutricionista e encaminhamento ao pediatra / unidade de saúde.');
  else if (situacoes.includes('alerta') || situacoes.includes('excesso'))
    frases.push('Sugestão: acompanhar a alimentação na escola, orientar a família e reavaliar em 30 a 60 dias.');
  else if (situacoes.includes('risco')) frases.push('Sugestão: atenção à alimentação e às atividades físicas; reavaliar em 3 meses.');
  else frases.push('Sugestão: manter o acompanhamento de rotina (nova medida em 3 a 6 meses).');
  return frases;
}

/** Faixa de idade (meses) do gráfico que contém a idade, como na Caderneta da Criança. */
export function faixaDoGrafico(meses: number): [number, number] {
  if (meses < 24) return [0, 24];
  if (meses < 60) return [24, 60];
  if (meses < 120) return [60, 120];
  return [120, 228];
}

/** Pontos das curvas (−3, −2, −1, 0, +1, +2, +3) do indicador na faixa de idade. */
export function curvas(
  t: TabelasOms,
  indicador: Indicador,
  sexo: Sexo,
  [ini, fim]: [number, number],
  escores = [-3, -2, -1, 0, 1, 2, 3],
): { z: number; pontos: { meses: number; valor: number }[] }[] {
  const passo = fim - ini <= 36 ? 0.5 : 1;
  const idades: number[] = [];
  for (let m = ini; m <= fim + 1e-9; m += passo) idades.push(Math.min(m, fim - 1e-6));
  return escores.map((z) => ({
    z,
    pontos: idades.flatMap((meses) => {
      const lms = lmsNaIdade(t, indicador, sexo, meses * DIAS_POR_MES);
      return lms ? [{ meses, valor: valorNoEscore(lms, z) }] : [];
    }),
  }));
}
