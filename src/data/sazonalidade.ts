// Calendário de safra brasileiro por região climática.
// Meses (1-12) correspondem ao pico de oferta/qualidade na região.
// Baseado em: CEAGESP, EMBRAPA, CONAB e literatura agronômica.

export type RegiaoClimatica = 'sul' | 'sudeste' | 'centro-oeste' | 'nordeste' | 'norte';
export type CategoriaSazonal = 'fruta' | 'verdura' | 'legume' | 'raiz';

/** Mapeia UF para região climática. */
export const UF_PARA_REGIAO: Record<string, RegiaoClimatica> = {
  PR: 'sul', RS: 'sul', SC: 'sul',
  SP: 'sudeste', RJ: 'sudeste', MG: 'sudeste', ES: 'sudeste',
  GO: 'centro-oeste', MT: 'centro-oeste', MS: 'centro-oeste', DF: 'centro-oeste',
  BA: 'nordeste', CE: 'nordeste', AL: 'nordeste', SE: 'nordeste',
  PB: 'nordeste', PE: 'nordeste', RN: 'nordeste', MA: 'nordeste', PI: 'nordeste',
  AM: 'norte', PA: 'norte', AC: 'norte', RO: 'norte', RR: 'norte', AP: 'norte', TO: 'norte',
};

export const NOME_REGIAO: Record<RegiaoClimatica, string> = {
  sul: 'Sul',
  sudeste: 'Sudeste',
  'centro-oeste': 'Centro-Oeste',
  nordeste: 'Nordeste',
  norte: 'Norte',
};

export interface ItemSazonal {
  id: string;
  nome: string;
  categoria: CategoriaSazonal;
  /** Palavras para cruzar com o nome de pratos (busca case-insensitive). */
  palavrasChave: string[];
  /** Meses de pico por região climática (1 = jan … 12 = dez). */
  meses: Partial<Record<RegiaoClimatica, number[]>>;
}

export const SAZONALIDADE: ItemSazonal[] = [
  // ── Frutas ───────────────────────────────────────────────────────────────
  {
    id: 'sz-01', nome: 'Morango', categoria: 'fruta',
    palavrasChave: ['morango'],
    meses: { sul: [5,6,7,8,9], sudeste: [5,6,7,8,9], 'centro-oeste': [5,6,7,8], nordeste: [5,6,7], norte: [5,6,7,8] },
  },
  {
    id: 'sz-02', nome: 'Manga', categoria: 'fruta',
    palavrasChave: ['manga'],
    meses: { sul: [11,12,1,2], sudeste: [11,12,1,2], 'centro-oeste': [10,11,12,1], nordeste: [9,10,11,12,1], norte: [9,10,11,12] },
  },
  {
    id: 'sz-03', nome: 'Melancia', categoria: 'fruta',
    palavrasChave: ['melancia'],
    meses: { sul: [12,1,2,3], sudeste: [11,12,1,2], 'centro-oeste': [10,11,12,1], nordeste: [12,1,2,3], norte: [1,2,3,4] },
  },
  {
    id: 'sz-04', nome: 'Melão', categoria: 'fruta',
    palavrasChave: ['melão', 'melao'],
    meses: { sul: [12,1,2,3], sudeste: [11,12,1,2], 'centro-oeste': [11,12,1], nordeste: [6,7,8,9,10], norte: [12,1,2,3] },
  },
  {
    id: 'sz-05', nome: 'Goiaba', categoria: 'fruta',
    palavrasChave: ['goiaba'],
    meses: { sul: [2,3,4,5], sudeste: [2,3,4,5], 'centro-oeste': [3,4,5,6], nordeste: [2,3,4,5,6], norte: [2,3,4,5] },
  },
  {
    id: 'sz-06', nome: 'Laranja', categoria: 'fruta',
    palavrasChave: ['laranja'],
    meses: { sul: [5,6,7,8,9,10], sudeste: [4,5,6,7,8,9,10], 'centro-oeste': [5,6,7,8,9], nordeste: [4,5,6,7,8,9], norte: [5,6,7,8,9] },
  },
  {
    id: 'sz-07', nome: 'Abacaxi', categoria: 'fruta',
    palavrasChave: ['abacaxi'],
    meses: { sul: [11,12,1,2,3], sudeste: [10,11,12,1,2], 'centro-oeste': [10,11,12,1,2], nordeste: [9,10,11,12,1], norte: [8,9,10,11,12] },
  },
  {
    id: 'sz-08', nome: 'Uva', categoria: 'fruta',
    palavrasChave: ['uva'],
    meses: { sul: [1,2,3], sudeste: [11,12,1,2], 'centro-oeste': [10,11,12,1], nordeste: [5,6,7,8], norte: [] },
  },
  {
    id: 'sz-09', nome: 'Pêssego', categoria: 'fruta',
    palavrasChave: ['pêssego', 'pessego'],
    meses: { sul: [12,1,2,3], sudeste: [11,12,1,2], 'centro-oeste': [11,12,1] },
  },
  {
    id: 'sz-10', nome: 'Maçã', categoria: 'fruta',
    palavrasChave: ['maçã', 'maca'],
    meses: { sul: [1,2,3,4,5], sudeste: [1,2,3,4], 'centro-oeste': [1,2,3,4] },
  },
  {
    id: 'sz-11', nome: 'Mamão', categoria: 'fruta',
    palavrasChave: ['mamão', 'mamao'],
    meses: { sul: [12,1,2,3], sudeste: [11,12,1,2], 'centro-oeste': [11,12,1,2], nordeste: [10,11,12,1], norte: [10,11,12,1] },
  },
  {
    id: 'sz-12', nome: 'Abacate', categoria: 'fruta',
    palavrasChave: ['abacate'],
    meses: { sul: [7,8,9,10,11], sudeste: [6,7,8,9,10], 'centro-oeste': [6,7,8,9,10], nordeste: [5,6,7,8,9], norte: [5,6,7,8,9] },
  },
  {
    id: 'sz-13', nome: 'Caju', categoria: 'fruta',
    palavrasChave: ['caju'],
    meses: { 'centro-oeste': [9,10,11,12], nordeste: [8,9,10,11,12], norte: [9,10,11,12,1] },
  },
  {
    id: 'sz-14', nome: 'Açaí', categoria: 'fruta',
    palavrasChave: ['açaí', 'acai'],
    meses: { nordeste: [1,2,3,4,5], norte: [12,1,2,3,4,5] },
  },
  {
    id: 'sz-15', nome: 'Ameixa', categoria: 'fruta',
    palavrasChave: ['ameixa'],
    meses: { sul: [12,1,2,3], sudeste: [12,1,2] },
  },
  {
    id: 'sz-16', nome: 'Banana', categoria: 'fruta',
    palavrasChave: ['banana'],
    meses: {
      sul: [1,2,3,4,5,6,7,8,9,10,11,12],
      sudeste: [1,2,3,4,5,6,7,8,9,10,11,12],
      'centro-oeste': [1,2,3,4,5,6,7,8,9,10,11,12],
      nordeste: [1,2,3,4,5,6,7,8,9,10,11,12],
      norte: [1,2,3,4,5,6,7,8,9,10,11,12],
    },
  },
  {
    id: 'sz-17', nome: 'Limão', categoria: 'fruta',
    palavrasChave: ['limão', 'limao'],
    meses: { sul: [5,6,7,8,9,10], sudeste: [5,6,7,8,9,10], 'centro-oeste': [5,6,7,8,9], nordeste: [5,6,7,8,9,10], norte: [5,6,7,8,9] },
  },
  {
    id: 'sz-18', nome: 'Tangerina / Mexerica', categoria: 'fruta',
    palavrasChave: ['tangerina', 'mexerica', 'ponkan', 'bergamota'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8,9], 'centro-oeste': [5,6,7,8], nordeste: [4,5,6,7,8], norte: [5,6,7,8] },
  },

  // ── Verduras e folhas ─────────────────────────────────────────────────────
  {
    id: 'sz-19', nome: 'Alface', categoria: 'verdura',
    palavrasChave: ['alface'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8,9], 'centro-oeste': [4,5,6,7,8], nordeste: [5,6,7,8], norte: [5,6,7,8] },
  },
  {
    id: 'sz-20', nome: 'Espinafre', categoria: 'verdura',
    palavrasChave: ['espinafre'],
    meses: { sul: [5,6,7,8,9], sudeste: [5,6,7,8], 'centro-oeste': [4,5,6,7,8], nordeste: [5,6,7,8], norte: [5,6,7,8] },
  },
  {
    id: 'sz-21', nome: 'Brócolis', categoria: 'verdura',
    palavrasChave: ['brócolis', 'brocolis', 'brócoli'],
    meses: { sul: [5,6,7,8,9], sudeste: [5,6,7,8], 'centro-oeste': [5,6,7,8], nordeste: [5,6,7] },
  },
  {
    id: 'sz-22', nome: 'Couve-flor', categoria: 'verdura',
    palavrasChave: ['couve-flor', 'couveflor'],
    meses: { sul: [5,6,7,8,9], sudeste: [5,6,7,8], 'centro-oeste': [5,6,7,8], nordeste: [5,6,7] },
  },
  {
    id: 'sz-23', nome: 'Couve', categoria: 'verdura',
    palavrasChave: ['couve'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8], 'centro-oeste': [4,5,6,7,8], nordeste: [4,5,6,7,8], norte: [4,5,6,7,8] },
  },
  {
    id: 'sz-24', nome: 'Repolho', categoria: 'verdura',
    palavrasChave: ['repolho'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8], 'centro-oeste': [4,5,6,7,8], nordeste: [5,6,7,8] },
  },
  {
    id: 'sz-25', nome: 'Acelga', categoria: 'verdura',
    palavrasChave: ['acelga'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8], 'centro-oeste': [4,5,6,7,8], nordeste: [5,6,7,8] },
  },

  // ── Legumes ───────────────────────────────────────────────────────────────
  {
    id: 'sz-26', nome: 'Tomate', categoria: 'legume',
    palavrasChave: ['tomate'],
    meses: { sul: [12,1,2,3,4], sudeste: [11,12,1,2,3], 'centro-oeste': [10,11,12,1,2], nordeste: [8,9,10,11,12,1], norte: [9,10,11,12] },
  },
  {
    id: 'sz-27', nome: 'Cenoura', categoria: 'legume',
    palavrasChave: ['cenoura'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [5,6,7,8,9], 'centro-oeste': [5,6,7,8], nordeste: [5,6,7,8,9] },
  },
  {
    id: 'sz-28', nome: 'Beterraba', categoria: 'legume',
    palavrasChave: ['beterraba'],
    meses: { sul: [3,4,5,6,7,8], sudeste: [3,4,5,6,7,8], 'centro-oeste': [3,4,5,6,7], nordeste: [4,5,6,7,8], norte: [4,5,6,7,8] },
  },
  {
    id: 'sz-29', nome: 'Milho verde', categoria: 'legume',
    palavrasChave: ['milho'],
    meses: { sul: [1,2,3], sudeste: [12,1,2], 'centro-oeste': [12,1,2], nordeste: [3,4,5,6], norte: [2,3,4,5] },
  },
  {
    id: 'sz-30', nome: 'Pimentão', categoria: 'legume',
    palavrasChave: ['pimentão', 'pimentao'],
    meses: { sul: [12,1,2,3], sudeste: [11,12,1,2], 'centro-oeste': [11,12,1,2], nordeste: [9,10,11,12], norte: [10,11,12,1] },
  },
  {
    id: 'sz-31', nome: 'Pepino', categoria: 'legume',
    palavrasChave: ['pepino'],
    meses: { sul: [11,12,1,2,3], sudeste: [11,12,1,2], 'centro-oeste': [11,12,1,2], nordeste: [11,12,1,2], norte: [11,12,1,2] },
  },
  {
    id: 'sz-32', nome: 'Chuchu', categoria: 'legume',
    palavrasChave: ['chuchu'],
    meses: { sul: [3,4,5,6,7], sudeste: [2,3,4,5,6], 'centro-oeste': [2,3,4,5,6], nordeste: [2,3,4,5], norte: [2,3,4,5] },
  },
  {
    id: 'sz-33', nome: 'Abobrinha', categoria: 'legume',
    palavrasChave: ['abobrinha'],
    meses: { sul: [11,12,1,2,3], sudeste: [11,12,1,2], 'centro-oeste': [10,11,12,1,2], nordeste: [10,11,12,1], norte: [11,12,1,2] },
  },
  {
    id: 'sz-34', nome: 'Abóbora', categoria: 'legume',
    palavrasChave: ['abóbora', 'abobora', 'jerimum'],
    meses: { sul: [2,3,4,5], sudeste: [1,2,3,4], 'centro-oeste': [1,2,3,4], nordeste: [3,4,5,6], norte: [2,3,4,5] },
  },
  {
    id: 'sz-35', nome: 'Berinjela', categoria: 'legume',
    palavrasChave: ['berinjela'],
    meses: { sul: [12,1,2,3,4], sudeste: [12,1,2,3], 'centro-oeste': [11,12,1,2], nordeste: [10,11,12,1], norte: [10,11,12,1] },
  },
  {
    id: 'sz-36', nome: 'Quiabo', categoria: 'legume',
    palavrasChave: ['quiabo'],
    meses: { sul: [12,1,2,3], sudeste: [12,1,2,3], 'centro-oeste': [11,12,1,2], nordeste: [10,11,12,1], norte: [10,11,12,1,2] },
  },
  {
    id: 'sz-37', nome: 'Maxixe', categoria: 'legume',
    palavrasChave: ['maxixe'],
    meses: { sudeste: [12,1,2,3], 'centro-oeste': [12,1,2,3], nordeste: [10,11,12,1], norte: [10,11,12,1,2] },
  },
  {
    id: 'sz-38', nome: 'Jiló', categoria: 'legume',
    palavrasChave: ['jiló', 'jilo'],
    meses: { sudeste: [12,1,2,3], 'centro-oeste': [12,1,2,3], nordeste: [10,11,12,1,2], norte: [10,11,12,1,2] },
  },

  // ── Raízes e tubérculos ───────────────────────────────────────────────────
  {
    id: 'sz-39', nome: 'Batata', categoria: 'raiz',
    palavrasChave: ['batata'],
    meses: { sul: [12,1,2,3,4], sudeste: [11,12,1,2,3], 'centro-oeste': [10,11,12,1,2], nordeste: [6,7,8,9] },
  },
  {
    id: 'sz-40', nome: 'Batata-doce', categoria: 'raiz',
    palavrasChave: ['batata-doce', 'batata doce'],
    meses: { sul: [3,4,5,6], sudeste: [2,3,4,5], 'centro-oeste': [2,3,4,5], nordeste: [2,3,4,5,6], norte: [2,3,4,5] },
  },
  {
    id: 'sz-41', nome: 'Mandioca / Aipim', categoria: 'raiz',
    palavrasChave: ['mandioca', 'aipim', 'macaxeira'],
    meses: {
      sul: [1,2,3,4,5,6,7,8,9,10,11,12],
      sudeste: [1,2,3,4,5,6,7,8,9,10,11,12],
      'centro-oeste': [1,2,3,4,5,6,7,8,9,10,11,12],
      nordeste: [1,2,3,4,5,6,7,8,9,10,11,12],
      norte: [1,2,3,4,5,6,7,8,9,10,11,12],
    },
  },
  {
    id: 'sz-42', nome: 'Inhame', categoria: 'raiz',
    palavrasChave: ['inhame'],
    meses: { sul: [4,5,6,7,8], sudeste: [3,4,5,6,7], 'centro-oeste': [3,4,5,6,7], nordeste: [3,4,5,6,7,8], norte: [2,3,4,5,6,7] },
  },
];

/** Retorna os itens em safra para um mês e região. */
export function itensEmSafra(mes: number, regiao: RegiaoClimatica): ItemSazonal[] {
  return SAZONALIDADE.filter((item) => (item.meses[regiao] ?? []).includes(mes));
}

/** Verifica se um prato (por nome) bate com algum item sazonal atual. */
export function pratoEhSazonal(
  pratoNome: string,
  prataTags: string[],
  mes: number,
  regiao: RegiaoClimatica,
): boolean {
  const sazonais = itensEmSafra(mes, regiao);
  const texto = (pratoNome + ' ' + prataTags.join(' ')).toLowerCase();
  return sazonais.some((s) => s.palavrasChave.some((k) => texto.includes(k)));
}

export const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
