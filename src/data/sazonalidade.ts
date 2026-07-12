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
  {
    id: 'sz-43', nome: 'Kiwi', categoria: 'fruta',
    palavrasChave: ['kiwi'],
    meses: { sul: [3,4,5,6,7], sudeste: [4,5,6,7] },
  },
  {
    id: 'sz-44', nome: 'Maracujá', categoria: 'fruta',
    palavrasChave: ['maracujá', 'maracuja'],
    meses: { sul: [1,2,3,11,12], sudeste: [1,2,3,11,12], 'centro-oeste': [10,11,12,1,2], nordeste: [3,4,5,6], norte: [1,2,3,4,5] },
  },
  {
    id: 'sz-45', nome: 'Acerola', categoria: 'fruta',
    palavrasChave: ['acerola'],
    meses: { sul: [11,12,1,2], sudeste: [11,12,1,2], 'centro-oeste': [11,12,1,2,3], nordeste: [1,2,3,10,11,12], norte: [11,12,1,2,3] },
  },
  {
    id: 'sz-46', nome: 'Pitanga', categoria: 'fruta',
    palavrasChave: ['pitanga'],
    meses: { sul: [10,11,12], sudeste: [9,10,11], 'centro-oeste': [9,10,11], nordeste: [9,10,11,12] },
  },
  {
    id: 'sz-47', nome: 'Carambola', categoria: 'fruta',
    palavrasChave: ['carambola'],
    meses: { sudeste: [9,10,11,12], 'centro-oeste': [9,10,11,12], nordeste: [9,10,11,12,1], norte: [9,10,11,12] },
  },
  {
    id: 'sz-48', nome: 'Figo', categoria: 'fruta',
    palavrasChave: ['figo'],
    meses: { sul: [1,2,3], sudeste: [12,1,2,3], 'centro-oeste': [12,1,2] },
  },
  {
    id: 'sz-49', nome: 'Caqui', categoria: 'fruta',
    palavrasChave: ['caqui'],
    meses: { sul: [3,4,5,6], sudeste: [3,4,5,6], 'centro-oeste': [4,5,6] },
  },
  {
    id: 'sz-50', nome: 'Graviola', categoria: 'fruta',
    palavrasChave: ['graviola'],
    meses: { sudeste: [11,12,1,2], 'centro-oeste': [10,11,12,1,2], nordeste: [11,12,1,2,3], norte: [11,12,1,2,3,4] },
  },
  {
    id: 'sz-51', nome: 'Cupuaçu', categoria: 'fruta',
    palavrasChave: ['cupuaçu', 'cupuacu'],
    meses: { 'centro-oeste': [1,2,3,4], norte: [1,2,3,4,5] },
  },
  {
    id: 'sz-52', nome: 'Cajá', categoria: 'fruta',
    palavrasChave: ['cajá', 'caja', 'taperebá'],
    meses: { 'centro-oeste': [11,12,1,2], nordeste: [11,12,1,2,3], norte: [11,12,1,2,3] },
  },
  {
    id: 'sz-53', nome: 'Amora', categoria: 'fruta',
    palavrasChave: ['amora'],
    meses: { sul: [11,12,1,2], sudeste: [11,12,1] },
  },
  {
    id: 'sz-54', nome: 'Pera', categoria: 'fruta',
    palavrasChave: ['pera'],
    meses: { sul: [1,2,3,4], sudeste: [1,2,3] },
  },
  {
    id: 'sz-55', nome: 'Romã', categoria: 'fruta',
    palavrasChave: ['romã', 'roma'],
    meses: { sul: [2,3,4,5], sudeste: [2,3,4,5], 'centro-oeste': [3,4,5] },
  },
  {
    id: 'sz-68', nome: 'Framboesa', categoria: 'fruta',
    palavrasChave: ['framboesa'],
    meses: { sul: [12,1,2,3], sudeste: [12,1,2] },
  },
  {
    id: 'sz-69', nome: 'Mirtilo', categoria: 'fruta',
    palavrasChave: ['mirtilo', 'blueberry'],
    meses: { sul: [10,11,12,1], sudeste: [10,11,12] },
  },
  {
    id: 'sz-70', nome: 'Jabuticaba', categoria: 'fruta',
    palavrasChave: ['jabuticaba'],
    meses: { sul: [10,11,12], sudeste: [9,10,11,12], 'centro-oeste': [9,10,11] },
  },
  {
    id: 'sz-71', nome: 'Fruta-do-conde / Pinha', categoria: 'fruta',
    palavrasChave: ['fruta-do-conde', 'pinha', 'fruta do conde', 'ata'],
    meses: { sudeste: [1,2,3,4], 'centro-oeste': [1,2,3,4], nordeste: [12,1,2,3,4], norte: [11,12,1,2,3] },
  },
  {
    id: 'sz-72', nome: 'Jaca', categoria: 'fruta',
    palavrasChave: ['jaca'],
    meses: { sul: [11,12,1], sudeste: [11,12,1,2], 'centro-oeste': [10,11,12,1], nordeste: [10,11,12,1], norte: [10,11,12,1,2] },
  },
  {
    id: 'sz-73', nome: 'Pitaya', categoria: 'fruta',
    palavrasChave: ['pitaya', 'pitaia'],
    meses: { sudeste: [12,1,2,3], 'centro-oeste': [11,12,1,2,3], nordeste: [11,12,1,2,3], norte: [11,12,1,2] },
  },
  {
    id: 'sz-74', nome: 'Siriguela', categoria: 'fruta',
    palavrasChave: ['siriguela', 'ceriguela'],
    meses: { 'centro-oeste': [9,10,11,12], nordeste: [9,10,11,12,1], norte: [8,9,10,11] },
  },
  {
    id: 'sz-75', nome: 'Umbu', categoria: 'fruta',
    palavrasChave: ['umbu', 'imbu'],
    meses: { nordeste: [1,2,3,4] },
  },
  {
    id: 'sz-76', nome: 'Tamarindo', categoria: 'fruta',
    palavrasChave: ['tamarindo'],
    meses: { 'centro-oeste': [6,7,8,9], nordeste: [6,7,8,9,10], norte: [6,7,8,9] },
  },
  {
    id: 'sz-77', nome: 'Coco', categoria: 'fruta',
    palavrasChave: ['coco'],
    meses: {
      sul: [1,2,3,4,5,6,7,8,9,10,11,12],
      sudeste: [1,2,3,4,5,6,7,8,9,10,11,12],
      'centro-oeste': [1,2,3,4,5,6,7,8,9,10,11,12],
      nordeste: [1,2,3,4,5,6,7,8,9,10,11,12],
      norte: [1,2,3,4,5,6,7,8,9,10,11,12],
    },
  },
  {
    id: 'sz-78', nome: 'Mangaba', categoria: 'fruta',
    palavrasChave: ['mangaba'],
    meses: { 'centro-oeste': [1,2,3,4,11,12], nordeste: [12,1,2,3,4,5], norte: [1,2,3,4,5] },
  },
  {
    id: 'sz-79', nome: 'Sapoti', categoria: 'fruta',
    palavrasChave: ['sapoti', 'sapota'],
    meses: { nordeste: [3,4,5,6,7,8], norte: [3,4,5,6,7] },
  },
  {
    id: 'sz-80', nome: 'Pequi', categoria: 'fruta',
    palavrasChave: ['pequi'],
    meses: { 'centro-oeste': [11,12,1,2], norte: [11,12,1,2,3] },
  },
  {
    id: 'sz-81', nome: 'Lichia', categoria: 'fruta',
    palavrasChave: ['lichia', 'lychee'],
    meses: { sul: [12,1,2], sudeste: [12,1,2], 'centro-oeste': [11,12,1] },
  },
  {
    id: 'sz-82', nome: 'Buriti', categoria: 'fruta',
    palavrasChave: ['buriti'],
    meses: { 'centro-oeste': [3,4,5,6], norte: [3,4,5,6,7] },
  },

  // ── Verduras e folhas ─────────────────────────────────────────────────────
  {
    id: 'sz-56', nome: 'Rúcula', categoria: 'verdura',
    palavrasChave: ['rúcula', 'rucula'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8,9], 'centro-oeste': [4,5,6,7,8], nordeste: [5,6,7,8] },
  },
  {
    id: 'sz-57', nome: 'Agrião', categoria: 'verdura',
    palavrasChave: ['agrião', 'agriao'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8,9], 'centro-oeste': [4,5,6,7,8], nordeste: [5,6,7,8] },
  },
  {
    id: 'sz-58', nome: 'Chicória / Endívia', categoria: 'verdura',
    palavrasChave: ['chicória', 'chicoria', 'endívia', 'endivia'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8], 'centro-oeste': [4,5,6,7,8] },
  },
  {
    id: 'sz-59', nome: 'Salsão / Aipo', categoria: 'verdura',
    palavrasChave: ['salsão', 'salsao', 'aipo'],
    meses: { sul: [5,6,7,8,9], sudeste: [5,6,7,8,9], 'centro-oeste': [5,6,7,8] },
  },
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
  {
    id: 'sz-83', nome: 'Almeirão', categoria: 'verdura',
    palavrasChave: ['almeirão', 'almeirao'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8,9], 'centro-oeste': [4,5,6,7,8], nordeste: [5,6,7,8] },
  },
  {
    id: 'sz-84', nome: 'Ora-pro-nóbis', categoria: 'verdura',
    palavrasChave: ['ora-pro-nobis', 'ora pro nobis'],
    meses: { sudeste: [9,10,11,12,1,2,3], 'centro-oeste': [9,10,11,12,1,2,3] },
  },
  {
    id: 'sz-85', nome: 'Taioba', categoria: 'verdura',
    palavrasChave: ['taioba'],
    meses: { sudeste: [11,12,1,2,3,4], 'centro-oeste': [11,12,1,2,3] },
  },
  {
    id: 'sz-86', nome: 'Mostarda', categoria: 'verdura',
    palavrasChave: ['mostarda'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8,9], 'centro-oeste': [4,5,6,7,8] },
  },
  {
    id: 'sz-87', nome: 'Catalonha', categoria: 'verdura',
    palavrasChave: ['catalonha', 'catalônia'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8,9], 'centro-oeste': [4,5,6,7,8] },
  },
  {
    id: 'sz-88', nome: 'Nirá', categoria: 'verdura',
    palavrasChave: ['nirá', 'nira', 'cebolinha japonesa'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8,9], 'centro-oeste': [4,5,6,7,8] },
  },

  // ── Legumes ───────────────────────────────────────────────────────────────
  {
    id: 'sz-60', nome: 'Vagem', categoria: 'legume',
    palavrasChave: ['vagem'],
    meses: { sul: [11,12,1,2,3], sudeste: [11,12,1,2], 'centro-oeste': [10,11,12,1,2], nordeste: [9,10,11,12,1], norte: [10,11,12,1,2] },
  },
  {
    id: 'sz-61', nome: 'Ervilha', categoria: 'legume',
    palavrasChave: ['ervilha'],
    meses: { sul: [5,6,7,8,9], sudeste: [4,5,6,7,8], 'centro-oeste': [4,5,6,7,8], nordeste: [5,6,7] },
  },
  {
    id: 'sz-62', nome: 'Aspargo', categoria: 'legume',
    palavrasChave: ['aspargo', 'aspargos'],
    meses: { sul: [9,10,11,12], sudeste: [9,10,11,12], 'centro-oeste': [9,10,11] },
  },
  {
    id: 'sz-63', nome: 'Rabanete', categoria: 'legume',
    palavrasChave: ['rabanete'],
    meses: { sul: [5,6,7,8,9], sudeste: [4,5,6,7,8,9], 'centro-oeste': [4,5,6,7,8], nordeste: [5,6,7,8] },
  },
  {
    id: 'sz-64', nome: 'Nabo', categoria: 'legume',
    palavrasChave: ['nabo'],
    meses: { sul: [4,5,6,7,8], sudeste: [4,5,6,7,8], 'centro-oeste': [5,6,7,8] },
  },
  {
    id: 'sz-65', nome: 'Cebola', categoria: 'legume',
    palavrasChave: ['cebola'],
    meses: { sul: [1,2,3,4], sudeste: [12,1,2,3], 'centro-oeste': [11,12,1,2,3], nordeste: [6,7,8,9,10] },
  },
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
  {
    id: 'sz-89', nome: 'Alcachofra', categoria: 'legume',
    palavrasChave: ['alcachofra'],
    meses: { sul: [7,8,9,10], sudeste: [7,8,9,10], 'centro-oeste': [8,9,10] },
  },
  {
    id: 'sz-90', nome: 'Broto de feijão', categoria: 'legume',
    palavrasChave: ['broto de feijão', 'broto de feijao', 'moyashi', 'broto'],
    meses: {
      sul: [1,2,3,4,5,6,7,8,9,10,11,12],
      sudeste: [1,2,3,4,5,6,7,8,9,10,11,12],
      'centro-oeste': [1,2,3,4,5,6,7,8,9,10,11,12],
      nordeste: [1,2,3,4,5,6,7,8,9,10,11,12],
      norte: [1,2,3,4,5,6,7,8,9,10,11,12],
    },
  },
  {
    id: 'sz-91', nome: 'Pimenta', categoria: 'legume',
    palavrasChave: ['pimenta', 'dedo-de-moça', 'malagueta', 'pimentinha'],
    meses: { sul: [1,2,3,12], sudeste: [11,12,1,2,3], 'centro-oeste': [11,12,1,2,3], nordeste: [9,10,11,12,1], norte: [9,10,11,12] },
  },
  {
    id: 'sz-92', nome: 'Alho-poró', categoria: 'legume',
    palavrasChave: ['alho-poró', 'alho poro', 'porro'],
    meses: { sul: [5,6,7,8,9], sudeste: [5,6,7,8,9], 'centro-oeste': [5,6,7,8] },
  },
  {
    id: 'sz-93', nome: 'Erva-doce / Funcho', categoria: 'legume',
    palavrasChave: ['erva-doce', 'funcho', 'erva doce'],
    meses: { sul: [5,6,7,8,9], sudeste: [5,6,7,8,9], 'centro-oeste': [5,6,7,8] },
  },

  // ── Raízes e tubérculos ───────────────────────────────────────────────────
  {
    id: 'sz-66', nome: 'Cará', categoria: 'raiz',
    palavrasChave: ['cará', 'cara'],
    meses: { sul: [3,4,5,6,7], sudeste: [3,4,5,6], 'centro-oeste': [2,3,4,5], nordeste: [2,3,4,5,6], norte: [2,3,4,5,6] },
  },
  {
    id: 'sz-67', nome: 'Gengibre', categoria: 'raiz',
    palavrasChave: ['gengibre'],
    meses: { sul: [8,9,10], sudeste: [8,9,10], 'centro-oeste': [8,9,10], nordeste: [7,8,9,10], norte: [7,8,9,10] },
  },
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
  {
    id: 'sz-94', nome: 'Mandioquinha / Batata-baroa', categoria: 'raiz',
    palavrasChave: ['mandioquinha', 'batata-baroa', 'batata baroa', 'batata-salsa'],
    meses: { sul: [4,5,6,7,8,9], sudeste: [4,5,6,7,8,9], 'centro-oeste': [5,6,7,8,9] },
  },
  {
    id: 'sz-95', nome: 'Bardana', categoria: 'raiz',
    palavrasChave: ['bardana'],
    meses: { sul: [5,6,7,8,9], sudeste: [5,6,7,8,9], 'centro-oeste': [6,7,8,9] },
  },
  {
    id: 'sz-96', nome: 'Alho', categoria: 'raiz',
    palavrasChave: ['alho'],
    meses: { sul: [12,1,2,3], sudeste: [11,12,1,2], 'centro-oeste': [10,11,12,1], nordeste: [6,7,8,9] },
  },
  {
    id: 'sz-97', nome: 'Amendoim', categoria: 'raiz',
    palavrasChave: ['amendoim'],
    meses: { sul: [1,2,3,4], sudeste: [1,2,3,4], 'centro-oeste': [2,3,4,5], nordeste: [2,3,4,5], norte: [1,2,3,4] },
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
