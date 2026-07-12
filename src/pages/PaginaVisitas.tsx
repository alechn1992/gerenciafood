import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import type { ItemVisita, SecaoVisita, TipoVisita, Visita } from '../domain/types';
import { TIPOS_VISITA } from '../domain/types';

const COR_TIPO: Record<TipoVisita, string> = {
  auditoria:  '#3b82f6',
  orientacao: '#8b5cf6',
  retorno:    '#f59e0b',
  outro:      '#6b7280',
};

const hoje = () => new Date().toISOString().slice(0, 10);

function visitaVazia(clienteId: string): Visita {
  return {
    id: crypto.randomUUID(),
    clienteId,
    profissionalId: '',
    data: hoje(),
    hora: '',
    consultor: '',
    emailConsultor: '',
    tipo: 'auditoria',
    observacoes: '',
    secoes: [],
    proximaVisita: '',
    criadoEm: new Date().toISOString(),
  };
}

function novaSecao(): SecaoVisita {
  return { id: crypto.randomUUID(), nome: '', itens: [] };
}

function novoItem(): ItemVisita {
  return { id: crypto.randomUUID(), descricao: '', status: 'conforme' };
}

export function PaginaVisitas() {
  const { clientes, profissionais, repo } = useData();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filtroCliente = params.get('cliente') ?? '';

  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [adicionando, setAdicionando] = useState(false);
  const [form, setForm] = useState<Visita | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const carregar = async (cId?: string) => {
    setCarregando(true);
    try {
      setVisitas(await repo.listarVisitas(cId || undefined));
    } catch {
      // erro silencioso
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar(filtroCliente);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCliente]);

  const abrirFormulario = () => {
    const cId = filtroCliente || (clientes[0]?.id ?? '');
    setForm(visitaVazia(cId));
    setAdicionando(true);
  };

  // --- Gerência de seções ---
  const addSecao = () =>
    setForm((f) => f && { ...f, secoes: [...f.secoes, novaSecao()] });

  const removeSecao = (sIdx: number) =>
    setForm((f) => f && { ...f, secoes: f.secoes.filter((_, i) => i !== sIdx) });

  const updateSecaoNome = (sIdx: number, nome: string) =>
    setForm((f) =>
      f && { ...f, secoes: f.secoes.map((s, i) => (i === sIdx ? { ...s, nome } : s)) },
    );

  const addItem = (sIdx: number) =>
    setForm((f) =>
      f && {
        ...f,
        secoes: f.secoes.map((s, i) =>
          i === sIdx ? { ...s, itens: [...s.itens, novoItem()] } : s,
        ),
      },
    );

  const removeItem = (sIdx: number, iIdx: number) =>
    setForm((f) =>
      f && {
        ...f,
        secoes: f.secoes.map((s, i) =>
          i === sIdx ? { ...s, itens: s.itens.filter((_, j) => j !== iIdx) } : s,
        ),
      },
    );

  const updateItemStatus = (sIdx: number, iIdx: number, status: ItemVisita['status']) =>
    setForm((f) =>
      f && {
        ...f,
        secoes: f.secoes.map((s, i) =>
          i === sIdx
            ? { ...s, itens: s.itens.map((it, j) => (j === iIdx ? { ...it, status } : it)) }
            : s,
        ),
      },
    );

  const updateItemDescricao = (sIdx: number, iIdx: number, descricao: string) =>
    setForm((f) =>
      f && {
        ...f,
        secoes: f.secoes.map((s, i) =>
          i === sIdx
            ? { ...s, itens: s.itens.map((it, j) => (j === iIdx ? { ...it, descricao } : it)) }
            : s,
        ),
      },
    );

  const salvar = async () => {
    if (!form || !form.clienteId || !form.data) return;
    setSalvando(true);
    try {
      await repo.salvarVisita({
        ...form,
        profissionalId: form.profissionalId || undefined,
        hora: form.hora || undefined,
        emailConsultor: form.emailConsultor || undefined,
        proximaVisita: form.proximaVisita || undefined,
      });
      setMsg({ tipo: 'ok', texto: 'Visita salva.' });
      setAdicionando(false);
      setForm(null);
      await carregar(filtroCliente);
    } catch (e: unknown) {
      const detalhe = e instanceof Error ? e.message : JSON.stringify(e);
      setMsg({ tipo: 'erro', texto: `Erro: ${detalhe}` });
    } finally {
      setSalvando(false);
      setTimeout(() => setMsg(null), 6000);
    }
  };

  const remover = async (v: Visita) => {
    const nomeCliente = clientes.find((c) => c.id === v.clienteId)?.nome ?? '';
    if (!confirm(`Remover a visita de ${formatarData(v.data)} para "${nomeCliente}"?`)) return;
    try {
      await repo.removerVisita(v.id);
      await carregar(filtroCliente);
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro ao remover.' });
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const nomeCliente = (id: string) => clientes.find((c) => c.id === id)?.nome ?? '—';

  const totalConformes = (v: Visita) =>
    v.secoes.reduce((acc, s) => acc + s.itens.filter((i) => i.status === 'conforme').length, 0);
  const totalNaoConformes = (v: Visita) =>
    v.secoes.reduce((acc, s) => acc + s.itens.filter((i) => i.status === 'nao_conforme').length, 0);

  return (
    <div>
      <div className="linha no-print">
        <div>
          <h1>Visitas</h1>
          <p className="subtitulo">Histórico de visitas de consultoria por cliente.</p>
        </div>
        <button className="btn" onClick={abrirFormulario}>+ Nova visita</button>
      </div>

      {/* Filtro */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Cliente:</label>
          <select
            value={filtroCliente}
            onChange={(e) => setParams(e.target.value ? { cliente: e.target.value } : {})}
            style={{ minWidth: 200 }}
          >
            <option value="">Todos os clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          {filtroCliente && (
            <button className="btn pequeno secundario" onClick={() => setParams({})}>
              Limpar filtro
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--cinza)' }}>
            {visitas.length} visita{visitas.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Formulário nova visita */}
      {adicionando && form && (
        <div className="card" style={{ border: '2px solid var(--primario)', marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Nova visita</h3>

          {/* Campos básicos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12 }}>Cliente *</label>
              <select
                value={form.clienteId}
                onChange={(e) => setForm((f) => f && { ...f, clienteId: e.target.value })}
              >
                <option value="">Selecione…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Data *</label>
              <input type="date" value={form.data}
                onChange={(e) => setForm((f) => f && { ...f, data: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Hora (ex: até 16:03h)</label>
              <input value={form.hora ?? ''}
                onChange={(e) => setForm((f) => f && { ...f, hora: e.target.value })}
                placeholder="ex: das 14h às 16h" />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Tipo</label>
              <select value={form.tipo}
                onChange={(e) => setForm((f) => f && { ...f, tipo: e.target.value as TipoVisita })}>
                {TIPOS_VISITA.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.nome}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12 }}>Profissional responsável</label>
              <select
                value={form.profissionalId ?? ''}
                onChange={(e) => {
                  const pid = e.target.value;
                  const prof = profissionais.find((p) => p.id === pid);
                  setForm((f) => f && {
                    ...f,
                    profissionalId: pid || undefined,
                    consultor: prof?.nome ?? f.consultor,
                    emailConsultor: prof?.email ?? f.emailConsultor,
                  });
                }}
              >
                <option value="">— Selecione ou preencha manualmente —</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}{p.registroCRN ? ` (${p.registroCRN})` : ''}{p.empresa ? ` — ${p.empresa}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Consultor(a)</label>
              <input value={form.consultor}
                onChange={(e) => setForm((f) => f && { ...f, consultor: e.target.value })}
                placeholder="Nome" />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>E-mail do consultor</label>
              <input type="email" value={form.emailConsultor ?? ''}
                onChange={(e) => setForm((f) => f && { ...f, emailConsultor: e.target.value })}
                placeholder="email@exemplo.com" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12 }}>Observações Gerais / Objetivo</label>
              <textarea value={form.observacoes}
                onChange={(e) => setForm((f) => f && { ...f, observacoes: e.target.value })}
                placeholder="Objetivo da visita, observações gerais…"
                rows={2} style={{ width: '100%', resize: 'vertical', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Próxima visita</label>
              <input type="date" value={form.proximaVisita ?? ''}
                onChange={(e) => setForm((f) => f && { ...f, proximaVisita: e.target.value })} />
            </div>
          </div>

          {/* Seções com itens ✔/✘ */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Itens verificados por seção</span>
              <button type="button" className="btn pequeno secundario" onClick={addSecao}>
                + Adicionar seção
              </button>
            </div>

            {form.secoes.map((secao, si) => (
              <div key={secao.id} style={{ border: '1px solid var(--borda)', borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ background: 'var(--fundo)', padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid var(--borda)' }}>
                  <input
                    value={secao.nome}
                    onChange={(e) => updateSecaoNome(si, e.target.value)}
                    placeholder="Nome da seção (ex: Cozinha, Berçário)"
                    style={{ flex: 1, fontWeight: 600 }}
                  />
                  <button type="button" className="btn pequeno perigo" onClick={() => removeSecao(si)}>✕</button>
                </div>

                <div style={{ padding: '10px 12px' }}>
                  {secao.itens.map((item, ii) => (
                    <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                      {/* Botões ✔ / ✘ */}
                      <div style={{ display: 'flex', gap: 4, paddingTop: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          title="Conforme"
                          onClick={() => updateItemStatus(si, ii, 'conforme')}
                          style={{
                            width: 30, height: 30, borderRadius: 6, border: '2px solid',
                            background: item.status === 'conforme' ? '#16a34a' : 'transparent',
                            borderColor: item.status === 'conforme' ? '#16a34a' : '#d1d5db',
                            color: item.status === 'conforme' ? 'white' : '#9ca3af',
                            cursor: 'pointer', fontWeight: 700, fontSize: 15, lineHeight: 1,
                          }}
                        >✔</button>
                        <button
                          type="button"
                          title="Não conforme"
                          onClick={() => updateItemStatus(si, ii, 'nao_conforme')}
                          style={{
                            width: 30, height: 30, borderRadius: 6, border: '2px solid',
                            background: item.status === 'nao_conforme' ? '#dc2626' : 'transparent',
                            borderColor: item.status === 'nao_conforme' ? '#dc2626' : '#d1d5db',
                            color: item.status === 'nao_conforme' ? 'white' : '#9ca3af',
                            cursor: 'pointer', fontWeight: 700, fontSize: 15, lineHeight: 1,
                          }}
                        >✘</button>
                      </div>
                      <textarea
                        value={item.descricao}
                        onChange={(e) => updateItemDescricao(si, ii, e.target.value)}
                        placeholder="Descrição do item verificado…"
                        rows={2}
                        style={{ flex: 1, fontSize: 13, resize: 'vertical' }}
                      />
                      <button
                        type="button"
                        className="btn pequeno perigo"
                        onClick={() => removeItem(si, ii)}
                        style={{ marginTop: 6, flexShrink: 0 }}
                      >✕</button>
                    </div>
                  ))}
                  <button type="button" className="btn pequeno secundario" onClick={() => addItem(si)}>
                    + Adicionar item
                  </button>
                </div>
              </div>
            ))}

            {form.secoes.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--cinza)', margin: '4px 0 0' }}>
                Clique em "+ Adicionar seção" para registrar os itens verificados durante a visita.
              </p>
            )}
          </div>

          <div className="acoes" style={{ marginTop: 16 }}>
            <button className="btn secundario" onClick={() => { setAdicionando(false); setForm(null); }}>
              Cancelar
            </button>
            <button className="btn" onClick={salvar} disabled={salvando || !form.clienteId || !form.data}>
              {salvando ? 'Salvando…' : '💾 Salvar visita'}
            </button>
            {msg && (
              <span className={msg.tipo === 'ok' ? 'login-aviso sucesso' : 'login-aviso erro'} style={{ alignSelf: 'center' }}>
                {msg.texto}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Lista */}
      {carregando ? (
        <p style={{ padding: 32, color: 'var(--cinza)' }}>Carregando…</p>
      ) : visitas.length === 0 ? (
        <div className="card vazio">
          {filtroCliente
            ? 'Nenhuma visita registrada para este cliente ainda.'
            : 'Nenhuma visita registrada. Clique em "+ Nova visita" para começar.'}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                {!filtroCliente && <th>Cliente</th>}
                <th>Tipo</th>
                <th>Consultor</th>
                <th style={{ textAlign: 'center' }}>✔</th>
                <th style={{ textAlign: 'center' }}>✘</th>
                <th>Próxima</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visitas.map((v) => (
                <tr key={v.id}>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{formatarData(v.data)}</td>
                  {!filtroCliente && (
                    <td>
                      <button className="btn pequeno secundario" style={{ padding: '2px 8px' }}
                        onClick={() => setParams({ cliente: v.clienteId })}>
                        {nomeCliente(v.clienteId)}
                      </button>
                    </td>
                  )}
                  <td>
                    <span style={{
                      background: COR_TIPO[v.tipo] + '22', color: COR_TIPO[v.tipo],
                      borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                      {TIPOS_VISITA.find((t) => t.valor === v.tipo)?.nome ?? v.tipo}
                    </span>
                  </td>
                  <td>{v.consultor || <span style={{ color: 'var(--cinza)' }}>—</span>}</td>
                  <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>
                    {totalConformes(v) > 0 ? totalConformes(v) : <span style={{ color: 'var(--cinza)' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>
                    {totalNaoConformes(v) > 0 ? totalNaoConformes(v) : <span style={{ color: 'var(--cinza)' }}>—</span>}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {v.proximaVisita ? formatarData(v.proximaVisita) : <span style={{ color: 'var(--cinza)' }}>—</span>}
                  </td>
                  <td>
                    <div className="acoes">
                      <button
                        className="btn pequeno secundario"
                        onClick={() => navigate(`/visitas/${v.id}`)}
                      >
                        Ver relatório →
                      </button>
                      <button className="btn pequeno perigo" onClick={() => remover(v)} title="Remover">✕</button>
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

function formatarData(iso?: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
