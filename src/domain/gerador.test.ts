import { describe, it, expect } from 'vitest';
import { gerarCardapio } from './gerador';
import type { Cliente, Prato } from './types';

function prato(id: string, nome: string, categoria: Prato['categoria'], restricoes: string[] = []): Prato {
  return { id, nome, categoria, restricoes, tags: [], ativo: true };
}

const pratos: Prato[] = [
  prato('p1', 'Frango grelhado', 'proteina'),
  prato('p2', 'Carne assada', 'proteina'),
  prato('p3', 'Peixe ao forno', 'proteina'),
  prato('p4', 'Omelete', 'proteina', ['sem_gluten', 'vegetariano']),
  prato('a1', 'Arroz branco', 'acompanhamento'),
  prato('a2', 'Feijão carioca', 'acompanhamento'),
  prato('s1', 'Salada verde', 'salada'),
  prato('d1', 'Gelatina', 'sobremesa', ['sem_gluten']),
];

function clienteBase(over: Partial<Cliente> = {}): Cliente {
  return {
    id: 'c1',
    nome: 'Cliente Teste',
    uf: 'PR',
    diasOperacao: [1, 2, 3, 4, 5],
    refeicoes: [
      {
        tipoRefeicaoId: 'almoco',
        composicao: [
          { categoria: 'proteina', quantidade: 1 },
          { categoria: 'acompanhamento', quantidade: 2 },
          { categoria: 'salada', quantidade: 1 },
          { categoria: 'sobremesa', quantidade: 1 },
        ],
      },
    ],
    restricoes: [],
    criadoEm: new Date().toISOString(),
    ...over,
  };
}

describe('gerarCardapio', () => {
  it('gera itens apenas para os dias de operação', () => {
    const { cardapio } = gerarCardapio({
      cliente: clienteBase({ diasOperacao: [1, 3, 5] }),
      pratos,
      semanaInicio: '2026-07-06',
      seed: 1,
    });
    const dias = new Set(cardapio.itens.map((i) => i.dia));
    expect([...dias].sort()).toEqual([1, 3, 5]);
  });

  it('preenche a composição configurada de cada refeição', () => {
    const { cardapio } = gerarCardapio({
      cliente: clienteBase({ diasOperacao: [1] }),
      pratos,
      semanaInicio: '2026-07-06',
      seed: 2,
    });
    const doDia = cardapio.itens.filter((i) => i.dia === 1);
    // 1 proteína + 2 acompanhamentos + 1 salada + 1 sobremesa = 5
    expect(doDia).toHaveLength(5);
    expect(doDia.filter((i) => i.categoria === 'acompanhamento')).toHaveLength(2);
  });

  it('é determinístico para o mesmo seed', () => {
    const a = gerarCardapio({ cliente: clienteBase(), pratos, semanaInicio: '2026-07-06', seed: 42, id: 'x', geradoEm: 'z' });
    const b = gerarCardapio({ cliente: clienteBase(), pratos, semanaInicio: '2026-07-06', seed: 42, id: 'x', geradoEm: 'z' });
    expect(a.cardapio.itens).toEqual(b.cardapio.itens);
  });

  it('respeita as restrições alimentares do cliente', () => {
    const { cardapio } = gerarCardapio({
      cliente: clienteBase({ restricoes: ['sem_gluten'] }),
      pratos,
      semanaInicio: '2026-07-06',
      seed: 3,
    });
    const proteinas = cardapio.itens.filter((i) => i.categoria === 'proteina');
    // Apenas o omelete (p4) atende sem_gluten entre as proteínas.
    expect(proteinas.every((i) => i.pratoId === 'p4')).toBe(true);
  });

  it('não repete proteína em dias consecutivos quando há alternativas', () => {
    const { cardapio } = gerarCardapio({
      cliente: clienteBase({ diasOperacao: [1, 2, 3, 4, 5] }),
      pratos,
      semanaInicio: '2026-07-06',
      seed: 7,
    });
    const proteinasPorDia = [1, 2, 3, 4, 5].map(
      (d) => cardapio.itens.find((i) => i.dia === d && i.categoria === 'proteina')?.pratoId,
    );
    for (let i = 1; i < proteinasPorDia.length; i++) {
      expect(proteinasPorDia[i]).not.toEqual(proteinasPorDia[i - 1]);
    }
  });

  it('emite aviso quando falta categoria no banco de pratos', () => {
    const semSalada = pratos.filter((p) => p.categoria !== 'salada');
    const { avisos } = gerarCardapio({
      cliente: clienteBase({ diasOperacao: [1] }),
      pratos: semSalada,
      semanaInicio: '2026-07-06',
      seed: 5,
    });
    expect(avisos.join(' ')).toMatch(/Salada/i);
  });
});
