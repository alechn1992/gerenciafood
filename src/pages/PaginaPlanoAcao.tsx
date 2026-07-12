import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import type { AcaoCorretiva, PlanoAcao, StatusAcao } from '../domain/types';
import {
  CHECKLIST_BOAS_PRATICAS,
  CHECKLIST_CEI_SESA_162,
} from '../domain/legislacao';
const COR_STATUS: Record<StatusAcao, string> = {
  pendente: '#e53935',
  em_andamento: '#f59e0b',
  concluido: '#16a34a',
};

const ROTULO_STATUS: Record<StatusAcao, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
};

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
  const { repo } = useData();
  const [acoes, setAcoes] = useState<AcaoCorretiva[]>([]);
  const [planoId] = useState(() => crypto.randomUUID());
  const [relatorioId, setRelatorioId] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const [rel, plano] = await Promise.all([
        repo.carregarRelatorio(clienteId),
        repo.carregarPlanoAcao(clienteId),
      ]);

      if (plano) {
        setAcoes(plano.acoes);
        setRelatorioId(plano.relatorioId);
        setCarregando(false);
        return;
      }

      // Gera plano inicial a partir das não conformidades do relatório
      if (rel) {
        setRelatorioId(rel.id);
        const todosItens = [
          ...CHECKLIST_BOAS_PRATICAS,
          ...CHECKLIST_CEI_SESA_162,
        ].flatMap((b) => b.itens);

        const prazoDefault = (() => {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          return d.toISOString().slice(0, 10);
        })();

        const novasAcoes: AcaoCorretiva[] = todosItens
          .filter((item) => rel.respostas[item.id] === 'nao_conforme')
          .map((item) => ({
            itemId: item.id,
            itemTexto: item.texto,
            acao: '',
            responsavel: '',
            prazo: prazoDefault,
            status: 'pendente' as StatusAcao,
            observacao: rel.observacoes[item.id] ?? '',
          }));
        setAcoes(novasAcoes);
      }
      setCarregando(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const atualizar = (idx: number, campo: keyof AcaoCorretiva, valor: string) => {
    setAcoes((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [campo]: valor } : a)),
    );
  };

  const adicionarManual = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setAcoes((prev) => [
      ...prev,
      {
        itemId: `manual-${Date.now()}`,
        itemTexto: '',
        acao: '',
        responsavel: '',
        prazo: d.toISOString().slice(0, 10),
        status: 'pendente',
        observacao: '',
      },
    ]);
  };

  const remover = (idx: number) => {
    setAcoes((prev) => prev.filter((_, i) => i !== idx));
  };

  const salvar = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const plano: PlanoAcao = {
        id: planoId,
        clienteId,
        relatorioId,
        acoes,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      await repo.salvarPlanoAcao(plano);
      setMsg({ tipo: 'ok', texto: 'Plano de ação salvo.' });
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const pendentes = acoes.filter((a) => a.status === 'pendente').length;
  const emAndamento = acoes.filter((a) => a.status === 'em_andamento').length;
  const concluidos = acoes.filter((a) => a.status === 'concluido').length;
  const pct = acoes.length > 0 ? Math.round((concluidos / acoes.length) * 100) : 0;

  if (carregando) {
    return <p style={{ padding: 32, color: 'var(--cinza)' }}>Carregando…</p>;
  }

  return (
    <div>
      <div className="linha no-print">
        <div>
          <h1>Plano de Ação — {clienteNome}</h1>
          <p className="subtitulo">
            Ações corretivas para as não conformidades identificadas no checklist.
          </p>
        </div>
        <div className="acoes">
          <Link to={`/clientes/${clienteId}/relatorio`} className="btn secundario">
            ← Relatório
          </Link>
          <button className="btn secundario no-print" onClick={() => window.print()}>
            🖨️ Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="card">
        <div className="linha" style={{ flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Indicador titulo="Total" valor={String(acoes.length)} />
            <Indicador titulo="Pendente" valor={String(pendentes)} cor={COR_STATUS.pendente} />
            <Indicador titulo="Em andamento" valor={String(emAndamento)} cor={COR_STATUS.em_andamento} />
            <Indicador titulo="Concluído" valor={String(concluidos)} cor={COR_STATUS.concluido} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>Progresso</span>
              <strong>{pct}%</strong>
            </div>
            <div style={{ background: 'var(--borda)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: COR_STATUS.concluido, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
      </div>

      {acoes.length === 0 && (
        <div className="card vazio">
          {relatorioId
            ? 'Nenhuma não conformidade encontrada no relatório. Use o botão abaixo para adicionar ações manuais.'
            : 'Nenhum relatório salvo para este cliente. Preencha o checklist primeiro.'}
        </div>
      )}

      {/* Tabela de ações */}
      {acoes.map((a, idx) => (
        <div key={a.itemId + idx} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              {a.itemTexto ? (
                <p style={{ margin: 0, fontWeight: 500 }}>{a.itemTexto}</p>
              ) : (
                <input
                  placeholder="Descrição da não conformidade"
                  value={a.itemTexto}
                  onChange={(e) => atualizar(idx, 'itemTexto', e.target.value)}
                  style={{ width: '100%', fontWeight: 500 }}
                />
              )}
            </div>
            <span
              style={{
                background: COR_STATUS[a.status] + '22',
                color: COR_STATUS[a.status],
                borderRadius: 12,
                padding: '2px 10px',
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {ROTULO_STATUS[a.status]}
            </span>
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
                onChange={(e) => atualizar(idx, 'acao', e.target.value)}
                placeholder="O que será feito…"
                rows={2}
                style={{ width: '100%', resize: 'vertical', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Responsável</label>
              <input
                value={a.responsavel}
                onChange={(e) => atualizar(idx, 'responsavel', e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Prazo</label>
              <input
                type="date"
                value={a.prazo}
                onChange={(e) => atualizar(idx, 'prazo', e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Status</label>
              <select
                value={a.status}
                onChange={(e) => atualizar(idx, 'status', e.target.value as StatusAcao)}
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
            {(a.observacao !== undefined) && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12 }}>Observação</label>
                <input
                  value={a.observacao ?? ''}
                  onChange={(e) => atualizar(idx, 'observacao', e.target.value)}
                  placeholder="Observações adicionais"
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Ações rodapé */}
      <div className="acoes no-print" style={{ marginTop: 16 }}>
        <button className="btn secundario" onClick={adicionarManual}>
          + Adicionar ação manual
        </button>
        <button className="btn" onClick={salvar} disabled={salvando || acoes.length === 0}>
          {salvando ? 'Salvando…' : '💾 Salvar plano'}
        </button>
        {msg && (
          <span className={msg.tipo === 'ok' ? 'login-aviso sucesso' : 'login-aviso erro'} style={{ alignSelf: 'center' }}>
            {msg.texto}
          </span>
        )}
      </div>

      {/* Rodapé de impressão */}
      <div className="print-only" style={{ marginTop: 40, fontSize: 12, color: '#666' }}>
        Gerado em {new Date().toLocaleDateString('pt-BR')} — GerenciaFood
      </div>
    </div>
  );
}

function Indicador({ titulo, valor, cor }: { titulo: string; valor: string; cor?: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 70 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: cor ?? 'var(--texto)' }}>{valor}</div>
      <div style={{ fontSize: 12, color: 'var(--cinza)' }}>{titulo}</div>
    </div>
  );
}
