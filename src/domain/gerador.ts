// Motor de geração de cardápios.
//
// Regras principais:
//  - Só gera para os dias em que o cliente opera (diasOperacao).
//  - Respeita as refeições configuradas e sua composição (categorias x quantidade).
//  - Respeita restrições alimentares do cliente (o prato precisa declarar a
//    restrição como atendida, ex.: 'sem_gluten').
//  - Maximiza a variedade: um prato só se repete depois de esgotar as demais
//    opções da categoria, e evita repetição em dias consecutivos.
//  - Determinístico dado um `seed` (facilita testes e "regenerar igual").

import type {
  CategoriaPrato,
  Cardapio,
  Cliente,
  ItemCardapio,
  Prato,
  RefeicaoConfig,
} from './types';
import { DIAS_SEMANA } from './types';

/** Gerador pseudoaleatório determinístico (mulberry32). */
function criarRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Embaralha uma cópia do array usando o RNG fornecido (Fisher–Yates). */
function embaralhar<T>(itens: T[], rng: () => number): T[] {
  const copia = itens.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** True se o prato atende a todas as restrições exigidas pelo cliente. */
function atendeRestricoes(prato: Prato, restricoes: string[]): boolean {
  return restricoes.every((r) => prato.restricoes.includes(r));
}

export interface ResultadoGeracao {
  cardapio: Cardapio;
  /** Avisos não bloqueantes (ex.: categoria sem pratos suficientes). */
  avisos: string[];
}

export interface OpcoesGeracao {
  cliente: Cliente;
  pratos: Prato[];
  semanaInicio: string; // ISO date da segunda-feira
  seed?: number;
  /** Injeção de id/data para testes; produção usa valores reais. */
  id?: string;
  geradoEm?: string;
}

/**
 * Distribui pratos de uma mesma (refeição × categoria) ao longo dos dias,
 * consumindo ciclos embaralhados para garantir variedade máxima e evitando
 * repetir o mesmo prato do dia imediatamente anterior quando há alternativa.
 */
function distribuir(
  candidatos: Prato[],
  slots: number,
  rng: () => number,
): Prato[] {
  const resultado: Prato[] = [];
  if (candidatos.length === 0) return resultado;

  let fila = embaralhar(candidatos, rng);
  let anterior: Prato | undefined;

  for (let i = 0; i < slots; i++) {
    if (fila.length === 0) fila = embaralhar(candidatos, rng);

    let escolhido = fila.shift()!;
    // Evita repetir o prato do dia anterior se houver outra opção na fila.
    if (anterior && escolhido.id === anterior.id && fila.length > 0) {
      const troca = fila.shift()!;
      fila.unshift(escolhido);
      escolhido = troca;
    }
    resultado.push(escolhido);
    anterior = escolhido;
  }
  return resultado;
}

export function gerarCardapio(opcoes: OpcoesGeracao): ResultadoGeracao {
  const { cliente, pratos, semanaInicio } = opcoes;
  const rng = criarRng(opcoes.seed ?? Date.now());
  const avisos: string[] = [];

  const diasOrdenados = DIAS_SEMANA.map((d) => d.valor).filter((d) =>
    cliente.diasOperacao.includes(d),
  );

  const pratosAtivos = pratos.filter((p) => p.ativo);
  const refeicoesPorId = new Map<string, RefeicaoConfig>();
  cliente.refeicoes.forEach((r) => refeicoesPorId.set(r.tipoRefeicaoId, r));

  const itens: ItemCardapio[] = [];

  for (const refeicao of cliente.refeicoes) {
    for (const comp of refeicao.composicao) {
      const candidatos = pratosAtivos.filter(
        (p) =>
          p.categoria === comp.categoria &&
          atendeRestricoes(p, cliente.restricoes),
      );

      if (candidatos.length === 0) {
        avisos.push(
          `Sem pratos de "${rotuloCategoria(comp.categoria)}" disponíveis para a refeição.`,
        );
        continue;
      }

      // Para cada "posição" da categoria (quantidade), gera uma sequência
      // independente ao longo dos dias, dando mais variedade entre colunas.
      for (let pos = 0; pos < comp.quantidade; pos++) {
        const sequencia = distribuir(candidatos, diasOrdenados.length, rng);
        diasOrdenados.forEach((dia, idx) => {
          const prato = sequencia[idx];
          if (!prato) return;
          itens.push({
            dia,
            tipoRefeicaoId: refeicao.tipoRefeicaoId,
            categoria: comp.categoria,
            pratoId: prato.id,
            pratoNome: prato.nome,
          });
        });
      }
    }
  }

  const cardapio: Cardapio = {
    id: opcoes.id ?? crypto.randomUUID(),
    clienteId: cliente.id,
    semanaInicio,
    itens,
    geradoEm: opcoes.geradoEm ?? new Date().toISOString(),
  };

  return { cardapio, avisos };
}

const ROTULOS_CATEGORIA: Record<CategoriaPrato, string> = {
  proteina: 'Proteína',
  guarnicao: 'Guarnição',
  acompanhamento: 'Acompanhamento',
  salada: 'Salada',
  sobremesa: 'Sobremesa',
  bebida: 'Bebida',
  lanche: 'Lanche',
  outro: 'Outro',
};

export function rotuloCategoria(c: CategoriaPrato): string {
  return ROTULOS_CATEGORIA[c] ?? c;
}
