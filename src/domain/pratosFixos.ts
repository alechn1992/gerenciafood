// Pratos fixos ("combinados") do cliente: um prato garantido num dia (ou em
// todos os dias), numa refeição e categoria, para todas ou só algumas turmas.

import type { DiaSemana, ItemCardapio, PratoFixoCliente, Prato } from './types';

/** O combinado vale para esta turma? Sem turmas marcadas, vale para todas. */
export function valeParaTurma(f: PratoFixoCliente, turmaId: string | undefined): boolean {
  return !f.turmaIds || f.turmaIds.length === 0 || (!!turmaId && f.turmaIds.includes(turmaId));
}

/**
 * Combinado que se aplica à célula. O de um dia específico vence o de
 * "todos os dias", para permitir exceções (ex.: suco só na sexta).
 */
export function fixoDaCelula(
  fixos: PratoFixoCliente[],
  c: { dia: DiaSemana; tipoRefeicaoId: string; categoria: string; turmaId?: string },
): PratoFixoCliente | undefined {
  const candidatos = fixos.filter(
    (f) =>
      f.tipoRefeicaoId === c.tipoRefeicaoId &&
      f.categoria === c.categoria &&
      valeParaTurma(f, c.turmaId) &&
      (f.todosOsDias || f.diaId === c.dia),
  );
  return candidatos.find((f) => !f.todosOsDias) ?? candidatos[0];
}

/**
 * Aplica os combinados a um cardápio já montado (ex.: o gerado pelo histórico):
 * troca o primeiro item da mesma refeição e categoria pelo prato combinado ou,
 * se a refeição não tiver essa categoria naquele dia, inclui o prato no
 * começo da refeição.
 */
export function aplicarPratosFixos(
  itens: ItemCardapio[],
  fixos: PratoFixoCliente[],
  opcoes: { dias: DiaSemana[]; turmaId?: string; pratos: Prato[] },
): ItemCardapio[] {
  const ativos = new Map(opcoes.pratos.filter((p) => p.ativo).map((p) => [p.id, p]));
  let resultado = itens.slice();
  const celulas = new Set<string>();
  for (const f of fixos) {
    if (!valeParaTurma(f, opcoes.turmaId)) continue;
    for (const dia of f.todosOsDias ? opcoes.dias : opcoes.dias.filter((d) => d === f.diaId)) {
      celulas.add(`${dia}|${f.tipoRefeicaoId}|${f.categoria}`);
    }
  }
  for (const chave of celulas) {
    const [diaTexto, tipoRefeicaoId, categoria] = chave.split('|');
    const dia = Number(diaTexto) as DiaSemana;
    const f = fixoDaCelula(fixos, { dia, tipoRefeicaoId, categoria, turmaId: opcoes.turmaId });
    const prato = f && ativos.get(f.pratoId);
    if (!f || !prato) continue;
    const novo: ItemCardapio = { dia, tipoRefeicaoId, categoria, pratoId: prato.id, pratoNome: prato.nome };
    const i = resultado.findIndex((it) => it.dia === dia && it.tipoRefeicaoId === tipoRefeicaoId && it.categoria === categoria);
    if (i >= 0) {
      resultado[i] = novo;
      continue;
    }
    const inicioDaRefeicao = resultado.findIndex((it) => it.dia === dia && it.tipoRefeicaoId === tipoRefeicaoId);
    resultado =
      inicioDaRefeicao >= 0
        ? [...resultado.slice(0, inicioDaRefeicao), novo, ...resultado.slice(inicioDaRefeicao)]
        : [...resultado, novo];
  }
  return resultado;
}
