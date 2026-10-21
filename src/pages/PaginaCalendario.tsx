// Calendário de funcionamento do cliente: dias sem atendimento. Nesses dias o
// cardápio não é gerado e a folha das famílias mostra o motivo.

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import { useCalendario } from '../state/useCalendario';
import { feriadosNacionais, periodoDaData } from '../domain/calendario';
import type { PeriodoSemFuncionamento } from '../domain/types';

const MOTIVOS = ['FERIADO', 'RECESSO', 'FÉRIAS', 'ENTREGA DE PARECERES', 'PLANEJAMENTO'];
const OUTRO = '__outro__';

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Ex.: "seg 12/10/2026". */
function rotuloData(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return `${DIAS_CURTOS[d.getDay()]} ${d.toLocaleDateString('pt-BR')}`;
}

/** Quantos dias (corridos) o período cobre. */
function duracao(p: PeriodoSemFuncionamento): number {
  const ms = new Date(`${p.fim}T12:00:00`).getTime() - new Date(`${p.inicio}T12:00:00`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function PaginaCalendario() {
  const { id } = useParams();
  const { clientes, repo } = useData();
  const cliente = clientes.find((c) => c.id === id);
  const { periodos, erro: erroCarregar, recarregar } = useCalendario(id);

  const anoAtual = new Date().getFullYear();
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [motivoOutro, setMotivoOutro] = useState('');
  const [descricao, setDescricao] = useState('');
  const [anoFeriados, setAnoFeriados] = useState(anoAtual);
  const [anoFiltro, setAnoFiltro] = useState<number | 'todos'>(anoAtual);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!cliente) {
    return (
      <div className="card vazio">
        Cliente não encontrado. <Link to="/clientes">Voltar</Link>
      </div>
    );
  }

  const mensagem = (err: unknown) =>
    err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err);

  const avisar = (texto: string) => {
    setMsg(texto);
    setTimeout(() => setMsg(null), 4000);
  };

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const textoMotivo = (motivo === OUTRO ? motivoOutro : motivo).trim().toUpperCase();
    const fimEfetivo = fim || inicio;
    if (!inicio || !textoMotivo) return;
    if (fimEfetivo < inicio) {
      setErro('A data final não pode ser antes da inicial.');
      return;
    }
    try {
      await repo.salvarPeriodo({
        id: crypto.randomUUID(),
        clienteId: cliente!.id,
        inicio,
        fim: fimEfetivo,
        motivo: textoMotivo,
        descricao: descricao.trim() || undefined,
      });
      setInicio('');
      setFim('');
      setDescricao('');
      setMotivoOutro('');
      await recarregar();
      avisar('Período adicionado.');
    } catch (err) {
      setErro(`Não foi possível salvar: ${mensagem(err)}`);
    }
  }

  async function adicionarFeriados() {
    setErro(null);
    // Não duplica dia que já está no calendário (ex.: feriado já lançado como recesso).
    const novos = feriadosNacionais(anoFeriados).filter((f) => !periodoDaData(periodos, f.data));
    if (novos.length === 0) {
      avisar(`Os feriados nacionais de ${anoFeriados} já estão no calendário.`);
      return;
    }
    if (!confirm(`Adicionar ${novos.length} feriado(s) nacional(is) de ${anoFeriados}?\n\n${novos.map((f) => `• ${rotuloData(f.data)} — ${f.nome}`).join('\n')}`)) return;
    try {
      for (const f of novos) {
        await repo.salvarPeriodo({
          id: crypto.randomUUID(),
          clienteId: cliente!.id,
          inicio: f.data,
          fim: f.data,
          motivo: 'FERIADO',
          descricao: f.nome,
        });
      }
      await recarregar();
      setAnoFiltro(anoFeriados);
      avisar(`${novos.length} feriado(s) adicionado(s).`);
    } catch (err) {
      setErro(`Não foi possível salvar: ${mensagem(err)}`);
      await recarregar();
    }
  }

  async function remover(p: PeriodoSemFuncionamento) {
    const quando = p.inicio === p.fim ? rotuloData(p.inicio) : `${rotuloData(p.inicio)} a ${rotuloData(p.fim)}`;
    if (!confirm(`Remover "${p.motivo}" de ${quando}?`)) return;
    try {
      await repo.removerPeriodo(p.id);
      await recarregar();
    } catch (err) {
      setErro(`Não foi possível remover: ${mensagem(err)}`);
    }
  }

  const anos = [...new Set([anoAtual, ...periodos.flatMap((p) => [+p.inicio.slice(0, 4), +p.fim.slice(0, 4)])])].sort();
  const listados = periodos.filter(
    (p) => anoFiltro === 'todos' || (+p.inicio.slice(0, 4) <= anoFiltro && anoFiltro <= +p.fim.slice(0, 4)),
  );

  return (
    <div>
      <div className="linha" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Calendário de funcionamento — {cliente.nome}</h2>
          <p className="subtitulo">
            Dias sem atendimento (feriados, recessos, férias). Nesses dias o cardápio não é gerado e a
            folha das famílias mostra o motivo no lugar das refeições.
          </p>
        </div>
        <div className="acoes">
          <Link to="/clientes" className="btn secundario">← Clientes</Link>
          <Link to={`/clientes/${cliente.id}/cardapio`} className="btn secundario">Cardápio</Link>
        </div>
      </div>

      {erroCarregar && (
        <div className="aviso" style={{ marginBottom: 16 }}>
          <strong>O calendário não pôde ser carregado.</strong> Se esta é a primeira vez, aplique a
          migração <code>0022_calendario_cliente.sql</code> no SQL Editor do Supabase e recarregue a página.
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>{erroCarregar}</div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Adicionar dia ou período sem funcionamento</h3>
        <form onSubmit={adicionar}>
          <div className="grid cols-2">
            <div>
              <label>Data inicial</label>
              <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
            </div>
            <div>
              <label>Data final (deixe vazio para um dia só)</label>
              <input type="date" value={fim} min={inicio || undefined} onChange={(e) => setFim(e.target.value)} />
            </div>
            <div>
              <label>Motivo (aparece para as famílias)</label>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
                <option value={OUTRO}>Outro…</option>
              </select>
              {motivo === OUTRO && (
                <input
                  style={{ marginTop: 6 }}
                  value={motivoOutro}
                  onChange={(e) => setMotivoOutro(e.target.value)}
                  placeholder="Ex.: CONSELHO DE CLASSE"
                  maxLength={40}
                  required
                />
              )}
            </div>
            <div>
              <label>Descrição (opcional, só para você)</label>
              <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Recesso escolar de julho" maxLength={80} />
            </div>
          </div>
          <div className="acoes" style={{ marginTop: 12 }}>
            <button className="btn" type="submit">+ Adicionar</button>
            {msg && <span className="login-aviso sucesso" style={{ alignSelf: 'center' }}>✓ {msg}</span>}
          </div>
          {erro && <p className="login-aviso" style={{ marginTop: 8 }}>{erro}</p>}
        </form>

        <hr style={{ margin: '16px 0', border: 0, borderTop: '1px solid var(--borda)' }} />
        <div className="acoes" style={{ alignItems: 'center' }}>
          <span>Feriados nacionais de</span>
          <select value={anoFeriados} onChange={(e) => setAnoFeriados(+e.target.value)} style={{ width: 'auto' }}>
            {[anoAtual - 1, anoAtual, anoAtual + 1, anoAtual + 2].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button className="btn secundario" onClick={adicionarFeriados} type="button">
            📅 Adicionar feriados nacionais
          </button>
        </div>
        <p className="subtitulo" style={{ margin: '6px 0 0', fontSize: 13 }}>
          Inclui Carnaval e Corpus Christi (pontos facultativos). Feriados estaduais e municipais você
          adiciona acima.
        </p>
      </div>

      <div className="card">
        <div className="linha" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Dias sem funcionamento ({listados.length})</h3>
          <select
            value={anoFiltro}
            onChange={(e) => setAnoFiltro(e.target.value === 'todos' ? 'todos' : +e.target.value)}
            style={{ width: 'auto' }}
            aria-label="Ano"
          >
            {anos.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
            <option value="todos">Todos os anos</option>
          </select>
        </div>
        {listados.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>Nenhum dia sem funcionamento cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Motivo</th>
                <th>Descrição</th>
                <th style={{ width: 1 }} />
              </tr>
            </thead>
            <tbody>
              {listados.map((p) => (
                <tr key={p.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {p.inicio === p.fim ? (
                      rotuloData(p.inicio)
                    ) : (
                      <>
                        {rotuloData(p.inicio)} a {rotuloData(p.fim)}
                        <div style={{ fontSize: 12, color: 'var(--cinza)' }}>{duracao(p)} dias</div>
                      </>
                    )}
                  </td>
                  <td><span className="status-semana rascunho">{p.motivo}</span></td>
                  <td style={{ color: 'var(--cinza)' }}>{p.descricao ?? '—'}</td>
                  <td>
                    <button className="btn pequeno perigo" onClick={() => remover(p)}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
