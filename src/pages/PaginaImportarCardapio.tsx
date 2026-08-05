// Importação de cardápio a partir de arquivo Excel (.xlsx).
// Lê abas "SEMANA N" no formato padrão Ponte do Saber e cria turmas,
// pratos e cardápios no repositório ativo (localStorage ou Supabase).

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Link } from 'react-router-dom';
import { useData } from '../state/DataContext';
import type {
  CategoriaPrato,
  DiaSemana,
  Cardapio,
  Turma,
  Prato,
  ItemCardapio,
  RefeicaoConfig,
} from '../domain/types';

// ── Tipos internos ──────────────────────────────────────────────────────────

interface ItemParsed {
  nome: string;
  categoria: CategoriaPrato;
}

interface DiaCelula {
  dia: DiaSemana;
  pratos: ItemParsed[];
}

interface RefeicaoExcel {
  tipoId: string;
  dias: DiaCelula[];
}

interface TurmaExcel {
  nome: string;
  refeicoes: RefeicaoExcel[];
}

interface SemanaExcel {
  semanaInicio: string;
  label: string;
  turmas: TurmaExcel[];
}

interface DadosParseados {
  semanas: SemanaExcel[];
  turmasEncontradas: string[];
  totalItens: number;
}

interface ResultadoImportacao {
  turmasCriadas: number;
  pratosNovos: number;
  cardapiosSalvos: number;
  clienteId: string;
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

function ehVazio(val: unknown): boolean {
  const s = str(val);
  return s === '' || s === '-' || s === '--' || s.toLowerCase() === 'n/a';
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

  const headerRow = rows[0];
  const dateRow = rows[1];

  // Mapeia coluna → DiaSemana
  const colToDia = new Map<number, DiaSemana>();
  for (let col = 1; col < headerRow.length; col++) {
    const dia = diaFromHeader(headerRow[col]);
    if (dia !== null) colToDia.set(col, dia);
  }
  if (colToDia.size === 0) return null;

  // Determina a segunda-feira da semana
  let semanaInicio = '';
  for (let col = 1; col <= 7; col++) {
    const iso = dateToIso(dateRow[col]);
    if (iso) {
      const d = new Date(iso + 'T12:00:00');
      const dow = d.getDay();
      const diff = dow === 0 ? -6 : 1 - dow;
      d.setDate(d.getDate() + diff);
      semanaInicio = d.toISOString().slice(0, 10);
      break;
    }
  }
  if (!semanaInicio) return null;

  const turmas: TurmaExcel[] = [];
  let currentTurma: TurmaExcel | null = null;
  let currentRefeicaoId: string | null = null;
  let currentItems: Map<DiaSemana, string[]> = new Map();

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
        currentTurma = { nome: turma, refeicoes: [] };
        turmas.push(currentTurma);
        continue;
      }

      const refId = detectarRefeicao(cellA);
      if (refId && currentTurma) {
        commitRefeicao();
        currentRefeicaoId = refId;
        currentItems = new Map();
        for (const [col, dia] of colToDia) {
          const val = row[col];
          if (!ehVazio(val)) {
            if (!currentItems.has(dia)) currentItems.set(dia, []);
            currentItems.get(dia)!.push(str(val));
          }
        }
        continue;
      }
    }

    // Linha de continuação (col A vazia)
    if ((cellA === null || textoA === '') && currentRefeicaoId && currentTurma) {
      for (const [col, dia] of colToDia) {
        const val = row[col];
        if (!ehVazio(val)) {
          if (!currentItems.has(dia)) currentItems.set(dia, []);
          currentItems.get(dia)!.push(str(val));
        }
      }
    }
  }

  commitRefeicao();

  if (turmas.length === 0) return null;

  return { semanaInicio, label: formatarPeriodo(semanaInicio), turmas };
}

/**
 * Lê abas no formato "SEM LACTOSE": uma única turma com todas as semanas
 * empilhadas verticalmente (estrutura invertida em relação às abas SEMANA).
 * Cada bloco começa com uma linha de cabeçalho de dias (col B = "SEGUNDA").
 */
function parsearSheetSemLactose(ws: XLSX.WorkSheet): SemanaExcel[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
  }) as Linhas;

  if (rows.length < 6) return [];

  // Localiza blocos semanais: linhas onde coluna B contém um nome de dia
  const weekHeaderRows: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    if (diaFromHeader(rows[i]?.[1]) !== null) weekHeaderRows.push(i);
  }
  if (weekHeaderRows.length === 0) return [];

  const semanas: SemanaExcel[] = [];

  for (let w = 0; w < weekHeaderRows.length; w++) {
    const headerRow = weekHeaderRows[w];
    const dateRowIdx = headerRow + 1;
    const nextHeader = w + 1 < weekHeaderRows.length ? weekHeaderRows[w + 1] : rows.length;

    // Mapeia coluna → DiaSemana
    const colToDia = new Map<number, DiaSemana>();
    const headerData = rows[headerRow] ?? [];
    for (let col = 1; col < headerData.length; col++) {
      const dia = diaFromHeader(headerData[col]);
      if (dia !== null) colToDia.set(col, dia);
    }
    if (colToDia.size === 0) continue;

    // Determina a segunda-feira da semana
    const dateRow = rows[dateRowIdx] ?? [];
    let semanaInicio = '';
    for (let col = 1; col <= 7; col++) {
      const iso = dateToIso(dateRow[col]);
      if (iso) {
        const d = new Date(iso + 'T12:00:00');
        const dow = d.getDay();
        const diff = dow === 0 ? -6 : 1 - dow;
        d.setDate(d.getDate() + diff);
        semanaInicio = d.toISOString().slice(0, 10);
        break;
      }
    }
    if (!semanaInicio) continue;

    // Parseia as linhas de refeição do bloco
    const refeicoes: RefeicaoExcel[] = [];
    let currentRefeicaoId: string | null = null;
    let currentItems: Map<DiaSemana, string[]> = new Map();

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
            const val = row[col];
            if (!ehVazio(val)) {
              if (!currentItems.has(dia)) currentItems.set(dia, []);
              currentItems.get(dia)!.push(str(val));
            }
          }
          continue;
        }
      }

      // Linha de continuação (col A vazia)
      if ((cellA === null || textoA === '') && currentRefeicaoId) {
        for (const [col, dia] of colToDia) {
          const val = row[col];
          if (!ehVazio(val)) {
            if (!currentItems.has(dia)) currentItems.set(dia, []);
            currentItems.get(dia)!.push(str(val));
          }
        }
      }
    }

    commitRef();

    if (refeicoes.length > 0) {
      semanas.push({
        semanaInicio,
        label: formatarPeriodo(semanaInicio),
        turmas: [{ nome: 'Sem Lactose', refeicoes }],
      });
    }
  }

  return semanas;
}

async function parsearArquivo(file: File): Promise<DadosParseados> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array', cellDates: true });

  const semanaSheets = wb.SheetNames.filter((n) =>
    n.trim().toUpperCase().startsWith('SEMANA'),
  );

  if (semanaSheets.length === 0) {
    throw new Error(
      'Nenhuma aba "SEMANA" encontrada. O arquivo precisa ter abas chamadas "SEMANA 1", "SEMANA 2" etc.',
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

  // Processa abas "SEM LACTOSE" (formato invertido: semanas empilhadas por turma)
  const lactoseSheets = wb.SheetNames.filter((n) =>
    n.trim().toUpperCase().includes('LACTOSE'),
  );
  for (const sheetName of lactoseSheets) {
    for (const semana of parsearSheetSemLactose(wb.Sheets[sheetName])) {
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
    throw new Error('Não foi possível extrair dados das abas SEMANA. Verifique o formato do arquivo.');
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

// ── Componente ──────────────────────────────────────────────────────────────

type Etapa = 'upload' | 'preview' | 'importando' | 'concluido';

export function PaginaImportarCardapio() {
  const { clientes, pratos, repo, recarregarTurmas, recarregarPratos } = useData();
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [dados, setDados] = useState<DadosParseados | null>(null);
  const [clienteId, setClienteId] = useState('');
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erroImport, setErroImport] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState('');

  const processarArquivo = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErroArquivo('Selecione um arquivo Excel (.xlsx ou .xls).');
      return;
    }
    setErroArquivo(null);
    setNomeArquivo(file.name);
    try {
      const parsed = await parsearArquivo(file);
      setDados(parsed);
      setEtapa('preview');
    } catch (e) {
      setErroArquivo(e instanceof Error ? e.message : 'Erro ao processar o arquivo.');
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processarArquivo(file);
  };

  const handleImportar = async () => {
    if (!dados || !clienteId) return;
    setEtapa('importando');
    setErroImport(null);

    try {
      // 1. Turmas
      const existingTurmas = await repo.listarTurmas(clienteId);
      const turmaIds = new Map<string, string>();
      let turmasCriadas = 0;

      const refsConfig: RefeicaoConfig[] = [
        { tipoRefeicaoId: 'cafe', composicao: [] },
        { tipoRefeicaoId: 'almoco', composicao: [] },
        { tipoRefeicaoId: 'lanche_tarde', composicao: [] },
        { tipoRefeicaoId: 'jantar', composicao: [] },
      ];

      for (let i = 0; i < dados.turmasEncontradas.length; i++) {
        const nome = dados.turmasEncontradas[i];
        const existing = existingTurmas.find((t) => t.nome === nome);
        if (existing) {
          turmaIds.set(nome, existing.id);
        } else {
          const id = crypto.randomUUID();
          const turma: Turma = {
            id, clienteId, nome, ordem: i,
            refeicoes: refsConfig, restricoes: [],
          };
          await repo.salvarTurma(turma);
          turmaIds.set(nome, id);
          turmasCriadas++;
        }
      }

      // 2. Pratos — reutiliza por nome, cria os novos
      const pratoMap = new Map<string, { id: string; nome: string }>(
        pratos.map((p) => [p.nome.toLowerCase().trim(), { id: p.id, nome: p.nome }]),
      );

      const novosNeeded = new Map<string, { nome: string; categoria: CategoriaPrato }>();
      for (const semana of dados.semanas) {
        for (const turma of semana.turmas) {
          for (const ref of turma.refeicoes) {
            for (const dia of ref.dias) {
              for (const item of dia.pratos) {
                const key = item.nome.toLowerCase().trim();
                if (!pratoMap.has(key) && !novosNeeded.has(key)) {
                  novosNeeded.set(key, { nome: item.nome, categoria: item.categoria });
                }
              }
            }
          }
        }
      }

      let pratosNovos = 0;
      for (const { nome, categoria } of novosNeeded.values()) {
        const id = crypto.randomUUID();
        const prato: Prato = {
          id, nome, categoria, restricoes: [], tags: [], ativo: true,
        };
        await repo.salvarPrato(prato);
        pratoMap.set(nome.toLowerCase().trim(), { id, nome });
        pratosNovos++;
      }

      // 3. Cardápios (1 por semana × turma)
      const agora = new Date().toISOString();
      let cardapiosSalvos = 0;

      for (const semana of dados.semanas) {
        for (const turmaData of semana.turmas) {
          const turmaId = turmaIds.get(turmaData.nome);
          if (!turmaId) continue;

          const itens: ItemCardapio[] = [];
          for (const ref of turmaData.refeicoes) {
            for (const diaData of ref.dias) {
              for (const item of diaData.pratos) {
                const encontrado = pratoMap.get(item.nome.toLowerCase().trim());
                if (!encontrado) continue;
                itens.push({
                  dia: diaData.dia,
                  tipoRefeicaoId: ref.tipoId,
                  categoria: item.categoria,
                  pratoId: encontrado.id,
                  pratoNome: encontrado.nome,
                });
              }
            }
          }

          const cardapio: Cardapio = {
            id: crypto.randomUUID(),
            clienteId, turmaId,
            semanaInicio: semana.semanaInicio,
            itens,
            geradoEm: agora,
          };
          await repo.salvarCardapio(cardapio);
          cardapiosSalvos++;
        }
      }

      await Promise.all([recarregarTurmas(), recarregarPratos()]);
      setResultado({ turmasCriadas, pratosNovos, cardapiosSalvos, clienteId });
      setEtapa('concluido');
    } catch (e) {
      setErroImport(e instanceof Error ? e.message : 'Erro durante a importação.');
      setEtapa('preview');
    }
  };

  return (
    <div className="imp-pagina">
      <h1>Importar Cardápio do Excel</h1>

      {/* ── Upload ── */}
      {etapa === 'upload' && (
        <div>
          <p className="imp-desc">
            Selecione um arquivo <strong>.xlsx</strong> com as abas "SEMANA 1", "SEMANA 2" etc.
            no formato padrão (turmas agrupadas em seções, colunas para cada dia da semana).
          </p>

          <label
            className={`imp-dropzone${isDragging ? ' imp-dropzone--arrastando' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDragging(false)}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            <span className="imp-dropzone-icone">📂</span>
            <span className="imp-dropzone-texto">
              Arraste o arquivo aqui ou clique para selecionar
            </span>
            <span className="imp-dropzone-sub">.xlsx ou .xls</span>
          </label>

          {erroArquivo && <p className="imp-erro">{erroArquivo}</p>}
        </div>
      )}

      {/* ── Preview ── */}
      {etapa === 'preview' && dados && (
        <div>
          <div className="imp-resumo">
            <p className="imp-arquivo">📄 {nomeArquivo}</p>
            <div className="imp-stats">
              <div className="imp-stat">
                <span className="imp-stat-num">{dados.semanas.length}</span>
                <span className="imp-stat-label">semanas</span>
              </div>
              <div className="imp-stat">
                <span className="imp-stat-num">{dados.turmasEncontradas.length}</span>
                <span className="imp-stat-label">turmas</span>
              </div>
              <div className="imp-stat">
                <span className="imp-stat-num">{dados.totalItens}</span>
                <span className="imp-stat-label">itens de cardápio</span>
              </div>
            </div>
          </div>

          <div className="imp-semanas">
            {dados.semanas.map((s) => (
              <div key={s.semanaInicio} className="imp-semana-tag">
                {s.label}
              </div>
            ))}
          </div>

          <div className="imp-turmas">
            <p className="imp-secao-titulo">Turmas encontradas</p>
            {dados.turmasEncontradas.map((t) => (
              <span key={t} className="imp-turma-chip">{t}</span>
            ))}
          </div>

          <div className="imp-nota">
            <strong>Mapeamento de refeições:</strong> "Lanche da manhã" → Café da manhã &nbsp;·&nbsp;
            "Almoço" → Almoço &nbsp;·&nbsp; "Lanche da tarde" → Lanche da tarde &nbsp;·&nbsp;
            "Jantar" → Jantar
          </div>

          <div className="imp-cliente-sel">
            <label htmlFor="cliente-sel">
              <strong>Selecionar cliente</strong>
              <span className="imp-obrigatorio"> *</span>
            </label>
            {clientes.length === 0 ? (
              <p className="imp-aviso">
                Nenhum cliente cadastrado.{' '}
                <Link to="/clientes/novo">Cadastre um cliente</Link> antes de importar.
              </p>
            ) : (
              <select
                id="cliente-sel"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
              >
                <option value="">— Selecione o cliente —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            )}
          </div>

          {erroImport && <p className="imp-erro">{erroImport}</p>}

          <div className="imp-acoes">
            <button
              className="btn secundario"
              onClick={() => { setEtapa('upload'); setDados(null); }}
            >
              ← Trocar arquivo
            </button>
            <button
              className="btn primario"
              disabled={!clienteId}
              onClick={handleImportar}
            >
              Importar cardápio
            </button>
          </div>
        </div>
      )}

      {/* ── Importando ── */}
      {etapa === 'importando' && (
        <div className="imp-loading">
          <div className="imp-spinner" />
          <p>Importando cardápio… aguarde.</p>
        </div>
      )}

      {/* ── Concluído ── */}
      {etapa === 'concluido' && resultado && (
        <div className="imp-sucesso">
          <p className="imp-sucesso-icone">✅</p>
          <h2>Importação concluída!</h2>
          <ul className="imp-sucesso-lista">
            <li>{resultado.cardapiosSalvos} cardápios salvos</li>
            <li>{resultado.turmasCriadas} turma{resultado.turmasCriadas !== 1 ? 's' : ''} criada{resultado.turmasCriadas !== 1 ? 's' : ''}</li>
            <li>{resultado.pratosNovos} prato{resultado.pratosNovos !== 1 ? 's' : ''} novo{resultado.pratosNovos !== 1 ? 's' : ''} cadastrado{resultado.pratosNovos !== 1 ? 's' : ''}</li>
          </ul>
          <div className="imp-acoes">
            <Link to={`/clientes/${resultado.clienteId}/cardapio`} className="btn primario">
              Ver cardápios do cliente
            </Link>
            <button
              className="btn secundario"
              onClick={() => {
                setEtapa('upload');
                setDados(null);
                setResultado(null);
                setClienteId('');
                setNomeArquivo('');
              }}
            >
              Importar outro arquivo
            </button>
          </div>
        </div>
      )}

      <style>{`
        .imp-pagina {
          max-width: 740px;
        }
        .imp-pagina h1 {
          margin-bottom: 6px;
        }
        .imp-desc {
          color: var(--cinza);
          margin-bottom: 20px;
        }

        /* ── Dropzone ── */
        .imp-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          border: 2px dashed var(--borda);
          border-radius: 10px;
          padding: 48px 24px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          text-align: center;
        }
        .imp-dropzone:hover,
        .imp-dropzone--arrastando {
          border-color: var(--verde);
          background: #f0faf4;
        }
        .imp-dropzone-icone { font-size: 2.4rem; }
        .imp-dropzone-texto { font-size: 1rem; font-weight: 600; }
        .imp-dropzone-sub { font-size: 0.82rem; color: var(--cinza); }

        /* ── Resumo ── */
        .imp-resumo {
          background: #f7fbf8;
          border: 1px solid var(--borda);
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 16px;
        }
        .imp-arquivo {
          margin: 0 0 12px;
          font-size: 0.9rem;
          color: var(--cinza);
        }
        .imp-stats {
          display: flex;
          gap: 24px;
        }
        .imp-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .imp-stat-num {
          font-size: 1.7rem;
          font-weight: 700;
          color: var(--verde);
          line-height: 1;
        }
        .imp-stat-label {
          font-size: 0.78rem;
          color: var(--cinza);
          margin-top: 2px;
        }

        /* ── Semanas / Turmas ── */
        .imp-semanas {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }
        .imp-semana-tag {
          background: #eef7f1;
          color: var(--verde);
          border: 1px solid #cfe3d6;
          border-radius: 20px;
          padding: 3px 12px;
          font-size: 0.82rem;
          font-weight: 600;
        }
        .imp-secao-titulo {
          font-size: 0.82rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--cinza);
          margin: 0 0 8px;
        }
        .imp-turmas { margin-bottom: 16px; }
        .imp-turma-chip {
          display: inline-block;
          background: #fff;
          border: 1px solid var(--borda);
          border-radius: 6px;
          padding: 3px 10px;
          font-size: 0.84rem;
          margin: 0 6px 6px 0;
        }

        /* ── Nota de mapeamento ── */
        .imp-nota {
          background: #fffbea;
          border: 1px solid #e8d96a;
          border-radius: 6px;
          padding: 10px 14px;
          font-size: 0.82rem;
          margin-bottom: 20px;
          line-height: 1.55;
        }

        /* ── Seleção de cliente ── */
        .imp-cliente-sel {
          margin-bottom: 20px;
        }
        .imp-cliente-sel label {
          display: block;
          margin-bottom: 6px;
        }
        .imp-obrigatorio { color: var(--vermelho, #c0392b); }
        .imp-cliente-sel select {
          width: 100%;
          max-width: 400px;
        }
        .imp-aviso {
          color: var(--cinza);
          font-size: 0.9rem;
        }

        /* ── Ações ── */
        .imp-acoes {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        /* ── Loading ── */
        .imp-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 60px 0;
          color: var(--cinza);
        }
        .imp-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid var(--borda);
          border-top-color: var(--verde);
          border-radius: 50%;
          animation: imp-spin 0.7s linear infinite;
        }
        @keyframes imp-spin { to { transform: rotate(360deg); } }

        /* ── Sucesso ── */
        .imp-sucesso {
          text-align: center;
          padding: 32px 0;
        }
        .imp-sucesso-icone { font-size: 3rem; margin: 0 0 8px; }
        .imp-sucesso h2 { margin: 0 0 16px; }
        .imp-sucesso-lista {
          list-style: none;
          padding: 0;
          margin: 0 0 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 1rem;
        }
        .imp-sucesso-lista li::before { content: '✓ '; color: var(--verde); }
        .imp-sucesso .imp-acoes { justify-content: center; }

        /* ── Erro ── */
        .imp-erro {
          background: #fdecea;
          border: 1px solid #f5c6c2;
          border-radius: 6px;
          padding: 10px 14px;
          color: #c0392b;
          font-size: 0.9rem;
          margin: 12px 0;
        }
      `}</style>
    </div>
  );
}
