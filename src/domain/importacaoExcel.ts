// Leitura da planilha de cardápio (.xlsx) no formato padrão Ponte do Saber.
// Puro: recebe o workbook já carregado e devolve os dados estruturados, sem
// tocar em repositório nem em UI.

import * as XLSX from 'xlsx';
import type { AvisoDia, CategoriaPrato, DiaSemana } from './types';

// ── Tipos internos ──────────────────────────────────────────────────────────

export interface ItemParsed {
  nome: string;
  categoria: CategoriaPrato;
}

export interface DiaCelula {
  dia: DiaSemana;
  pratos: ItemParsed[];
}

export interface RefeicaoExcel {
  tipoId: string;
  dias: DiaCelula[];
}

export interface TurmaExcel {
  nome: string;
  refeicoes: RefeicaoExcel[];
  /** Dias marcados como FERIADO, RECESSO etc. em vez de refeição. */
  avisos: AvisoDia[];
}

export interface SemanaExcel {
  semanaInicio: string;
  label: string;
  turmas: TurmaExcel[];
}

export interface DadosParseados {
  semanas: SemanaExcel[];
  turmasEncontradas: string[];
  totalItens: number;
}


// ── Constantes de mapeamento ────────────────────────────────────────────────

const DIAS_MAP: Record<string, DiaSemana> = {
  SEGUNDA: 1, 'SEGUNDA-FEIRA': 1,
  TERÇA: 2, TERCA: 2, 'TERÇA-FEIRA': 2, 'TERCA-FEIRA': 2,
  QUARTA: 3, 'QUARTA-FEIRA': 3,
  QUINTA: 4, 'QUINTA-FEIRA': 4,
  SEXTA: 5, 'SEXTA-FEIRA': 5,
  SÁBADO: 6, SABADO: 6,
  DOMINGO: 0,
};

const MESES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const REFEICOES_MAPA: { pattern: RegExp; id: string }[] = [
  { pattern: /lanche.{1,10}manh/i, id: 'cafe' },
  { pattern: /almo/i, id: 'almoco' },
  { pattern: /lanche.{1,10}tarde/i, id: 'lanche_tarde' },
  { pattern: /jantar/i, id: 'jantar' },
];

// ── Funções de parsing ──────────────────────────────────────────────────────

function str(val: unknown): string {
  return String(val ?? '').trim();
}

/** Textos que a planilha põe no lugar da refeição em dias sem atendimento. */
const MARCADOR_SEM_REFEICAO = /^(feriado|recesso|entrega\s+(de\s+)?pareceres)$/i;

function ehVazio(val: unknown): boolean {
  // Uma data nunca é prato — só aparece aqui se a leitura invadir uma linha de cabeçalho.
  if (val instanceof Date) return true;
  const s = str(val);
  return (
    s === '' || s === '-' || s === '--' || s.toLowerCase() === 'n/a' ||
    MARCADOR_SEM_REFEICAO.test(s)
  );
}

/** Texto do marcador de dia (FERIADO, RECESSO...), como vem da planilha. */
function marcadorDe(val: unknown): string | null {
  if (val instanceof Date) return null;
  const s = str(val).replace(/\s+/g, ' ');
  return MARCADOR_SEM_REFEICAO.test(s) ? s : null;
}

/** Lê a célula de um dia: marcador vira aviso do dia; o resto, item da refeição. */
function registrarCelula(
  itens: Map<DiaSemana, string[]>,
  marcadores: Map<DiaSemana, string>,
  dia: DiaSemana,
  val: unknown,
) {
  const marcador = marcadorDe(val);
  if (marcador) {
    if (!marcadores.has(dia)) marcadores.set(dia, marcador);
    return;
  }
  if (ehVazio(val)) return;
  if (!itens.has(dia)) itens.set(dia, []);
  itens.get(dia)!.push(str(val));
}

/**
 * Avisos da semana: os marcadores achados nas células e, só para dias sem
 * nenhum prato, o rótulo do cabeçalho. O cabeçalho sozinho não é confiável:
 * a aba Sem Lactose de outubro rotula a segunda 05/10 como FERIADO e serve
 * um cardápio completo nela.
 */
function montarAvisos(
  refeicoes: RefeicaoExcel[],
  marcadores: Map<DiaSemana, string>,
  headerRow: unknown[],
  colToDia: Map<number, DiaSemana>,
): AvisoDia[] {
  const comPratos = new Set(refeicoes.flatMap((r) => r.dias.map((d) => d.dia)));
  const avisos = new Map(marcadores);
  for (const [col, dia] of colToDia) {
    const doCabecalho = marcadorDe(headerRow[col]);
    if (doCabecalho && !avisos.has(dia) && !comPratos.has(dia)) avisos.set(dia, doCabecalho);
  }
  return [...avisos]
    .sort(([a], [b]) => a - b)
    .map(([dia, texto]) => ({ dia, texto }));
}

function diaFromHeader(cell: unknown): DiaSemana | null {
  const key = str(cell).toUpperCase().replace(/-FEIRA$/, '').trim();
  return Object.prototype.hasOwnProperty.call(DIAS_MAP, key)
    ? DIAS_MAP[key]
    : null;
}

function detectarTurma(cell: unknown): string | null {
  const t = str(cell).toUpperCase();
  if (/BABY\s*1/.test(t)) return 'Baby 1 (4-6 meses)';
  if (/BABY\s*2/.test(t)) return 'Baby 2 (6 meses)';
  if (/BABY\s*3/.test(t)) return 'Baby 3 (7-8 meses)';
  if (/BABY\s*4/.test(t)) return 'Baby 4 (9-11 meses)';
  if (/BABY\s*5/.test(t)) return 'Baby 5 (12 meses)';
  if (/INFANTIS/.test(t)) return 'Infantis';
  return null;
}

function detectarRefeicao(cell: unknown): string | null {
  const t = str(cell);
  for (const { pattern, id } of REFEICOES_MAPA) {
    if (pattern.test(t)) return id;
  }
  return null;
}

function atribuirCategoria(
  tipoId: string,
  posicao: number,
  totalItens: number,
): CategoriaPrato {
  if (tipoId === 'almoco') {
    if (totalItens <= 2) return 'proteina';
    switch (posicao) {
      case 0: return 'acompanhamento'; // arroz
      case 1: return 'acompanhamento'; // feijão
      case 2: return 'proteina';
      case 3: return 'guarnicao';
      case 4: return 'salada';
      default: return 'outro';
    }
  }
  if (tipoId === 'cafe' || tipoId === 'lanche_tarde') {
    return posicao === 1 ? 'sobremesa' : 'lanche';
  }
  return 'outro'; // jantar
}

function dateToIso(cell: unknown): string | null {
  if (cell instanceof Date) {
    const y = cell.getUTCFullYear();
    const m = cell.getUTCMonth();
    const d = cell.getUTCDate();
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  // Fallback: células sem formato de data retornam número serial do Excel
  if (typeof cell === 'number' && cell > 40000 && cell < 55000) {
    const d = new Date(Math.round((cell - 25569) * 86400 * 1000));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }
  return null;
}

/**
 * Mapeia coluna → dia da semana pela data de cada coluna. O texto do cabeçalho
 * fica só como reserva: em semanas com feriado a planilha troca "SEGUNDA" por
 * "FERIADO", e o rótulo deixa de identificar o dia — às vezes com refeição
 * normal servida naquele dia mesmo assim.
 */
function mapearColunas(headerRow: unknown[], dateRow: unknown[]): Map<number, DiaSemana> {
  const colToDia = new Map<number, DiaSemana>();
  const ultima = Math.max(headerRow.length, dateRow.length);
  for (let col = 1; col < ultima; col++) {
    const iso = dateToIso(dateRow[col]);
    const dia = iso
      ? (new Date(iso + 'T12:00:00').getDay() as DiaSemana)
      : diaFromHeader(headerRow[col]);
    if (dia !== null) colToDia.set(col, dia);
  }
  return colToDia;
}

/** Segunda-feira (AAAA-MM-DD) da semana da primeira data encontrada na linha. */
function segundaDaSemana(dateRow: unknown[]): string | null {
  for (let col = 1; col <= 7; col++) {
    const iso = dateToIso(dateRow[col]);
    if (!iso) continue;
    const d = new Date(iso + 'T12:00:00');
    const dow = d.getDay();
    d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
    return d.toISOString().slice(0, 10);
  }
  return null;
}

/** Linha com as datas dos dias: ao menos duas colunas de B a H contendo datas. */
function ehLinhaDeDatas(row: unknown[] | undefined): boolean {
  if (!row) return false;
  let datas = 0;
  for (let col = 1; col <= 7; col++) if (dateToIso(row[col])) datas++;
  return datas >= 2;
}

function formatarPeriodo(semanaInicio: string): string {
  const ini = new Date(semanaInicio + 'T12:00:00');
  const fim = new Date(ini);
  fim.setDate(ini.getDate() + 4);
  return `${ini.getDate()} a ${fim.getDate()} de ${MESES_PT[fim.getMonth()]} de ${fim.getFullYear()}`;
}

type Linhas = unknown[][];

function parsearSheetSemana(ws: XLSX.WorkSheet): SemanaExcel | null {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
  }) as Linhas;

  if (rows.length < 3) return null;

  const headerRow = rows[0] ?? [];
  const dateRow = rows[1] ?? [];

  const colToDia = mapearColunas(headerRow, dateRow);
  if (colToDia.size === 0) return null;

  const semanaInicio = segundaDaSemana(dateRow);
  if (!semanaInicio) return null;

  const turmas: TurmaExcel[] = [];
  let currentTurma: TurmaExcel | null = null;
  let currentRefeicaoId: string | null = null;
  let currentItems: Map<DiaSemana, string[]> = new Map();
  let marcadores = new Map<DiaSemana, string>();
  const marcadoresDaTurma = new Map<TurmaExcel, Map<DiaSemana, string>>();

  function commitRefeicao() {
    if (!currentTurma || !currentRefeicaoId || currentItems.size === 0) return;
    const dias: DiaCelula[] = [];
    for (const [dia, nomes] of currentItems) {
      const filtrados = nomes.filter((n) => !ehVazio(n));
      const total = filtrados.length;
      const pratos = filtrados.map((nome, idx) => ({
        nome,
        categoria: atribuirCategoria(currentRefeicaoId!, idx, total),
      }));
      if (pratos.length > 0) dias.push({ dia, pratos });
    }
    if (dias.length > 0) {
      currentTurma.refeicoes.push({ tipoId: currentRefeicaoId, dias });
    }
  }

  for (const row of rows.slice(2)) {
    const cellA = row[0];
    const textoA = str(cellA);

    if (textoA !== '' && cellA !== null) {
      const turma = detectarTurma(cellA);
      if (turma) {
        commitRefeicao();
        currentRefeicaoId = null;
        currentItems = new Map();
        currentTurma = { nome: turma, refeicoes: [], avisos: [] };
        marcadores = new Map();
        marcadoresDaTurma.set(currentTurma, marcadores);
        turmas.push(currentTurma);
        continue;
      }

      const refId = detectarRefeicao(cellA);
      if (refId && currentTurma) {
        commitRefeicao();
        currentRefeicaoId = refId;
        currentItems = new Map();
        for (const [col, dia] of colToDia) {
          registrarCelula(currentItems, marcadores, dia, row[col]);
        }
        continue;
      }
    }

    // Linha de continuação (col A vazia)
    if ((cellA === null || textoA === '') && currentRefeicaoId && currentTurma) {
      for (const [col, dia] of colToDia) {
        registrarCelula(currentItems, marcadores, dia, row[col]);
      }
    }
  }

  commitRefeicao();

  if (turmas.length === 0) return null;

  for (const turma of turmas) {
    turma.avisos = montarAvisos(turma.refeicoes, marcadoresDaTurma.get(turma)!, headerRow, colToDia);
  }

  return { semanaInicio, label: formatarPeriodo(semanaInicio), turmas };
}

/**
 * Lê abas de cardápio especial ("SEM LACTOSE", "BABY 3 ... APLV"): uma única
 * turma com todas as semanas empilhadas verticalmente (estrutura invertida em
 * relação às abas SEMANA). Cada bloco é uma linha de dias seguida de uma linha
 * de datas.
 *
 * Os blocos são localizados pela linha de datas, não pelo texto "SEGUNDA":
 * em semanas com feriado a planilha escreve "FERIADO" no lugar do dia, e a
 * semana inteira deixava de ser reconhecida — o conteúdo dela era despejado,
 * junto com os cabeçalhos, dentro da semana anterior.
 */
function parsearSheetEmpilhada(ws: XLSX.WorkSheet, nomeTurma: string): SemanaExcel[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
  }) as Linhas;

  if (rows.length < 6) return [];

  const linhasDeDatas: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    if (ehLinhaDeDatas(rows[i])) linhasDeDatas.push(i);
  }
  if (linhasDeDatas.length === 0) return [];

  const semanas: SemanaExcel[] = [];

  for (let w = 0; w < linhasDeDatas.length; w++) {
    const dateRowIdx = linhasDeDatas[w];
    // O bloco termina onde começa o cabeçalho de dias do próximo (linha acima das datas).
    const nextHeader = w + 1 < linhasDeDatas.length ? linhasDeDatas[w + 1] - 1 : rows.length;
    const dateRow = rows[dateRowIdx] ?? [];

    const colToDia = mapearColunas(rows[dateRowIdx - 1] ?? [], dateRow);
    if (colToDia.size === 0) continue;

    const semanaInicio = segundaDaSemana(dateRow);
    if (!semanaInicio) continue;

    // Parseia as linhas de refeição do bloco
    const refeicoes: RefeicaoExcel[] = [];
    let currentRefeicaoId: string | null = null;
    let currentItems: Map<DiaSemana, string[]> = new Map();
    const marcadores = new Map<DiaSemana, string>();

    const commitRef = () => {
      if (!currentRefeicaoId || currentItems.size === 0) return;
      const dias: DiaCelula[] = [];
      for (const [dia, nomes] of currentItems) {
        const filtrados = nomes.filter((n) => !ehVazio(n));
        const total = filtrados.length;
        const pratos = filtrados.map((nome, idx) => ({
          nome,
          categoria: atribuirCategoria(currentRefeicaoId!, idx, total),
        }));
        if (pratos.length > 0) dias.push({ dia, pratos });
      }
      if (dias.length > 0) refeicoes.push({ tipoId: currentRefeicaoId, dias });
    };

    for (let r = dateRowIdx + 1; r < nextHeader; r++) {
      const row = rows[r] ?? [];
      const cellA = row[0];
      const textoA = str(cellA);

      if (textoA !== '' && cellA !== null) {
        const refId = detectarRefeicao(cellA);
        if (refId) {
          commitRef();
          currentRefeicaoId = refId;
          currentItems = new Map();
          for (const [col, dia] of colToDia) {
            registrarCelula(currentItems, marcadores, dia, row[col]);
          }
          continue;
        }
        // Texto que não é refeição (rodapé com observações) encerra a
        // refeição: senão a assinatura da nutricionista, que fica na coluna
        // B, entrava como prato do jantar de segunda.
        commitRef();
        currentRefeicaoId = null;
        currentItems = new Map();
        continue;
      }

      // Linha de continuação (col A vazia)
      if ((cellA === null || textoA === '') && currentRefeicaoId) {
        for (const [col, dia] of colToDia) {
          registrarCelula(currentItems, marcadores, dia, row[col]);
        }
      }
    }

    commitRef();

    const avisos = montarAvisos(refeicoes, marcadores, rows[dateRowIdx - 1] ?? [], colToDia);
    // Uma semana inteira de recesso não tem prato, mas ainda precisa aparecer.
    if (refeicoes.length > 0 || avisos.length > 0) {
      semanas.push({
        semanaInicio,
        label: formatarPeriodo(semanaInicio),
        turmas: [{ nome: nomeTurma, refeicoes, avisos }],
      });
    }
  }

  return semanas;
}

/** Nome da turma de uma aba APLV: "BABY 3 (7-8 MESES) APLV" → "Baby 3 (7-8 meses) APLV". */
function nomeTurmaAplv(nomeAba: string): string {
  const base = detectarTurma(nomeAba);
  return base ? `${base} APLV` : 'APLV';
}

/** Abas de cardápio especial, no formato de semanas empilhadas. */
function abasEmpilhadas(nomes: string[]): { aba: string; turma: string }[] {
  const abas: { aba: string; turma: string }[] = [];
  for (const aba of nomes) {
    const t = aba.trim().toUpperCase();
    if (/\bAPLV\b/.test(t)) abas.push({ aba, turma: nomeTurmaAplv(aba) });
    else if (t.includes('LACTOSE')) abas.push({ aba, turma: 'Sem Lactose' });
  }
  return abas;
}

export function parsearPlanilha(wb: XLSX.WorkBook): DadosParseados {
  const semanaSheets = wb.SheetNames.filter((n) =>
    n.trim().toUpperCase().startsWith('SEMANA'),
  );
  const especiais = abasEmpilhadas(wb.SheetNames);

  if (semanaSheets.length === 0 && especiais.length === 0) {
    throw new Error(
      'Nenhuma aba de cardápio encontrada. O arquivo precisa ter abas chamadas "SEMANA 1", "SEMANA 2" etc., ' +
        '"SEM LACTOSE" ou com "APLV" no nome.',
    );
  }

  // Acumula semanas por data de início para permitir merge de turmas
  const semanaMap = new Map<string, SemanaExcel>();

  for (const sheetName of semanaSheets) {
    const parsed = parsearSheetSemana(wb.Sheets[sheetName]);
    if (!parsed) continue;
    if (semanaMap.has(parsed.semanaInicio)) {
      semanaMap.get(parsed.semanaInicio)!.turmas.push(...parsed.turmas);
    } else {
      semanaMap.set(parsed.semanaInicio, parsed);
    }
  }

  // Abas "SEM LACTOSE" e "APLV" (formato invertido: semanas empilhadas por turma)
  for (const { aba, turma } of especiais) {
    for (const semana of parsearSheetEmpilhada(wb.Sheets[aba], turma)) {
      if (semanaMap.has(semana.semanaInicio)) {
        semanaMap.get(semana.semanaInicio)!.turmas.push(...semana.turmas);
      } else {
        semanaMap.set(semana.semanaInicio, semana);
      }
    }
  }

  const semanas = Array.from(semanaMap.values()).sort((a, b) =>
    a.semanaInicio.localeCompare(b.semanaInicio),
  );

  if (semanas.length === 0) {
    throw new Error('Não foi possível extrair dados das abas de cardápio. Verifique o formato do arquivo.');
  }

  const turmasSet = new Set<string>();
  let totalItens = 0;
  for (const semana of semanas) {
    for (const turma of semana.turmas) {
      turmasSet.add(turma.nome);
      for (const ref of turma.refeicoes) {
        for (const dia of ref.dias) {
          totalItens += dia.pratos.length;
        }
      }
    }
  }

  return {
    semanas,
    turmasEncontradas: Array.from(turmasSet),
    totalItens,
  };
}
