import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import type { TipoVisita, Visita } from '../domain/types';
import { TIPOS_VISITA } from '../domain/types';

const COR_TIPO: Record<TipoVisita, string> = {
  auditoria:  '#3b82f6',
  orientacao: '#8b5cf6',
  retorno:    '#f59e0b',
  outro:      '#6b7280',
};

const hoje = () => new Date().toISOString().slice(0, 10);

function novaVisita(clienteId: string): Visita {
  return {
    id: crypto.randomUUID(),
    clienteId,
    data: hoje(),
    consultor: '',
    tipo: 'auditoria',
    observacoes: '',
    proximaVisita: '',
    criadoEm: new Date().toISOString(),
  };
}

export function PaginaVisitas() {
  const { clientes, repo } = useData();
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
      const lista = await repo.listarVisitas(cId || undefined);
      setVisitas(lista);
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
    setForm(novaVisita(cId));
    setAdicionando(true);
  };

  const salvar = async () => {
    if (!form || !form.clienteId || !form.data) return;
    setSalvando(true);
    try {
      await repo.salvarVisita({ ...form, proximaVisita: form.proximaVisita || undefined });
      setMsg({ tipo: 'ok', texto: 'Visita salva.' });
      setAdicionando(false);
      setForm(null);
      await carregar(filtroCliente);
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const remover = async (id: string, nomeCliente: string, dataVisita: string) => {
    if (!confirm(`Remover a visita de ${dataVisita} para "${nomeCliente}"?`)) return;
    try {
      await repo.removerVisita(id);
      await carregar(filtroCliente);
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro ao remover.' });
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const nomeCliente = (id: string) =>
    clientes.find((c) => c.id === id)?.nome ?? '—';

  const formatarData = (iso?: string) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div>
      <div className="linha no-print">
        <div>
          <h1>Visitas</h1>
          <p className="subtitulo">Histórico de visitas de consultoria por cliente.</p>
        </div>
        <div className="acoes">
          <button className="btn" onClick={abrirFormulario}>
            + Nova visita
          </button>
        </div>
      </div>

      {/* Filtro por cliente */}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
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
              <label style={{ fontSize: 12 }}>Data da visita *</label>
              <input
                type="date"
                value={form.data}
                onChange={(e) => setForm((f) => f && { ...f, data: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => f && { ...f, tipo: e.target.value as TipoVisita })}
              >
                {TIPOS_VISITA.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Consultor</label>
              <input
                value={form.consultor}
                onChange={(e) => setForm((f) => f && { ...f, consultor: e.target.value })}
                placeholder="Nome do consultor"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12 }}>Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm((f) => f && { ...f, observacoes: e.target.value })}
                placeholder="O que foi verificado, orientado ou constatado durante a visita…"
                rows={3}
                style={{ width: '100%', resize: 'vertical', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Próxima visita</label>
              <input
                type="date"
                value={form.proximaVisita ?? ''}
                onChange={(e) => setForm((f) => f && { ...f, proximaVisita: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Vincular checklist RDC 216</label>
              <select
                value={form.relatorioId ?? ''}
                onChange={(e) => setForm((f) => f && { ...f, relatorioId: e.target.value || undefined })}
              >
                <option value="">Nenhum</option>
                <option value="__link__" disabled>
                  — Salve e acesse o relatório do cliente —
                </option>
              </select>
              {form.clienteId && (
                <div style={{ marginTop: 4 }}>
                  <Link
                    to={`/clientes/${form.clienteId}/relatorio`}
                    style={{ fontSize: 12, color: 'var(--primario)' }}
                    target="_blank"
                  >
                    Abrir relatório do cliente →
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="acoes" style={{ marginTop: 16 }}>
            <button
              className="btn secundario"
              onClick={() => { setAdicionando(false); setForm(null); }}
            >
              Cancelar
            </button>
            <button
              className="btn"
              onClick={salvar}
              disabled={salvando || !form.clienteId || !form.data}
            >
              {salvando ? 'Salvando…' : '💾 Salvar visita'}
            </button>
            {msg && (
              <span
                className={msg.tipo === 'ok' ? 'login-aviso sucesso' : 'login-aviso erro'}
                style={{ alignSelf: 'center' }}
              >
                {msg.texto}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Lista de visitas */}
      {carregando ? (
        <p style={{ padding: 32, color: 'var(--cinza)' }}>Carregando…</p>
      ) : visitas.length === 0 ? (
        <div className="card vazio">
          {filtroCliente
            ? 'Nenhuma visita registrada para este cliente ainda.'
            : 'Nenhuma visita registrada ainda. Clique em "+ Nova visita" para começar.'}
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
                <th>Observações</th>
                <th>Próxima visita</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visitas.map((v) => (
                <tr key={v.id}>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {formatarData(v.data)}
                  </td>
                  {!filtroCliente && (
                    <td>
                      <button
                        className="btn pequeno secundario"
                        style={{ padding: '2px 8px' }}
                        onClick={() => setParams({ cliente: v.clienteId })}
                      >
                        {nomeCliente(v.clienteId)}
                      </button>
                    </td>
                  )}
                  <td>
                    <span
                      style={{
                        background: COR_TIPO[v.tipo] + '22',
                        color: COR_TIPO[v.tipo],
                        borderRadius: 12,
                        padding: '2px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {TIPOS_VISITA.find((t) => t.valor === v.tipo)?.nome ?? v.tipo}
                    </span>
                  </td>
                  <td>{v.consultor || <span style={{ color: 'var(--cinza)' }}>—</span>}</td>
                  <td style={{ maxWidth: 320 }}>
                    {v.observacoes ? (
                      <span style={{ fontSize: 13 }}>{v.observacoes}</span>
                    ) : (
                      <span style={{ color: 'var(--cinza)' }}>—</span>
                    )}
                    {v.relatorioId && (
                      <div style={{ marginTop: 4 }}>
                        <Link
                          to={`/clientes/${v.clienteId}/relatorio`}
                          style={{ fontSize: 12, color: 'var(--primario)' }}
                        >
                          📋 Ver checklist
                        </Link>
                      </div>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {v.proximaVisita ? (
                      <span style={{ fontSize: 13 }}>{formatarData(v.proximaVisita)}</span>
                    ) : (
                      <span style={{ color: 'var(--cinza)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn pequeno perigo"
                      onClick={() => remover(v.id, nomeCliente(v.clienteId), formatarData(v.data))}
                      title="Remover visita"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {msg && !adicionando && (
        <div
          className={msg.tipo === 'ok' ? 'login-aviso sucesso' : 'login-aviso erro'}
          style={{ marginTop: 12 }}
        >
          {msg.texto}
        </div>
      )}
    </div>
  );
}
