// Tipos centrais do domínio do GerenciaFood.

/** Dias da semana, 0 = Domingo ... 6 = Sábado (mesmo padrão de Date.getDay()). */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DIAS_SEMANA: { valor: DiaSemana; nome: string; curto: string }[] = [
  { valor: 1, nome: 'Segunda-feira', curto: 'Seg' },
  { valor: 2, nome: 'Terça-feira', curto: 'Ter' },
  { valor: 3, nome: 'Quarta-feira', curto: 'Qua' },
  { valor: 4, nome: 'Quinta-feira', curto: 'Qui' },
  { valor: 5, nome: 'Sexta-feira', curto: 'Sex' },
  { valor: 6, nome: 'Sábado', curto: 'Sáb' },
  { valor: 0, nome: 'Domingo', curto: 'Dom' },
];

/**
 * Tipos de refeição que podem compor um dia. A lista é aberta: o cliente pode
 * acrescentar quantas refeições quiser (ex.: "Ceia", "Lanche da tarde").
 */
export interface TipoRefeicao {
  id: string;
  nome: string; // ex.: "Café da manhã", "Almoço", "Jantar"
  ordem: number; // ordena as refeições dentro de um dia
}

/** Categoria de um prato, usada pelas regras de variedade. */
export type CategoriaPrato =
  | 'proteina'
  | 'guarnicao'
  | 'acompanhamento'
  | 'salada'
  | 'sobremesa'
  | 'bebida'
  | 'lanche'
  | 'outro';

export const CATEGORIAS_PRATO: { valor: CategoriaPrato; nome: string }[] = [
  { valor: 'proteina', nome: 'Proteína' },
  { valor: 'guarnicao', nome: 'Guarnição' },
  { valor: 'acompanhamento', nome: 'Acompanhamento' },
  { valor: 'salada', nome: 'Salada' },
  { valor: 'sobremesa', nome: 'Sobremesa' },
  { valor: 'bebida', nome: 'Bebida' },
  { valor: 'lanche', nome: 'Lanche' },
  { valor: 'outro', nome: 'Outro' },
];

/** Unidade de medida de um insumo. */
export type UnidadeMedida = 'kg' | 'g' | 'l' | 'ml' | 'un' | 'dz' | 'pct';

export const UNIDADES_MEDIDA: { valor: UnidadeMedida; nome: string; sigla: string }[] = [
  { valor: 'kg', nome: 'Quilograma', sigla: 'kg' },
  { valor: 'g', nome: 'Grama', sigla: 'g' },
  { valor: 'l', nome: 'Litro', sigla: 'L' },
  { valor: 'ml', nome: 'Mililitro', sigla: 'ml' },
  { valor: 'un', nome: 'Unidade', sigla: 'un' },
  { valor: 'dz', nome: 'Dúzia', sigla: 'dz' },
  { valor: 'pct', nome: 'Pacote', sigla: 'pct' },
];

/** Insumo (matéria-prima) cadastrado com preço, usado para custear receitas. */
export interface Insumo {
  id: string;
  nome: string;
  unidade: UnidadeMedida;
  /** Preço por 1 unidade de `unidade` (ex.: preço por kg). */
  precoUnitario: number;
  ativo: boolean;
}

/** Um insumo e a quantidade usada dentro de uma receita, para cálculo de custo. */
export interface ItemReceita {
  insumoId: string;
  quantidade: number;
}

/** Ficha técnica de preparo de um prato. */
export interface Receita {
  /** Um ingrediente por item (ex.: "500g de peito de frango") — texto livre, para exibição/impressão. */
  ingredientes: string[];
  /** Insumos e quantidades usadas, para cálculo automático do custo da receita. */
  insumosUsados: ItemReceita[];
  /** Modo de preparo; passos separados por linha. */
  modoPreparo: string;
  /** Ex.: "10 porções". */
  rendimento?: string;
  /** Ex.: "40 min". */
  tempoPreparo?: string;
}

/** Prato do banco de dados de receitas. */
export interface Prato {
  id: string;
  nome: string;
  categoria: CategoriaPrato;
  /** Restrições alimentares que o prato NÃO contém (ex.: 'sem_gluten'). */
  restricoes: string[];
  /** Tags livres para casar com preferências do cliente (ex.: 'regional'). */
  tags: string[];
  ativo: boolean;
  /** Ficha técnica (ingredientes e modo de preparo), opcional. */
  receita?: Receita;
}

/**
 * Composição de uma refeição em termos de categorias.
 * Ex.: almoço = 1 proteína + 1 guarnição + 1 salada + 1 sobremesa.
 */
export interface ComposicaoRefeicao {
  categoria: CategoriaPrato;
  quantidade: number;
}

/** Configuração de uma refeição dentro do plano do cliente. */
export interface RefeicaoConfig {
  tipoRefeicaoId: string;
  composicao: ComposicaoRefeicao[];
}

/**
 * Turma/faixa etária dentro de um cliente (ex.: um CEI com "Baby 1 (4-6 meses)",
 * "Baby 2 (6 meses)", ..., "Infantis"). Cada turma tem suas próprias refeições
 * e restrições; os dias de operação são os do cliente.
 */
export interface Turma {
  id: string;
  clienteId: string;
  nome: string;
  ordem: number;
  refeicoes: RefeicaoConfig[];
  restricoes: string[];
}

/** Cliente e suas particularidades. */
export interface Cliente {
  id: string;
  nome: string;
  cnpj?: string;
  responsavel?: string;
  cidade?: string;
  uf: string; // padrão 'PR'
  /** Dias em que há operação (ex.: [1,2,3,4,5] = seg a sex). */
  diasOperacao: DiaSemana[];
  /** Refeições servidas em cada dia de operação. */
  refeicoes: RefeicaoConfig[];
  /** Restrições/preferências globais do cliente (ex.: 'sem_gluten'). */
  restricoes: string[];
  observacoes?: string;
  criadoEm: string;
}

/** Um item concreto do cardápio: um prato alocado a uma célula. */
export interface ItemCardapio {
  dia: DiaSemana;
  tipoRefeicaoId: string;
  categoria: CategoriaPrato;
  pratoId: string;
  pratoNome: string;
}

/** Cardápio gerado para um cliente (ou uma turma do cliente) numa semana. */
export interface Cardapio {
  id: string;
  clienteId: string;
  /** Presente quando o cardápio é de uma turma específica do cliente. */
  turmaId?: string;
  /** Data (ISO) da segunda-feira de referência da semana. */
  semanaInicio: string;
  itens: ItemCardapio[];
  geradoEm: string;
}
