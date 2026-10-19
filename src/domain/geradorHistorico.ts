// Geração de cardápio a partir do histórico da turma.
//
// Turmas criadas pela importação da planilha não têm composição configurada
// (categorias × quantidade), então o gerador padrão não tem o que sortear.
// Para elas, a estrutura e os pratos vêm das semanas já salvas da própria
// turma: cada refeição é vista como uma sequência de posições ("linhas" da
// planilha), e cada posição tem os pratos que já apareceram nela.
//
//  - Itens de ocasião (bolo dos aniversariantes, dia da culinária) não são
//    sorteados para outras semanas.
//  - Posição com um prato dominante (ex.: "Arroz", "Saladas", "Leite
//    materno/Fórmula Infantil") é fixa: repete todos os dias.
//  - As demais giram entre os pratos já servidos naquela posição, sem repetir
//    na semana enquanto houver opção e deixando por último os que saíram na
//    semana mais recente.

import type { Cardapio, CategoriaPrato, DiaSemana, ItemCardapio, Prato, Turma } from './types';
import { criarRng, embaralhar } from './gerador';
import { ehFormula, ehItemDeEvento } from './pratosEspeciais';

export interface OpcoesHistorico {
  clienteId: string;
  turma: Turma;
  /** Dias de operação do cliente, na ordem em que aparecem na semana. */
  dias: DiaSemana[];
  /** Cardápios salvos da turma (qualquer ordem). A semana gerada é ignorada. */
  historico: Cardapio[];
  /** Catálogo atual: pratos excluídos ou desativados não voltam ao cardápio. */
  pratos: Prato[];
  semanaInicio: string;
  seed?: number;
  /** Quantas semanas mais recentes servem de base. */
  semanasDeBase?: number;
}

export interface ResultadoHistorico {
  cardapio: Cardapio | null;
  avisos: string[];
}

/** Fração mínima dos dias em que um prato aparece para a posição ser fixa. */
const LIMIAR_FIXO = 0.8;

interface Ocorrencia {
  pratoId: string;
  pratoNome: string;
  categoria: CategoriaPrato;
  semanaInicio: string;
}

function moda<T>(valores: T[]): T | undefined {
  const contagem = new Map<T, number>();
  let melhor: T | undefined;
  let max = 0;
  for (const v of valores) {
    const n = (contagem.get(v) ?? 0) + 1;
    contagem.set(v, n);
    if (n > max) {
      max = n;
      melhor = v;
    }
  }
  return melhor;
}

/** Sequência de pratos para os dias da semana, sem repetir enquanto houver opção. */
function sortearSequencia(
  opcoes: Ocorrencia[],
  recentes: Set<string>,
  dias: number,
  rng: () => number,
): Ocorrencia[] {
  // Pratos fora da última semana vêm primeiro; os recentes só completam a fila.
  const novos = embaralhar(opcoes.filter((o) => !recentes.has(o.pratoId)), rng);
  const repetidos = embaralhar(opcoes.filter((o) => recentes.has(o.pratoId)), rng);
  const ciclo = [...novos, ...repetidos];
  return Array.from({ length: dias }, (_, i) => ciclo[i % ciclo.length]);
}

export function gerarPorHistorico(op: OpcoesHistorico): ResultadoHistorico {
  const ativos = new Set(op.pratos.filter((p) => p.ativo).map((p) => p.id));
  const base = op.historico
    .filter((c) => c.turmaId === op.turma.id && c.semanaInicio !== op.semanaInicio && c.itens.length > 0)
    .sort((a, b) => b.semanaInicio.localeCompare(a.semanaInicio))
    .slice(0, op.semanasDeBase ?? 8);

  if (base.length === 0) {
    return {
      cardapio: null,
      avisos: [
        `${op.turma.nome}: sem composição de pratos configurada e sem semanas anteriores salvas para usar de base. ` +
          'Importe ou salve ao menos uma semana, ou configure a composição no cadastro do cliente.',
      ],
    };
  }

  const rng = criarRng(op.seed ?? Date.now());
  const maisRecente = base[0].semanaInicio;

  // Refeições na ordem configurada da turma; as que só existem no histórico vão ao fim.
  const tipos = [
    ...op.turma.refeicoes.map((r) => r.tipoRefeicaoId),
    ...base.flatMap((c) => c.itens.map((i) => i.tipoRefeicaoId)),
  ].filter((t, i, todos) => todos.indexOf(t) === i);

  const itens: ItemCardapio[] = [];

  for (const tipo of tipos) {
    // Cada dia servido no histórico vira uma lista ordenada de posições.
    const diasServidos: Ocorrencia[][] = [];
    for (const c of base) {
      const porDia = new Map<DiaSemana, Ocorrencia[]>();
      for (const it of c.itens) {
        if (it.tipoRefeicaoId !== tipo) continue;
        if (!porDia.has(it.dia)) porDia.set(it.dia, []);
        porDia.get(it.dia)!.push({
          ...it,
          // Semanas importadas antes desta regra guardam a fórmula como "Proteína".
          categoria: ehFormula(it.pratoNome) ? 'bebida' : it.categoria,
          semanaInicio: c.semanaInicio,
        });
      }
      diasServidos.push(...porDia.values());
    }
    if (diasServidos.length === 0) continue;

    const posicoes = moda(diasServidos.map((d) => d.length)) ?? 0;

    for (let pos = 0; pos < posicoes; pos++) {
      const naPosicao = diasServidos
        .map((d) => d[pos])
        .filter((o): o is Ocorrencia => !!o && ativos.has(o.pratoId) && !ehItemDeEvento(o.pratoNome));
      if (naPosicao.length === 0) continue;

      const vezes = new Map<string, number>();
      for (const o of naPosicao) vezes.set(o.pratoId, (vezes.get(o.pratoId) ?? 0) + 1);
      const distintos = [...new Map(naPosicao.map((o) => [o.pratoId, o])).values()];
      const dominante = distintos.reduce((a, b) => ((vezes.get(b.pratoId)! > vezes.get(a.pratoId)!) ? b : a));

      const sequencia =
        vezes.get(dominante.pratoId)! / naPosicao.length >= LIMIAR_FIXO
          ? op.dias.map(() => dominante)
          : sortearSequencia(
              distintos,
              new Set(naPosicao.filter((o) => o.semanaInicio === maisRecente).map((o) => o.pratoId)),
              op.dias.length,
              rng,
            );

      op.dias.forEach((dia, i) => {
        const o = sequencia[i];
        itens.push({ dia, tipoRefeicaoId: tipo, categoria: o.categoria, pratoId: o.pratoId, pratoNome: o.pratoNome });
      });
    }
  }

  // Mantém a ordem dia → refeição → posição, como na importação.
  const ordemTipo = new Map(tipos.map((t, i) => [t, i]));
  const ordenados = itens
    .map((it, i) => ({ it, i }))
    .sort((a, b) => a.it.dia - b.it.dia || ordemTipo.get(a.it.tipoRefeicaoId)! - ordemTipo.get(b.it.tipoRefeicaoId)! || a.i - b.i)
    .map(({ it }) => it);

  return {
    cardapio: {
      id: crypto.randomUUID(),
      clienteId: op.clienteId,
      turmaId: op.turma.id,
      semanaInicio: op.semanaInicio,
      itens: ordenados,
      geradoEm: new Date().toISOString(),
    },
    avisos: [],
  };
}
