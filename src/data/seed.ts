// Dados iniciais (seed) usados no primeiro acesso / modo local.

import type { Insumo, Prato, TipoRefeicao } from '../domain/types';

export const TIPOS_REFEICAO_PADRAO: TipoRefeicao[] = [
  { id: 'cafe', nome: 'Café da manhã', ordem: 1 },
  { id: 'almoco', nome: 'Almoço', ordem: 2 },
  { id: 'lanche_tarde', nome: 'Lanche da tarde', ordem: 3 },
  { id: 'jantar', nome: 'Jantar', ordem: 4 },
  { id: 'ceia', nome: 'Ceia', ordem: 5 },
];

let n = 0;
const p = (
  nome: string,
  categoria: Prato['categoria'],
  restricoes: string[] = [],
  tags: string[] = [],
): Prato => ({ id: `seed-${++n}`, nome, categoria, restricoes, tags, ativo: true });

export const PRATOS_PADRAO: Prato[] = [
  // Proteínas
  p('Frango grelhado', 'proteina', ['sem_gluten', 'sem_lactose']),
  p('Frango ao molho', 'proteina'),
  p('Carne assada', 'proteina', ['sem_gluten']),
  p('Bife acebolado', 'proteina', ['sem_gluten', 'sem_lactose']),
  p('Carne moída refogada', 'proteina', ['sem_gluten']),
  p('Peixe ao forno', 'proteina', ['sem_gluten', 'sem_lactose']),
  p('Iscas de frango', 'proteina'),
  p('Omelete', 'proteina', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Ovo mexido', 'proteina', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Estrogonofe de frango', 'proteina'),
  // Guarnições
  p('Farofa', 'guarnicao', ['sem_lactose']),
  p('Batata sauté', 'guarnicao', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Legumes refogados', 'guarnicao', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Purê de batata', 'guarnicao', ['sem_gluten', 'vegetariano']),
  p('Macarrão ao alho e óleo', 'guarnicao', ['sem_lactose', 'vegetariano']),
  // Acompanhamentos (base)
  p('Arroz branco', 'acompanhamento', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Arroz integral', 'acompanhamento', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Feijão carioca', 'acompanhamento', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Feijão preto', 'acompanhamento', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  // Saladas
  p('Salada verde', 'salada', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Salada de tomate', 'salada', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Salada de repolho', 'salada', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Salada de beterraba', 'salada', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Salada de cenoura', 'salada', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  // Sobremesas
  p('Fruta da estação', 'sobremesa', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Gelatina', 'sobremesa', ['sem_gluten']),
  p('Doce de leite', 'sobremesa', ['sem_gluten']),
  p('Pudim', 'sobremesa', ['sem_gluten']),
  // Bebidas
  p('Suco de laranja', 'bebida', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Suco de uva', 'bebida', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Café', 'bebida', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  // Lanches
  p('Pão com manteiga', 'lanche', ['vegetariano']),
  p('Bolo simples', 'lanche', ['vegetariano']),
  p('Tapioca', 'lanche', ['sem_gluten', 'sem_lactose', 'vegetariano']),
  p('Sanduíche natural', 'lanche'),
];

export const RESTRICOES_DISPONIVEIS: { valor: string; nome: string }[] = [
  { valor: 'sem_gluten', nome: 'Sem glúten' },
  { valor: 'sem_lactose', nome: 'Sem lactose' },
  { valor: 'vegetariano', nome: 'Vegetariano' },
  { valor: 'vegano', nome: 'Vegano' },
];

let ni = 0;
const i = (nome: string, unidade: Insumo['unidade']): Insumo => ({
  id: `seed-insumo-${++ni}`,
  nome,
  unidade,
  precoUnitario: 0,
  ativo: true,
});

/**
 * Catálogo inicial de insumos, cobrindo os ingredientes mais comuns dos
 * pratos já cadastrados. Preço zerado — basta preencher o valor de compra.
 */
export const INSUMOS_PADRAO: Insumo[] = [
  i('Arroz branco', 'kg'),
  i('Arroz integral', 'kg'),
  i('Feijão carioca', 'kg'),
  i('Feijão preto', 'kg'),
  i('Peito de frango', 'kg'),
  i('Carne bovina (patinho)', 'kg'),
  i('Carne moída', 'kg'),
  i('Peixe (filé)', 'kg'),
  i('Ovo', 'dz'),
  i('Batata', 'kg'),
  i('Cebola', 'kg'),
  i('Alho', 'kg'),
  i('Tomate', 'kg'),
  i('Repolho', 'kg'),
  i('Beterraba', 'kg'),
  i('Cenoura', 'kg'),
  i('Alface', 'un'),
  i('Óleo de soja', 'l'),
  i('Leite', 'l'),
  i('Farinha de trigo', 'kg'),
  i('Farinha de mandioca', 'kg'),
  i('Macarrão', 'kg'),
  i('Açúcar', 'kg'),
  i('Sal', 'kg'),
  i('Café (pó)', 'kg'),
  i('Laranja', 'kg'),
  i('Uva', 'kg'),
  i('Pão', 'un'),
  i('Manteiga', 'kg'),
];
