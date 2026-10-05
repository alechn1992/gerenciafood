// Importação de cardápio a partir de arquivo Excel (.xlsx).
// Lê abas "SEMANA N" no formato padrão Ponte do Saber e cria turmas,
// pratos e cardápios no repositório ativo (localStorage ou Supabase).

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Link } from 'react-router-dom';
import { useData } from '../state/DataContext';
import { parsearPlanilha, type DadosParseados } from '../domain/importacaoExcel';
import type {
  CategoriaPrato,
  Cardapio,
  Turma,
  Prato,
  ItemCardapio,
  RefeicaoConfig,
} from '../domain/types';

interface ResultadoImportacao {
  turmasCriadas: number;
  pratosNovos: number;
  cardapiosSalvos: number;
  clienteId: string;
}

async function parsearArquivo(file: File): Promise<DadosParseados> {
  const data = await file.arrayBuffer();
  return parsearPlanilha(XLSX.read(data, { type: 'array', cellDates: true }));
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

      // Reimportar substitui o cardápio da mesma turma e semana. Sem isso cada
      // importação somava um registro novo, e a tela escolhia arbitrariamente
      // entre as cópias — inclusive uma vazia ou de uma importação com defeito.
      const existentes = new Map<string, Cardapio[]>();
      for (const c of await repo.listarCardapios(clienteId)) {
        if (!c.turmaId) continue;
        const chave = `${c.turmaId}|${c.semanaInicio}`;
        existentes.set(chave, [...(existentes.get(chave) ?? []), c]);
      }

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

          const [anterior, ...duplicatas] =
            existentes.get(`${turmaId}|${semana.semanaInicio}`) ?? [];
          const cardapio: Cardapio = {
            id: anterior?.id ?? crypto.randomUUID(),
            clienteId, turmaId,
            semanaInicio: semana.semanaInicio,
            itens,
            avisos: turmaData.avisos,
            geradoEm: agora,
          };
          await repo.salvarCardapio(cardapio);
          for (const d of duplicatas) await repo.removerCardapio(d.id);
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
            <br />
            <strong>Reimportação:</strong> cardápios já salvos destas semanas, para as mesmas
            turmas, serão substituídos pelos da planilha.
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
