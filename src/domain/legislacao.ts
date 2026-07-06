// Base de conhecimento normativo para os relatórios de segurança dos alimentos.
//
// Referências:
//  - RDC ANVISA nº 216/2004 — Regulamento Técnico de Boas Práticas para
//    Serviços de Alimentação (norma federal base em todo o território nacional).
//  - Estado do Paraná: a RDC 216 é complementada pelas Resoluções da SESA-PR:
//      • Resolução SESA nº 0162/2005 (DOE 14/02/2005) — Norma Técnica Sanitária
//        para Centros de Educação Infantil (CEI) no Paraná. Estabelece requisitos
//        de instalações (copa, lactário, refeitório), higienização, manipulação de
//        alimentos, controle de pragas e documentação específicos para CEIs.
//      • Resolução SESA nº 465/2013 — Boas práticas no transporte de alimentos.
//      • Código de Saúde do Paraná (Lei Estadual nº 13.331/2001).
//
// Aviso: este conteúdo é um apoio operacional/educativo e não substitui a
// consulta à íntegra das normas nem a fiscalização da vigilância sanitária.

export interface ItemChecklist {
  id: string;
  texto: string;
  referencia: string; // artigo/norma
}

export interface BlocoChecklist {
  titulo: string;
  itens: ItemChecklist[];
}

export interface ReferenciaNormativa {
  sigla: string;
  titulo: string;
  ambito: 'Federal' | 'Estadual (PR)';
  url?: string;
}

export const REFERENCIAS_NORMATIVAS: ReferenciaNormativa[] = [
  {
    sigla: 'RDC nº 216/2004',
    titulo:
      'ANVISA — Regulamento Técnico de Boas Práticas para Serviços de Alimentação',
    ambito: 'Federal',
    url: 'https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2004/res0216_15_09_2004.html',
  },
  {
    sigla: 'Resolução SESA nº 0162/2005',
    titulo:
      'SESA-PR — Norma Técnica Sanitária para Centros de Educação Infantil (CEI) do Estado do Paraná',
    ambito: 'Estadual (PR)',
    url: 'https://www.saude.pr.gov.br/Pagina/Legislacao-Sanitaria-de-Alimentos',
  },
  {
    sigla: 'Resolução SESA nº 465/2013',
    titulo:
      'SESA-PR — Boas práticas no transporte de alimentos, matérias-primas, ingredientes e embalagens',
    ambito: 'Estadual (PR)',
    url: 'https://www.saude.pr.gov.br/Pagina/Legislacao-Sanitaria-de-Alimentos',
  },
  {
    sigla: 'Lei Estadual nº 13.331/2001',
    titulo: 'Código de Saúde do Estado do Paraná',
    ambito: 'Estadual (PR)',
    url: 'https://www.saude.pr.gov.br/Pagina/Legislacao-Sanitaria-de-Alimentos',
  },
];

// Checklist estruturado seguindo os capítulos da RDC 216/2004, com pontos de
// atenção específicos do Paraná onde aplicável.
export const CHECKLIST_BOAS_PRATICAS: BlocoChecklist[] = [
  {
    titulo: 'Edificação, instalações e higienização',
    itens: [
      {
        id: 'edif-1',
        texto:
          'Instalações, piso, paredes e teto conservados, íntegros e de fácil higienização.',
        referencia: 'RDC 216/2004, item 4.1',
      },
      {
        id: 'edif-2',
        texto:
          'Higienização das instalações realizada com frequência e registrada; produtos saneantes regularizados na ANVISA.',
        referencia: 'RDC 216/2004, item 4.2',
      },
      {
        id: 'edif-3',
        texto:
          'Controle integrado de vetores e pragas urbanas executado por empresa licenciada.',
        referencia: 'RDC 216/2004, item 4.3',
      },
      {
        id: 'edif-4',
        texto:
          'Abastecimento de água potável; reservatório limpo e higienizado a cada 6 meses, com registro.',
        referencia: 'RDC 216/2004, item 4.4',
      },
    ],
  },
  {
    titulo: 'Manipuladores de alimentos',
    itens: [
      {
        id: 'manip-1',
        texto:
          'Manipuladores com asseio pessoal, uniforme limpo, cabelos protegidos e sem adornos.',
        referencia: 'RDC 216/2004, item 4.6',
      },
      {
        id: 'manip-2',
        texto:
          'Lavagem correta e frequente das mãos; cartazes de orientação afixados nos lavatórios.',
        referencia: 'RDC 216/2004, item 4.6',
      },
      {
        id: 'manip-3',
        texto:
          'Capacitação periódica comprovada em higiene e Doenças Transmitidas por Alimentos (DTA).',
        referencia: 'RDC 216/2004, item 4.6',
      },
      {
        id: 'manip-4',
        texto:
          'Controle de saúde dos manipuladores; afastamento em caso de lesões ou sintomas.',
        referencia: 'RDC 216/2004, item 4.6',
      },
    ],
  },
  {
    titulo: 'Matérias-primas, ingredientes e embalagens',
    itens: [
      {
        id: 'mp-1',
        texto:
          'Recebimento inspecionado; produtos com identificação, prazo de validade e integridade verificados.',
        referencia: 'RDC 216/2004, item 4.7',
      },
      {
        id: 'mp-2',
        texto:
          'Armazenamento sobre estrados/prateleiras, afastado do piso e das paredes, com identificação.',
        referencia: 'RDC 216/2004, item 4.7',
      },
      {
        id: 'mp-3',
        texto:
          'Transporte de alimentos em condições adequadas de tempo/temperatura (conforme SESA-PR nº 465/2013).',
        referencia: 'Resolução SESA-PR nº 465/2013',
      },
    ],
  },
  {
    titulo: 'Preparação e controle de temperatura',
    itens: [
      {
        id: 'prep-1',
        texto:
          'Controle de tempo e temperatura no cozimento (mín. 70 °C no centro do alimento ou combinação equivalente).',
        referencia: 'RDC 216/2004, item 4.8',
      },
      {
        id: 'prep-2',
        texto:
          'Alimentos preparados mantidos quentes ≥ 60 °C ou resfriados/refrigerados ≤ 5 °C, com registro.',
        referencia: 'RDC 216/2004, item 4.8',
      },
      {
        id: 'prep-3',
        texto:
          'Prevenção de contaminação cruzada entre alimentos crus, semiprontos e prontos.',
        referencia: 'RDC 216/2004, item 4.8',
      },
      {
        id: 'prep-4',
        texto:
          'Descongelamento sob refrigeração ou método seguro; produto descongelado não recongelado.',
        referencia: 'RDC 216/2004, item 4.8',
      },
    ],
  },
  {
    titulo: 'Armazenamento, transporte e exposição do alimento preparado',
    itens: [
      {
        id: 'arm-1',
        texto:
          'Alimentos preparados e conservados sob refrigeração devem trazer rótulo com designação, data de preparo e prazo de validade.',
        referencia: 'RDC 216/2004, item 4.9',
      },
      {
        id: 'arm-2',
        texto:
          'Balcões de distribuição com controle de temperatura para alimentos quentes e frios; proteção contra contaminação.',
        referencia: 'RDC 216/2004, item 4.9',
      },
    ],
  },
  {
    titulo: 'Documentação e registro',
    itens: [
      {
        id: 'doc-1',
        texto:
          'Manual de Boas Práticas disponível e atualizado no estabelecimento.',
        referencia: 'RDC 216/2004, item 4.11',
      },
      {
        id: 'doc-2',
        texto:
          'Procedimentos Operacionais Padronizados (POP) implantados e acessíveis.',
        referencia: 'RDC 216/2004, item 4.11',
      },
      {
        id: 'doc-3',
        texto:
          'Responsável pelas atividades de manipulação comprovadamente capacitado (supervisão).',
        referencia: 'RDC 216/2004, item 4.10',
      },
      {
        id: 'doc-4',
        texto:
          'Licença/alvará sanitário vigente junto à vigilância sanitária municipal (Código de Saúde do PR).',
        referencia: 'Lei Estadual PR nº 13.331/2001',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Checklist específico para Centros de Educação Infantil (CEI) — Paraná
// Resolução SESA-PR nº 0162/2005 (DOE 14/02/2005)
//
// Aplicável quando o cliente é um CEI (creche, pré-escola) no Paraná.
// Complementa o checklist geral da RDC 216/2004.
// ---------------------------------------------------------------------------

export const CHECKLIST_CEI_SESA_162: BlocoChecklist[] = [
  {
    titulo: 'Instalações físicas — CEI (SESA-PR 0162/2005)',
    itens: [
      {
        id: 'cei-inst-1',
        texto:
          'Área de preparo/copa com dimensões adequadas ao número de crianças atendidas, revestida de material liso, impermeável e lavável.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-inst-2',
        texto:
          'Lactário (quando existente) separado fisicamente da copa/cozinha, com bancada exclusiva para preparo de mamadeiras e utensílios próprios.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-inst-3',
        texto:
          'Refeitório/local de refeição das crianças com mesas e cadeiras adequadas à faixa etária, de fácil higienização.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-inst-4',
        texto:
          'Lavatório de mãos com torneira sem acionamento manual (cotovelo/pedal/sensor) disponível na área de preparo e no lactário.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-inst-5',
        texto:
          'Ventilação/exaustão adequada nas áreas de preparo para evitar condensação e acúmulo de calor.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
    ],
  },
  {
    titulo: 'Lactário e preparo de fórmulas infantis — CEI (SESA-PR 0162/2005)',
    itens: [
      {
        id: 'cei-lac-1',
        texto:
          'Mamadeiras, chupetas e utensílios do lactário higienizados com escova própria, lavados com água e detergente e fervidos ou esterilizados conforme protocolo.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-lac-2',
        texto:
          'Fórmulas infantis preparadas com água potável (filtrada ou fervida) na temperatura correta; prazo de uso respeitado após abertura da embalagem.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-lac-3',
        texto:
          'Mamadeiras preparadas identificadas com nome da criança, data e hora do preparo; conservadas sob refrigeração até o momento do uso.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-lac-4',
        texto:
          'Leite e fórmulas com validade vigente; embalagens íntegras e armazenadas em local adequado (temperatura de rotulagem).',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
    ],
  },
  {
    titulo: 'Manipulação de alimentos para crianças — CEI (SESA-PR 0162/2005)',
    itens: [
      {
        id: 'cei-manip-1',
        texto:
          'Cardápio elaborado ou supervisionado por nutricionista; adequado à faixa etária (lactentes, crianças de 1 a 3 anos, pré-escolares).',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-manip-2',
        texto:
          'Alimentos preparados no dia do consumo; sobras não devolvidas ao refeitório; descarte correto de restos.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-manip-3',
        texto:
          'Frutas, legumes e verduras higienizados com solução clorada (100–200 ppm/15 min ou produto equivalente regularizado).',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-manip-4',
        texto:
          'Ausência de alimentos potencialmente alergênicos não comunicados aos responsáveis das crianças; cardápio afixado e comunicado.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
    ],
  },
  {
    titulo: 'Higienização e controle de pragas — CEI (SESA-PR 0162/2005)',
    itens: [
      {
        id: 'cei-hig-1',
        texto:
          'Higienização das áreas de preparo, utensílios e superfícies realizada antes e após cada uso; registros mantidos.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-hig-2',
        texto:
          'Lixo acondicionado em recipientes com tampa e saco plástico; retirado das áreas de preparo frequentemente e destinado adequadamente.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-hig-3',
        texto:
          'Controle integrado de pragas nos espaços do CEI (área externa, depósito, cozinha, lactário) executado por empresa habilitada.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
    ],
  },
  {
    titulo: 'Documentação e vigilância sanitária — CEI (SESA-PR 0162/2005)',
    itens: [
      {
        id: 'cei-doc-1',
        texto:
          'Alvará/licença sanitária do CEI expedido pela vigilância sanitária municipal, vigente e afixado em local visível.',
        referencia: 'Resolução SESA-PR nº 0162/2005 / Lei PR nº 13.331/2001',
      },
      {
        id: 'cei-doc-2',
        texto:
          'Manual de Boas Práticas específico para CEI elaborado e atualizado; disponível para consulta da equipe e fiscalização.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
      {
        id: 'cei-doc-3',
        texto:
          'Responsável técnico pela alimentação (nutricionista) com registro ativo no CRN; documentação acessível.',
        referencia: 'Resolução SESA-PR nº 0162/2005',
      },
    ],
  },
];

/** Os quatro POPs mínimos exigidos pela RDC 216/2004 (item 4.11.2). */
export const POPS_OBRIGATORIOS = [
  'Higienização de instalações, equipamentos, móveis e utensílios',
  'Controle integrado de vetores e pragas urbanas',
  'Higienização do reservatório de água',
  'Higiene e saúde dos manipuladores',
];
