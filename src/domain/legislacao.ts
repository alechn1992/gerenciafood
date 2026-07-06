// Base de conhecimento normativo para os relatórios de segurança dos alimentos.
//
// Referências:
//  - RDC ANVISA nº 216/2004 — Regulamento Técnico de Boas Práticas para
//    Serviços de Alimentação (norma federal base em todo o território nacional).
//  - Estado do Paraná: a RDC 216 é complementada pelas Resoluções da SESA-PR
//    (ex.: Resolução SESA nº 465/2013 — transporte de alimentos) e pelo Código
//    de Saúde do Paraná (Lei Estadual nº 13.331/2001 e Decreto nº 5.711/2002).
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

/** Os quatro POPs mínimos exigidos pela RDC 216/2004 (item 4.11.2). */
export const POPS_OBRIGATORIOS = [
  'Higienização de instalações, equipamentos, móveis e utensílios',
  'Controle integrado de vetores e pragas urbanas',
  'Higienização do reservatório de água',
  'Higiene e saúde dos manipuladores',
];
