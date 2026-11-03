// Folha mensal da cozinha: quais semanas entram em um mês e quais dias de cada
// semana pertencem a ele. Datas tratadas como texto ISO (yyyy-mm-dd) para não
// depender do fuso horário.

import type { DiaSemana } from './types';

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Data (ISO) de um dia da semana, a partir da segunda-feira de referência. */
export function dataNaSemana(semanaInicio: string, dia: DiaSemana): string {
  const d = new Date(`${semanaInicio}T12:00:00`);
  d.setDate(d.getDate() + (dia === 0 ? 6 : dia - 1));
  return iso(d);
}

/** "2026-11" → true para datas de novembro de 2026. */
export function noMes(dataIso: string, mes: string): boolean {
  return dataIso.slice(0, 7) === mes;
}

/**
 * Segundas-feiras das semanas que têm pelo menos um dia de funcionamento
 * dentro do mês, em ordem.
 */
export function semanasDoMes(mes: string, diasOperacao: DiaSemana[]): string[] {
  const [ano, m] = mes.split('-').map(Number);
  const primeiro = new Date(ano, m - 1, 1, 12);
  // Volta até a segunda-feira da semana do dia 1.
  const recuo = (primeiro.getDay() + 6) % 7;
  const seg = new Date(primeiro);
  seg.setDate(seg.getDate() - recuo);
  const semanas: string[] = [];
  while (true) {
    const s = iso(seg);
    if (s.slice(0, 7) > mes) break;
    if (diasOperacao.some((d) => noMes(dataNaSemana(s, d), mes))) semanas.push(s);
    seg.setDate(seg.getDate() + 7);
  }
  return semanas;
}

/** Mês (yyyy-mm) "dono" de uma semana: o da quinta-feira, como no calendário ISO. */
export function mesDaSemana(semanaInicio: string): string {
  return dataNaSemana(semanaInicio, 4).slice(0, 7);
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** "2026-11" → "Novembro de 2026". */
export function rotuloMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} de ${ano}`;
}

/** Turma sugerida para a cozinha: a dos infantis, se houver; senão a primeira. */
export function turmaPadraoCozinha<T extends { nome: string }>(turmas: T[]): T | undefined {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return turmas.find((t) => norm(t.nome).includes('infant')) ?? turmas[0];
}
