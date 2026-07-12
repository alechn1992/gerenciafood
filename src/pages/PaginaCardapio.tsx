import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import { gerarCardapio, rotuloCategoria } from '../domain/gerador';
import {
  DIAS_SEMANA,
  type Cardapio,
  type Cliente,
  type ItemCardapio,
  type Prato,
  type RefeicaoConfig,
  type Turma,
} from '../domain/types';
import { formatarData, segundaFeiraDaSemana } from '../lib/datas';
import { UF_PARA_REGIAO } from '../data/sazonalidade';

function CelulaEditavel({
  item,
  idx,
  pratosCategoria,
  onTrocar,
}: {
  item: ItemCardapio;
  idx: number;
  pratosCategoria: Prato[];
  onTrocar: (idx: number, pratoId: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  const abrir = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditando(true);
  };

  useEffect(() => {
    if (editando && selectRef.current) {
      selectRef.current.focus();
    }
  }, [editando]);

  if (editando) {
    return (
      <select
        ref={selectRef}
        value={item.pratoId}
        onChange={(e) => {
          onTrocar(idx, e.target.value);
          setEditando(false);
        }}
        onBlur={() => setEditando(false)}
        style={{ fontSize: 'inherit', maxWidth: 180 }}
      >
        {pratosCategoria.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
    );
  }

  return (
    <span
      title="Clique para trocar o prato"
      style={{ cursor: 'pointer', borderBottom: '1px dashed var(--cinza)', paddingBottom: 1 }}
      onClick={abrir}
    >
      {item.pratoNome}
    </span>
  );
}

export function PaginaCardapio() {
  const { id } = useParams();
  const { clientes } = useData();
  const cliente = clientes.find((c) => c.id === id);

  if (!cliente) {
    return (
      <div className="card vazio">
        Cliente não encontrado. <Link to="/clientes">Voltar</Link>
      </div>
    );
  }

  return <MontagemCardapio cliente={cliente} />;
}

/**
 * Monta o cardápio (semanal ou mensal) de um cliente já escolhido, aplicando
 * automaticamente as particularidades cadastradas (dias de operação, refeições,
 * restrições e, quando houver, as turmas/faixas etárias do cliente).
 */
export function MontagemCardapio({ cliente }: { cliente: Cliente }) {
  const { turmas } = useData();

  const turmasDoCliente = useMemo(
    () =>
      turmas
        .filter((t) => t.clienteId === cliente.id)
        .sort((a, b) => a.ordem - b.ordem),
    [turmas, cliente.id],
  );

  return turmasDoCliente.length > 0 ? (
    <CardapioPorTurmas cliente={cliente} turmasDoCliente={turmasDoCliente} />
  ) : (
    <CardapioSimples cliente={cliente} />
  );
}

function copiarCardapio(origem: Cardapio, novaSemana: string): Cardapio {
  return { ...origem, id: crypto.randomUUID(), semanaInicio: novaSemana, geradoEm: new Date().toISOString() };
}

function adicionarSemanas(data: string, n: number): string {
  const d = new Date(`${data}T00:00:00`);
  d.setDate(d.getDate() + n * 7);
  return d.toISOString().slice(0, 10);
}

/** Fluxo original: um cardápio por cliente (sem turmas), semana a semana. */
function CardapioSimples({ cliente }: { cliente: Cliente }) {
  const { pratos, tiposRefeicao, salvarCardapio, listarCardapios } = useData();

  const [semana, setSemana] = useState(segundaFeiraDaSemana());
  const [atual, setAtual] = useState<Cardapio | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [salvos, setSalvos] = useState<Cardapio[]>([]);
  const [priorizarSazonais, setPriorizarSazonais] = useState(false);
  const [ufSazonalidade, setUfSazonalidade] = useState<string>(
    () => localStorage.getItem('sazonalidade_uf') ?? 'SP',
  );
  const [copiandoId, setCopiandoId] = useState<string | null>(null);
  const [semanaDestino, setSemanaDestino] = useState(segundaFeiraDaSemana());

  useEffect(() => {
    listarCardapios(cliente.id).then(setSalvos);
  }, [cliente.id, listarCardapios]);

  const diasVisiveis = useMemo(
    () => DIAS_SEMANA.filter((d) => cliente.diasOperacao.includes(d.valor)),
    [cliente],
  );

  const gerar = () => {
    const { cardapio, avisos } = gerarCardapio({
      cliente,
      pratos,
      semanaInicio: semana,
      seed: Date.now(),
      priorizarSazonais,
      ufSazonalidade: priorizarSazonais ? ufSazonalidade : undefined,
    });
    setAtual(cardapio);
    setAvisos(avisos);
  };

  const salvar = async () => {
    if (!atual) return;
    await salvarCardapio(atual);
    setSalvos(await listarCardapios(cliente.id));
    alert('Cardápio salvo.');
  };

  const nomeTipo = (tipoId: string) =>
    tiposRefeicao.find((t) => t.id === tipoId)?.nome ?? tipoId;

  const trocarPrato = (itemIdx: number, novoPratoId: string) => {
    if (!atual) return;
    const novoPrato = pratos.find((p) => p.id === novoPratoId);
    if (!novoPrato) return;
    setAtual((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        itens: prev.itens.map((item, i) =>
          i === itemIdx ? { ...item, pratoId: novoPrato.id, pratoNome: novoPrato.nome } : item,
        ),
      };
    });
  };

  const renderCelula = (c: Cardapio, dia: number, tipoId: string, categoria: string) => {
    const com = c.itens
      .map((item, idx) => ({ item, idx }))
      .filter(
        ({ item }) =>
          item.dia === dia && item.tipoRefeicaoId === tipoId && item.categoria === categoria,
      );
    if (com.length === 0) return <span style={{ color: 'var(--cinza)' }}>—</span>;

    const pratosCategoria = pratos.filter((p) => p.ativo && p.categoria === categoria);

    return (
      <>
        {com.map(({ item, idx }, pos) => (
          <span key={idx}>
            {pos > 0 && <span style={{ color: 'var(--cinza)' }}>, </span>}
            <CelulaEditavel
              item={item}
              idx={idx}
              pratosCategoria={pratosCategoria}
              onTrocar={trocarPrato}
            />
          </span>
        ))}
      </>
    );
  };

  const renderGrade = (c: Cardapio) => (
    <div className="cardapio-grid">
      <p style={{ fontSize: 12, color: 'var(--cinza)', margin: '0 0 8px' }}>
        Clique em qualquer prato para trocar manualmente.
      </p>
      <table>
        <thead>
          <tr>
            <th>Refeição</th>
            {diasVisiveis.map((d) => (
              <th key={d.valor}>{d.nome}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cliente.refeicoes.map((ref) =>
            ref.composicao.map((comp, ci) => (
              <tr key={`${ref.tipoRefeicaoId}-${comp.categoria}-${ci}`}>
                <td>
                  {ci === 0 && <strong>{nomeTipo(ref.tipoRefeicaoId)}</strong>}
                  <div className="cat">{rotuloCategoria(comp.categoria)}</div>
                </td>
                {diasVisiveis.map((d) => (
                  <td key={d.valor}>
                    {renderCelula(c, d.valor, ref.tipoRefeicaoId, comp.categoria)}
                  </td>
                ))}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="linha">
        <div>
          <h1>Cardápio — {cliente.nome}</h1>
          <p className="subtitulo">
            Geração automática respeitando dias de operação, refeições e restrições.
          </p>
        </div>
        <Link to="/clientes" className="btn secundario">
          ← Voltar
        </Link>
      </div>

      <div className="card">
        <div className="linha" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <label>Semana (segunda-feira de referência)</label>
            <input type="date" value={semana} onChange={(e) => setSemana(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
              <input
                type="checkbox"
                checked={priorizarSazonais}
                onChange={(e) => setPriorizarSazonais(e.target.checked)}
              />
              🌱 Priorizar ingredientes da estação
            </label>
            {priorizarSazonais && (
              <select
                value={ufSazonalidade}
                onChange={(e) => {
                  setUfSazonalidade(e.target.value);
                  localStorage.setItem('sazonalidade_uf', e.target.value);
                }}
                style={{ fontSize: 13 }}
                title="Estado de referência para sazonalidade"
              >
                {Object.keys(UF_PARA_REGIAO).sort().map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            )}
          </div>
          <div className="acoes" style={{ marginTop: 'auto' }}>
            <button className="btn" onClick={gerar}>
              ⚙️ Gerar cardápio
            </button>
            {atual && (
              <button className="btn secundario" onClick={salvar}>
                Salvar
              </button>
            )}
          </div>
        </div>
      </div>

      {avisos.length > 0 && (
        <div className="aviso">
          <strong>Atenção:</strong>
          <ul style={{ margin: '6px 0 0' }}>
            {avisos.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {atual && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            Semana de {formatarData(atual.semanaInicio)}
          </h3>
          {renderGrade(atual)}
        </div>
      )}

      {salvos.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Cardápios salvos</h3>
          <table>
            <thead>
              <tr>
                <th>Semana</th>
                <th>Gerado em</th>
                <th>Itens</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {salvos.map((c) => (
                <tr key={c.id}>
                  <td>{formatarData(c.semanaInicio)}</td>
                  <td>{new Date(c.geradoEm).toLocaleString('pt-BR')}</td>
                  <td>{c.itens.length}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        className="btn pequeno secundario"
                        onClick={() => { setAtual(c); setAvisos([]); setSemana(c.semanaInicio); setCopiandoId(null); }}
                      >
                        Ver
                      </button>
                      <button
                        className="btn pequeno secundario"
                        onClick={() => { setCopiandoId(c.id); setSemanaDestino(adicionarSemanas(c.semanaInicio, 1)); }}
                      >
                        Copiar
                      </button>
                      {copiandoId === c.id && (
                        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input
                            type="date"
                            value={semanaDestino}
                            onChange={(e) => setSemanaDestino(e.target.value)}
                            style={{ fontSize: 13 }}
                          />
                          <button
                            className="btn pequeno"
                            onClick={() => {
                              const copia = copiarCardapio(c, semanaDestino);
                              setAtual(copia);
                              setSemana(semanaDestino);
                              setAvisos([]);
                              setCopiandoId(null);
                            }}
                          >
                            OK
                          </button>
                          <button className="btn pequeno secundario" onClick={() => setCopiandoId(null)}>✕</button>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface SemanaGerada {
  semanaInicio: string;
  porTurma: Record<string, Cardapio>;
  avisos: string[];
}

/** Fluxo por turmas/faixas etárias: várias grades por semana, com visão mensal (4 semanas). */
function CardapioPorTurmas({
  cliente,
  turmasDoCliente,
}: {
  cliente: Cliente;
  turmasDoCliente: Turma[];
}) {
  const { pratos, tiposRefeicao, salvarCardapio, listarCardapios } = useData();

  const [semana, setSemana] = useState(segundaFeiraDaSemana());
  const [semanasGeradas, setSemanasGeradas] = useState<SemanaGerada[]>([]);
  const [salvos, setSalvos] = useState<Cardapio[]>([]);
  const [copiandoSemana, setCopiandoSemana] = useState<string | null>(null);
  const [semanaDestinoCopia, setSemanaDestinoCopia] = useState(segundaFeiraDaSemana());

  const copiarSemanas = (semanaOrigem: string, novaBase: string, quantas: number) => {
    const novas: SemanaGerada[] = [];
    for (let i = 0; i < quantas; i++) {
      const de = adicionarSemanas(semanaOrigem, i);
      const para = adicionarSemanas(novaBase, i);
      const cardapiosDaSemana = salvos.filter((c) => c.semanaInicio === de && c.turmaId);
      if (cardapiosDaSemana.length === 0) continue;
      const porTurma: Record<string, Cardapio> = {};
      cardapiosDaSemana.forEach((c) => {
        if (c.turmaId) porTurma[c.turmaId] = copiarCardapio(c, para);
      });
      novas.push({ semanaInicio: para, porTurma, avisos: [] });
    }
    if (novas.length > 0) {
      setSemanasGeradas(novas);
      setSemana(novaBase);
    }
    setCopiandoSemana(null);
  };

  const trocarPratoTurma = (semanaInicio: string, turmaId: string, itemIdx: number, novoPratoId: string) => {
    const novoPrato = pratos.find((p) => p.id === novoPratoId);
    if (!novoPrato) return;
    setSemanasGeradas((prev) =>
      prev.map((s) => {
        if (s.semanaInicio !== semanaInicio) return s;
        const cardapio = s.porTurma[turmaId];
        if (!cardapio) return s;
        return {
          ...s,
          porTurma: {
            ...s.porTurma,
            [turmaId]: {
              ...cardapio,
              itens: cardapio.itens.map((item, i) =>
                i === itemIdx
                  ? { ...item, pratoId: novoPrato.id, pratoNome: novoPrato.nome }
                  : item,
              ),
            },
          },
        };
      }),
    );
  };

  useEffect(() => {
    listarCardapios(cliente.id).then(setSalvos);
  }, [cliente.id, listarCardapios]);

  const diasVisiveis = useMemo(
    () => DIAS_SEMANA.filter((d) => cliente.diasOperacao.includes(d.valor)),
    [cliente],
  );

  const somarSemanas = (base: string, quantas: number): string[] => {
    const inicio = new Date(`${base}T00:00:00`);
    return Array.from({ length: quantas }, (_, w) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + w * 7);
      return d.toISOString().slice(0, 10);
    });
  };

  const gerar = (quantasSemanas: number) => {
    const novas = somarSemanas(semana, quantasSemanas).map((semanaInicio, w) => {
      const porTurma: Record<string, Cardapio> = {};
      const avisos: string[] = [];
      turmasDoCliente.forEach((turma, idx) => {
        const { cardapio, avisos: av } = gerarCardapio({
          cliente,
          turma,
          pratos,
          semanaInicio,
          seed: Date.now() + w * 1000 + idx,
        });
        porTurma[turma.id] = cardapio;
        if (av.length > 0) avisos.push(`${turma.nome}: ${av.join(' ')}`);
      });
      return { semanaInicio, porTurma, avisos };
    });
    setSemanasGeradas(novas);
  };

  const salvarTudo = async () => {
    const cardapios = semanasGeradas.flatMap((s) => Object.values(s.porTurma));
    // Gravações sequenciais: o repositório local faz leitura-modificação-escrita
    // sobre um único array no localStorage; chamadas concorrentes se sobrescreveriam.
    for (const c of cardapios) {
      await salvarCardapio(c);
    }
    setSalvos(await listarCardapios(cliente.id));
    alert('Cardápio(s) salvo(s).');
  };

  const salvosTurma = salvos.filter((c) => c.turmaId);
  const semanasSalvas = [...new Set(salvosTurma.map((c) => c.semanaInicio))].sort().reverse();

  const verSemanaSalva = (semanaInicio: string) => {
    const porTurma: Record<string, Cardapio> = {};
    salvosTurma
      .filter((c) => c.semanaInicio === semanaInicio)
      .forEach((c) => {
        if (c.turmaId) porTurma[c.turmaId] = c;
      });
    setSemanasGeradas([{ semanaInicio, porTurma, avisos: [] }]);
    setSemana(semanaInicio);
  };

  return (
    <div>
      <div className="linha no-print">
        <div>
          <h1>Cardápio — {cliente.nome}</h1>
          <p className="subtitulo">
            {turmasDoCliente.length} turma(s) — geração automática por turma, respeitando
            dias de operação e restrições próprias de cada uma.
          </p>
        </div>
        <div className="acoes">
          <Link to="/clientes" className="btn secundario">
            ← Voltar
          </Link>
          {semanasGeradas.length > 0 && (
            <button className="btn secundario" onClick={() => window.print()}>
              🖨️ Imprimir / PDF
            </button>
          )}
        </div>
      </div>

      <div className="card no-print">
        <div className="linha">
          <div>
            <label>Semana inicial (segunda-feira de referência)</label>
            <input type="date" value={semana} onChange={(e) => setSemana(e.target.value)} />
          </div>
          <div className="acoes" style={{ marginTop: 20 }}>
            <button className="btn secundario" onClick={() => gerar(1)}>
              ⚙️ Gerar semana
            </button>
            <button className="btn" onClick={() => gerar(4)}>
              📅 Gerar mês (4 semanas)
            </button>
            {semanasGeradas.length > 0 && (
              <button className="btn secundario" onClick={salvarTudo}>
                Salvar
              </button>
            )}
          </div>
        </div>
      </div>

      {semanasGeradas.map((s) => (
        <div key={s.semanaInicio} className="semana-print-quebra">
          <h2 style={{ margin: '20px 0 8px' }}>Semana de {formatarData(s.semanaInicio)}</h2>
          {s.avisos.length > 0 && (
            <div className="aviso no-print">
              <strong>Atenção:</strong>
              <ul style={{ margin: '6px 0 0' }}>
                {s.avisos.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {turmasDoCliente.map((turma) => {
            const cardapio = s.porTurma[turma.id];
            if (!cardapio) return null;
            return (
              <div key={turma.id} className="card">
                <h3 style={{ marginTop: 0 }}>{turma.nome}</h3>
                <GradeTurma
                  cardapio={cardapio}
                  refeicoes={turma.refeicoes}
                  diasVisiveis={diasVisiveis}
                  nomeTipo={(tipoId) =>
                    tiposRefeicao.find((t) => t.id === tipoId)?.nome ?? tipoId
                  }
                  pratos={pratos}
                  onTrocar={(itemIdx, novoPratoId) =>
                    trocarPratoTurma(s.semanaInicio, turma.id, itemIdx, novoPratoId)
                  }
                />
              </div>
            );
          })}
        </div>
      ))}

      {semanasSalvas.length > 0 && (
        <div className="card no-print">
          <h3 style={{ marginTop: 0 }}>Semanas salvas</h3>
          <table>
            <thead>
              <tr>
                <th>Semana</th>
                <th>Turmas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {semanasSalvas.map((semanaInicio) => (
                <tr key={semanaInicio}>
                  <td>{formatarData(semanaInicio)}</td>
                  <td>{salvosTurma.filter((c) => c.semanaInicio === semanaInicio).length}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        className="btn pequeno secundario"
                        onClick={() => { verSemanaSalva(semanaInicio); setCopiandoSemana(null); }}
                      >
                        Ver
                      </button>
                      <button
                        className="btn pequeno secundario"
                        onClick={() => { setCopiandoSemana(semanaInicio); setSemanaDestinoCopia(adicionarSemanas(semanaInicio, 1)); }}
                      >
                        Copiar
                      </button>
                      {copiandoSemana === semanaInicio && (
                        <span style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="date"
                            value={semanaDestinoCopia}
                            onChange={(e) => setSemanaDestinoCopia(e.target.value)}
                            style={{ fontSize: 13 }}
                          />
                          <button className="btn pequeno" onClick={() => copiarSemanas(semanaInicio, semanaDestinoCopia, 1)}>
                            1 semana
                          </button>
                          <button className="btn pequeno" onClick={() => copiarSemanas(semanaInicio, semanaDestinoCopia, 4)}>
                            4 semanas
                          </button>
                          <button className="btn pequeno secundario" onClick={() => setCopiandoSemana(null)}>✕</button>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GradeTurma({
  cardapio,
  refeicoes,
  diasVisiveis,
  nomeTipo,
  pratos,
  onTrocar,
}: {
  cardapio: Cardapio;
  refeicoes: RefeicaoConfig[];
  diasVisiveis: { valor: number; nome: string; curto: string }[];
  nomeTipo: (tipoId: string) => string;
  pratos: Prato[];
  onTrocar: (itemIdx: number, novoPratoId: string) => void;
}) {
  const renderCelula = (dia: number, tipoId: string, categoria: string) => {
    const com = cardapio.itens
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.dia === dia && item.tipoRefeicaoId === tipoId && item.categoria === categoria);
    if (com.length === 0) return <span style={{ color: 'var(--cinza)' }}>—</span>;
    const pratosCategoria = pratos.filter((p) => p.ativo && p.categoria === categoria);
    return (
      <>
        {com.map(({ item, idx }, pos) => (
          <span key={idx}>
            {pos > 0 && <span style={{ color: 'var(--cinza)' }}>, </span>}
            <CelulaEditavel
              item={item}
              idx={idx}
              pratosCategoria={pratosCategoria}
              onTrocar={onTrocar}
            />
          </span>
        ))}
      </>
    );
  };

  return (
    <div className="cardapio-grid">
      <p style={{ fontSize: 12, color: 'var(--cinza)', margin: '0 0 8px' }}>
        Clique em qualquer prato para trocar manualmente.
      </p>
      <table>
        <thead>
          <tr>
            <th>Refeição</th>
            {diasVisiveis.map((d) => (
              <th key={d.valor}>{d.nome}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {refeicoes.map((ref) =>
            ref.composicao.map((comp, ci) => (
              <tr key={`${ref.tipoRefeicaoId}-${comp.categoria}-${ci}`}>
                <td>
                  {ci === 0 && <strong>{nomeTipo(ref.tipoRefeicaoId)}</strong>}
                  <div className="cat">{rotuloCategoria(comp.categoria)}</div>
                </td>
                {diasVisiveis.map((d) => (
                  <td key={d.valor}>
                    {renderCelula(d.valor, ref.tipoRefeicaoId, comp.categoria)}
                  </td>
                ))}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

