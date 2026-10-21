// Calendário de funcionamento do cliente: dias sem atendimento (feriados,
// recessos, férias) bloqueiam a geração do cardápio e aparecem na folha das
// famílias no lugar das refeições.

import type { AvisoDia, Cardapio, DiaSemana, PeriodoSemFuncionamento } from './types';

/** Data ISO do dia da semana, a partir da segunda-feira de referência. */
export function dataDoDia(semanaInicio: string, dia: DiaSemana): string {
  const d = new Date(`${semanaInicio}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + (dia === 0 ? 6 : dia - 1));
  return d.toISOString().slice(0, 10);
}

/** Período que cobre a data, se houver (o mais recente cadastrado vence). */
export function periodoDaData(
  periodos: PeriodoSemFuncionamento[],
  data: string,
): PeriodoSemFuncionamento | undefined {
  return periodos.find((p) => p.inicio <= data && data <= p.fim);
}

/** Avisos dos dias sem funcionamento da semana, um por dia. */
export function avisosDaSemana(periodos: PeriodoSemFuncionamento[], semanaInicio: string): AvisoDia[] {
  const avisos: AvisoDia[] = [];
  for (const dia of [1, 2, 3, 4, 5, 6, 0] as DiaSemana[]) {
    const p = periodoDaData(periodos, dataDoDia(semanaInicio, dia));
    if (p) avisos.push({ dia, texto: p.motivo });
  }
  return avisos;
}

/**
 * Aplica o calendário ao cardápio: tira os pratos dos dias sem funcionamento
 * e põe o motivo como aviso do dia. Os avisos que já vinham (ex.: da planilha)
 * continuam nos demais dias.
 */
export function aplicarCalendario(cardapio: Cardapio, periodos: PeriodoSemFuncionamento[]): Cardapio {
  const doCalendario = avisosDaSemana(periodos, cardapio.semanaInicio);
  if (doCalendario.length === 0) return cardapio;
  const fechados = new Set(doCalendario.map((a) => a.dia));
  const mantidos = (cardapio.avisos ?? []).filter((a) => !fechados.has(a.dia));
  return {
    ...cardapio,
    itens: cardapio.itens.filter((i) => !fechados.has(i.dia)),
    avisos: [...mantidos, ...doCalendario].sort((a, b) => ((a.dia + 6) % 7) - ((b.dia + 6) % 7)),
  };
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function somarDias(d: Date, n: number): string {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

/**
 * Feriados nacionais (e os pontos facultativos de Carnaval e Corpus Christi,
 * em que as escolas costumam fechar) do ano.
 */
export function feriadosNacionais(ano: number): { data: string; nome: string }[] {
  const p = pascoa(ano);
  const fixo = (mes: number, dia: number) => `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  return [
    { data: fixo(1, 1), nome: 'Confraternização Universal' },
    { data: somarDias(p, -48), nome: 'Carnaval (segunda)' },
    { data: somarDias(p, -47), nome: 'Carnaval (terça)' },
    { data: somarDias(p, -2), nome: 'Sexta-feira Santa' },
    { data: fixo(4, 21), nome: 'Tiradentes' },
    { data: fixo(5, 1), nome: 'Dia do Trabalho' },
    { data: somarDias(p, 60), nome: 'Corpus Christi' },
    { data: fixo(9, 7), nome: 'Independência do Brasil' },
    { data: fixo(10, 12), nome: 'Nossa Senhora Aparecida' },
    { data: fixo(11, 2), nome: 'Finados' },
    { data: fixo(11, 15), nome: 'Proclamação da República' },
    { data: fixo(11, 20), nome: 'Dia da Consciência Negra' },
    { data: fixo(12, 25), nome: 'Natal' },
  ].sort((a, b) => a.data.localeCompare(b.data));
}
