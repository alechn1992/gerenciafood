import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import type { AcaoCorretiva, OrigemAcao, StatusAcao } from '../domain/types';
import { chaveAcao, origemDe, resumoAcoes, situacaoAcao, type SituacaoAcao } from '../domain/planoAcao';
import { formatarData } from '../lib/datas';
import { hojeISO, usePlanoAcao } from '../state/usePlanoAcao';
import { SeloSituacao } from './AcaoInline';

const ROTULO_ORIGEM: Record<OrigemAcao, string> = {
  checklist: 'Checklist',
  visita: 'Visita',
  manual: 'Manual',
};

/** Ordem de exibição: o que exige atenção primeiro. */
const ORDEM: Record<SituacaoAcao, number> = { atrasada: 0, pendente: 1, em_andamento: 2, concluido: 3 };

export function PaginaPlanoAcao() {
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

  return <PlanoAcaoCliente clienteId={cliente.id} clienteNome={cliente.nome} />;
}

function PlanoAcaoCliente({ clienteId, clienteNome }: { clienteId: string; clienteNome: string }) {
  const plano = usePlanoAcao(clienteId);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [filtroSituacao, setFiltroSituacao] = useState<'abertas' | SituacaoAcao | 'todas'>('abertas');
  const [filtroOrigem, setFiltroOrigem] = useState<OrigemAcao | 'todas'>('todas');
  const hoje = hojeISO();

  const resumo = resumoAcoes(plano.acoes, hoje);

  const listadas = useMemo(
    () =>
      plano.acoes
        .map((a, idx) => ({ a, idx, s: situacaoAcao(a, hoje) }))
        .filter(({ a, s }) => {
          if (filtroOrigem !== 'todas' && origemDe(a) !== filtroOrigem) return false;
          if (filtroSituacao === 'todas') return true;
          if (filtroSituacao === 'abertas') return s !== 'concluido';
          return s === filtroSituacao;
        })
        .sort((x, y) => ORDEM[x.s] - ORDEM[y.s] || (x.a.prazo ?? '').localeCompare(y.a.prazo ?? '')),
    [plano.acoes, filtroOrigem, filtroSituacao, hoje],
  );

  const atualizar = (a: AcaoCorretiva, campos: Partial<AcaoCorretiva>) =>
    plano.atualizarAcao(chaveAcao(a), campos);

  const adicionarManual = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    plano.substituirAcoes([
      ...plano.acoes,
      {
        itemId: `manual-${Date.now()}`,
        itemTexto: '',
        acao: '',
        responsavel: '',
        prazo: d.toISOString().slice(0, 10),
        status: 'pendente',
        observacao: '',
        origem: 'manual',
      },
    ]);
    setFiltroSituacao('abertas');
    setFiltroOrigem('todas');
  };

  const remover = (idx: number) => {
    if (!confirm('Remover esta ação do plano?')) return;
    plano.substituirAcoes(plano.acoes.filter((_, i) => i !== idx));
  };

  const salvar = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      await plano.salvar();
      setMsg({ tipo: 'ok', texto: 'Plano de ação salvo.' });
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  if (plano.carregando) {
    return <p style={{ padding: 32, color: 'var(--cinza)' }}>Carregando…</p>;
  }

  const origemTexto = (a: AcaoCorretiva) => {
    const o = origemDe(a);
    return a.origemData ? `${ROTULO_ORIGEM[o]} de ${formatarData(a.origemData)}` : ROTULO_ORIGEM[o];
  };

  return (
    <div>
      <div className="linha no-print">
        <div>
          <h1>Plano de Ação — {clienteNome}</h1>
          <p className="subtitulo">
            Ações corretivas para as não conformidades do checklist de boas práticas e das visitas.
            Quando o item volta a ficar conforme, a ação é concluída sozinha.
          </p>
        </div>
        <div className="acoes">
          <Link to="/painel" className="btn secundario">📊 Painel</Link>
          <Link to={`/clientes/${clienteId}/relatorio`} className="btn secundario">Checklist</Link>
          <Link to={`/visitas?cliente=${clienteId}`} className="btn secundario">Visitas</Link>
          <button className="btn secundario no-print" onClick={() => window.print()}>
            🖨️ Imprimir / PDF
          </button>
        </div>
      </div>

      {plano.sujo && (
        <div className="aviso no-print" style={{ marginBottom: 12 }}>
          Há mudanças no plano ainda não salvas (inclusive não conformidades trazidas do checklist
          ou das visitas). Clique em <strong>💾 Salvar plano</strong>.
        </div>
      )}

      {/* Resumo */}
      <div className="card">
        <div className="linha" style={{ flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Indicador titulo="Total" valor={resumo.total} />
            <Indicador titulo="Pendentes" valor={resumo.pendentes} cor="var(--tom-amarelo-texto, #6b4a00)" />
            <Indicador titulo="Em andamento" valor={resumo.emAndamento} cor="var(--tom-azul-texto, #1f4f99)" />
            <Indicador titulo="Concluídas" valor={resumo.concluidas} cor="var(--tom-verde-texto, #1e6b3f)" />
            <Indicador titulo="Atrasadas" valor={resumo.atrasadas} cor="var(--tom-vermelho-texto, #b3261e)" destaque={resumo.atrasadas > 0} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>Concluídas</span>
              <strong>{resumo.progresso}%</strong>
            </div>
            <div className="barra-progresso">
              <div style={{ width: `${resumo.progresso}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="filtros-pratos no-print">
        <select value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value as typeof filtroSituacao)} aria-label="Situação">
          <option value="abertas">Abertas (não concluídas)</option>
          <option value="atrasada">Só atrasadas</option>
          <option value="pendente">Só pendentes</option>
          <option value="em_andamento">Só em andamento</option>
          <option value="concluido">Só concluídas</option>
          <option value="todas">Todas</option>
        </select>
        <select value={filtroOrigem} onChange={(e) => setFiltroOrigem(e.target.value as typeof filtroOrigem)} aria-label="Origem">
          <option value="todas">Checklist, visitas e manuais</option>
          <option value="checklist">Só do checklist</option>
          <option value="visita">Só das visitas</option>
          <option value="manual">Só manuais</option>
        </select>
        <span style={{ fontSize: 13, color: 'var(--cinza)' }}>
          {listadas.length} de {plano.acoes.length} ação(ões)
        </span>
      </div>

      {plano.acoes.length === 0 && (
        <div className="card vazio">
          {plano.checklists.length > 0 || plano.visitas.length > 0
            ? 'Nenhuma não conformidade no checklist mais recente nem nas visitas. Use o botão abaixo para adicionar ações manuais.'
            : 'Nenhum checklist ou visita registrada para este cliente ainda.'}
        </div>
      )}
      {plano.acoes.length > 0 && listadas.length === 0 && (
        <div className="card vazio">Nenhuma ação com esses filtros.</div>
      )}

      {listadas.map(({ a, idx }) => (
        <div key={chaveAcao(a)} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--cinza)', marginBottom: 2 }}>
                {origemTexto(a)}
                {a.resolvidoEm && ` · ficou conforme em ${formatarData(a.resolvidoEm)}`}
              </div>
              {a.itemTexto || origemDe(a) !== 'manual' ? (
                <p style={{ margin: 0, fontWeight: 500 }}>{a.itemTexto}</p>
              ) : (
                <input
                  placeholder="Descrição da não conformidade"
                  value={a.itemTexto}
                  onChange={(e) => atualizar(a, { itemTexto: e.target.value })}
                  style={{ width: '100%', fontWeight: 500 }}
                />
              )}
            </div>
            <SeloSituacao acao={a} />
            <button
              className="btn pequeno secundario no-print"
              onClick={() => remover(idx)}
              title="Remover ação"
              style={{ flexShrink: 0 }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12 }}>Ação corretiva</label>
              <textarea
                value={a.acao}
                onChange={(e) => atualizar(a, { acao: e.target.value })}
                placeholder="O que será feito…"
                rows={2}
                style={{ width: '100%', resize: 'vertical', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Responsável</label>
              <input value={a.responsavel} onChange={(e) => atualizar(a, { responsavel: e.target.value })} placeholder="Nome do responsável" />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Prazo</label>
              <input type="date" value={a.prazo} onChange={(e) => atualizar(a, { prazo: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Status</label>
              <select value={a.status} onChange={(e) => atualizar(a, { status: e.target.value as StatusAcao })}>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluída</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12 }}>Observação</label>
              <input value={a.observacao ?? ''} onChange={(e) => atualizar(a, { observacao: e.target.value })} placeholder="Observações adicionais" />
            </div>
          </div>
        </div>
      ))}

      <div className="acoes no-print" style={{ marginTop: 16 }}>
        <button className="btn secundario" onClick={adicionarManual}>
          + Adicionar ação manual
        </button>
        <button className="btn" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando…' : '💾 Salvar plano'}
        </button>
        {msg && (
          <span className={msg.tipo === 'ok' ? 'login-aviso sucesso' : 'login-aviso erro'} style={{ alignSelf: 'center' }}>
            {msg.texto}
          </span>
        )}
      </div>

      <div className="print-only" style={{ marginTop: 40, fontSize: 12, color: '#666' }}>
        Gerado em {new Date().toLocaleDateString('pt-BR')} — GerenciaFood
      </div>
    </div>
  );
}

function Indicador({ titulo, valor, cor, destaque }: { titulo: string; valor: number; cor?: string; destaque?: boolean }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 70, padding: destaque ? '0 8px' : undefined, borderRadius: 8, background: destaque ? 'var(--tom-vermelho-bg, #fde8e4)' : undefined }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: cor ?? 'var(--texto)' }}>{valor}</div>
      <div style={{ fontSize: 12, color: 'var(--cinza)' }}>{titulo}</div>
    </div>
  );
}
