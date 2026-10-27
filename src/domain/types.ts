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

/** Categorias que vêm com o sistema. */
export type CategoriaPadrao =
  | 'proteina'
  | 'guarnicao'
  | 'acompanhamento'
  | 'salada'
  | 'sobremesa'
  | 'bebida'
  | 'lanche'
  | 'outro';

/**
 * Categoria de um prato, usada pelas regras de variedade: uma das padrão ou
 * uma cadastrada pela nutricionista (identificador, ex.: 'fruta').
 */
export type CategoriaPrato = CategoriaPadrao | (string & {});

/** Categoria cadastrada pela nutricionista, além das padrão. */
export interface CategoriaCadastrada {
  valor: string;
  nome: string;
  criadoEm?: string;
}

/** Só as padrão; a lista completa (com as cadastradas) vem de `categoriasDisponiveis()`. */
export const CATEGORIAS_PRATO: { valor: CategoriaPadrao; nome: string }[] = [
  { valor: 'proteina', nome: 'Proteína' },
  { valor: 'guarnicao', nome: 'Guarnição' },
  { valor: 'acompanhamento', nome: 'Acompanhamento' },
  { valor: 'salada', nome: 'Salada' },
  { valor: 'bebida', nome: 'Bebida' },
  { valor: 'lanche', nome: 'Lanche' },
  { valor: 'sobremesa', nome: 'Sobremesa' },
  { valor: 'outro', nome: 'Outro' },
];

/**
 * Restrição/preferência alimentar cadastrada pela nutricionista (ex.: "Sem
 * ovo"), somada às padrão. `valor` é o identificador gravado em turmas,
 * clientes e pratos; `nome` é o rótulo exibido.
 */
export interface PreferenciaAlimentar {
  valor: string;
  nome: string;
  criadoEm?: string;
}

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

/** Valores nutricionais por 100 g / 100 ml do alimento (fonte: TACO ou entrada manual). */
export interface NutricaoInsumo {
  /** ID do item na tabela TACO, quando vinculado automaticamente. */
  tacoId?: string;
  kcal: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  fibras: number;
  sodio: number;
}

/** Categorias de insumo, usadas para filtrar e organizar após a importação via API. */
export type CategoriaInsumo = 'mercado' | 'açougue' | 'varejão' | 'naturais' | 'outro';

export const CATEGORIAS_INSUMO: { valor: CategoriaInsumo; nome: string }[] = [
  { valor: 'mercado', nome: 'Mercado' },
  { valor: 'açougue', nome: 'Açougue' },
  { valor: 'varejão', nome: 'Varejão' },
  { valor: 'naturais', nome: 'Naturais' },
  { valor: 'outro', nome: 'Outro' },
];

/** Insumo (matéria-prima) cadastrado com preço, usado para custear receitas. */
export interface Insumo {
  id: string;
  nome: string;
  unidade: UnidadeMedida;
  /** Quantidade total na embalagem comprada (ex.: 30 para caixa com 30 ovos). */
  qtdEmbalagem: number;
  /** Preço total pago pela embalagem. */
  precoEmbalagem: number;
  /** Calculado: precoEmbalagem / qtdEmbalagem. Usado para custear receitas. */
  precoUnitario: number;
  ativo: boolean;
  /**
   * Gramas por 1 unidade de medida — necessário para calcular nutrição quando a
   * unidade é un / dz / pct. Para kg/g/L/ml o peso é derivado automaticamente.
   */
  pesoGramas?: number;
  /** Informação nutricional por 100 g (fonte: TACO ou manual). */
  nutricao?: NutricaoInsumo;
  /** Categoria do insumo (mercado, açougue, varejão, naturais). */
  categoria?: CategoriaInsumo;
  /** ID do produto no sistema externo, para sincronização via API. */
  codigoExterno?: string;
  /** ISO timestamp da última sincronização com o sistema externo. */
  sincronizadoEm?: string;
}

/** Configuração da integração com API externa de produtos/insumos. */
export interface ConfiguracaoSync {
  /** URL base da API externa (ex.: https://meu-sistema.com/api). */
  urlBase: string;
  /** Chave de autenticação enviada no header X-Api-Key. */
  apiKey: string;
  /** ISO timestamp da última sincronização bem-sucedida. */
  ultimaSincronizacao?: string;
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

/**
 * Prato fixo por dia/refeição/categoria: o gerador sempre coloca este prato
 * na primeira posição daquele slot, independente da aleatoriedade.
 */
export interface PratoFixoCliente {
  /** Dia do combinado; ignorado quando `todosOsDias` é true. */
  diaId: DiaSemana;
  /** Vale para todos os dias de operação (ex.: fórmula/leite no café). */
  todosOsDias?: boolean;
  tipoRefeicaoId: string;
  categoria: CategoriaPrato;
  pratoId: string;
  pratoNome: string;
  /** Turmas em que vale; ausente ou vazio = todas as turmas (e o cliente sem turmas). */
  turmaIds?: string[];
}

/** Cliente e suas particularidades. */
export interface Cliente {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  responsavel?: string;
  registroProfissional?: string;
  logo?: string;
  cidade?: string;
  uf: string; // padrão 'PR'
  /** Dias em que há operação (ex.: [1,2,3,4,5] = seg a sex). */
  diasOperacao: DiaSemana[];
  /** Refeições servidas em cada dia de operação. */
  refeicoes: RefeicaoConfig[];
  /** Restrições/preferências globais do cliente (ex.: 'sem_gluten'). */
  restricoes: string[];
  /**
   * Palavras-chave que excluem pratos do cardápio deste cliente.
   * Ex.: ['suína', 'porco', 'bacon'] excluirá qualquer prato cujo nome contenha
   * qualquer um desses termos.
   */
  exclusoes?: string[];
  /** Pratos acordados (fixos) para slots específicos de dia/refeição/categoria. */
  pratosFixos?: PratoFixoCliente[];
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
  /** Trocado à mão depois de gerado: destacado na tela (não na impressão). */
  alteradoManualmente?: boolean;
}

/**
 * Período em que o cliente não funciona (feriado, recesso, férias...). Nesses
 * dias o cardápio não é gerado e a folha das famílias mostra o motivo.
 */
export interface PeriodoSemFuncionamento {
  id: string;
  clienteId: string;
  /** Datas ISO (AAAA-MM-DD), inclusivas; num dia só, inicio === fim. */
  inicio: string;
  fim: string;
  /** Texto que vai para as famílias, ex.: "FERIADO", "RECESSO". */
  motivo: string;
  /** Detalhe interno, ex.: "Tiradentes". */
  descricao?: string;
}

/** Rascunho ainda pode mudar e não vai para as famílias; ausente = concluído. */
export type StatusCardapio = 'rascunho' | 'concluido';

/** Cardápio gerado para um cliente (ou uma turma do cliente) numa semana. */
/**
 * Aviso que marca o dia no cardápio, como vem da planilha (ex.: "FERIADO",
 * "RECESSO"). Para muitas famílias o cardápio é onde descobrem que não haverá aula.
 */
export interface AvisoDia {
  dia: DiaSemana;
  texto: string;
}

export interface Cardapio {
  id: string;
  clienteId: string;
  /** Presente quando o cardápio é de uma turma específica do cliente. */
  turmaId?: string;
  /** Data (ISO) da segunda-feira de referência da semana. */
  semanaInicio: string;
  itens: ItemCardapio[];
  /** Específicos das datas desta semana — não acompanham cópias para outras semanas. */
  avisos?: AvisoDia[];
  status?: StatusCardapio;
  geradoEm: string;
}

export type TipoVisita = 'auditoria' | 'orientacao' | 'retorno' | 'outro';

export const TIPOS_VISITA: { valor: TipoVisita; nome: string }[] = [
  { valor: 'auditoria', nome: 'Auditoria' },
  { valor: 'orientacao', nome: 'Orientação' },
  { valor: 'retorno', nome: 'Retorno' },
  { valor: 'outro', nome: 'Outro' },
];

export interface ItemVisita {
  id: string;
  descricao: string;
  status: 'conforme' | 'nao_conforme';
}

export interface SecaoVisita {
  id: string;
  nome: string;
  itens: ItemVisita[];
}

export interface Visita {
  id: string;
  clienteId: string;
  profissionalId?: string;
  data: string; // YYYY-MM-DD
  hora?: string; // ex: "até 16:03h"
  consultor: string;
  emailConsultor?: string;
  tipo: TipoVisita;
  observacoes: string; // objetivo / observações gerais
  secoes: SecaoVisita[];
  proximaVisita?: string; // YYYY-MM-DD
  relatorioId?: string;
  assinaturas?: AssinaturasRelatorio;
  criadoEm: string;
}

export type StatusAcao = 'pendente' | 'em_andamento' | 'concluido';

/** De onde veio a não conformidade que a ação corrige. */
export type OrigemAcao = 'checklist' | 'visita' | 'manual';

/** Uma ação corretiva vinculada a um item não conforme (checklist ou visita). */
export interface AcaoCorretiva {
  itemId: string;
  itemTexto: string;
  acao: string;
  responsavel: string;
  prazo: string; // YYYY-MM-DD
  status: StatusAcao;
  observacao?: string;
  /** Ausente nas ações antigas: 'manual-…' = manual, o resto = checklist. */
  origem?: OrigemAcao;
  /** Checklist ou visita em que a não conformidade foi registrada. */
  origemId?: string;
  /** Data (ISO) do checklist ou da visita de origem. */
  origemData?: string;
  /** Quando o item voltou a constar como conforme (ISO), concluindo a ação. */
  resolvidoEm?: string;
}

/** Plano de ação gerado a partir das não conformidades do relatório. */
export interface PlanoAcao {
  id: string;
  clienteId: string;
  relatorioId: string;
  acoes: AcaoCorretiva[];
  criadoEm: string;
  atualizadoEm: string;
}

/** Profissional de nutrição/consultoria. */
export interface Profissional {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  registroCRN?: string;
  especialidade?: string;
  empresa?: string;
  cargo?: string;
  logoEmpresa?: string;   // base64 data URL
  assinatura?: string;    // base64 data URL (PNG)
  criadoEm: string;
}

/** Relatório de segurança dos alimentos salvo para um cliente. */
/**
 * Como o relatório é assinado: com a assinatura cadastrada do profissional,
 * desenhada na tela (celular/tablet) ou em branco, para assinar no papel.
 */
export type ModoAssinatura = 'padrao' | 'tela' | 'papel';

/** Assinaturas de um relatório (checklist ou visita). */
export interface AssinaturasRelatorio {
  modo?: ModoAssinatura;
  /** Imagem (data URL PNG) desenhada na tela, quando modo = 'tela'. */
  imagemTela?: string;
  /** Quem acompanhou pelo estabelecimento. */
  responsavelLocal?: string;
  responsavelCargo?: string;
  /** Assinatura do responsável do estabelecimento, desenhada na tela. */
  imagemResponsavel?: string;
}

/** Dados de cabeçalho do checklist, no mesmo padrão do relatório de visita. */
export interface CabecalhoChecklist {
  hora?: string;
  tipo?: TipoVisita;
  emailConsultor?: string;
  objetivo?: string;
  proximaAvaliacao?: string;
  assinaturas?: AssinaturasRelatorio;
}

export interface Relatorio {
  id: string;
  clienteId: string;
  profissionalId?: string;
  avaliador: string;
  registroCRN: string;
  ehCei: boolean;
  /** Data ISO (YYYY-MM-DD) da avaliação. */
  dataAvaliacao: string;
  /** Mapa itemId → situação ('conforme' | 'nao_conforme' | 'na' | ''). */
  respostas: Record<string, string>;
  /** Mapa itemId → texto de observação. */
  observacoes: Record<string, string>;
  cabecalho?: CabecalhoChecklist;
  geradoEm: string;
  atualizadoEm: string;
}
