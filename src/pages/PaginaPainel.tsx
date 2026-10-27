// Painel unificado: conformidade dos checklists, plano de ação (checklist +
// visitas) e agenda de visitas, de todos os clientes ou de um só.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../state/DataContext';
import type { AcaoCorretiva, Cliente, Relatorio, Visita } from '../domain/types';
import { CHECKLIST_BOAS_PRATICAS, CHECKLIST_CEI_SESA_162 } from '../domain/legislacao';
import { origemDe, sincronizarPlano, situacaoAcao, type SituacaoAcao } from '../domain/planoAcao';
import { formatarData } from '../lib/datas';
import { ITENS_CHECKLIST, hojeISO } from '../state/usePlanoAcao';

interface DadosCliente {
  cliente: Cliente;
  checklists: Relatorio[]; // mais recente primeiro
  visitas: Visita[];
  acoes: AcaoCorretiva[];
}

/** Conformidade (%) de um checklist: conformes sobre os itens aplicáveis respondidos. */
function conformidade(r: Relatorio): number | null {
  const itens = (r.ehCei ? [...CHECKLIST_BOAS_PRATICAS, ...CHECKLIST_CEI_SESA_162] : CHECKLIST_BOAS_PRATICAS).flatMap(
    (b) => b.itens,
  );
  const aplic = itens.filter((i) => r.respostas[i.id] && r.respostas[i.id] !== 'na');
  if (aplic.length === 0) return null;
  return Math.round((aplic.filter((i) => r.respostas[i.id] === 'conforme').length / aplic.length) * 100);
}

const SITUACOES: { s: SituacaoAcao; rotulo: string }[] = [
  { s: 'atrasada', rotulo: 'Atrasadas' },
  { s: 'pendente', rotulo: 'Pendentes' },
  { s: 'em_andamento', rotulo: 'Em andamento' },
  { s: 'concluido', rotulo: 'Concluídas' },
];

function contarSituacoes(acoes: AcaoCorretiva[], hoje: string): Record<SituacaoAcao, number> {
  const c: Record<SituacaoAcao, number> = { atrasada: 0, pendente: 0, em_andamento: 0, concluido: 0 };
  for (const a of acoes) c[situacaoAcao(a, hoje)]++;
  return c;
}

function somarDias(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function diasEntre(de: string, ate: string): number {
  return Math.round((new Date(`${ate}T12:00:00`).getTime() - new Date(`${de}T12:00:00`).getTime()) / 86_400_000);
}

export function PaginaPainel() {
  const { clientes, repo, carregando: carregandoBase } = useData();
  const [dados, setDados] = useState<DadosCliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroCliente, setFiltroCliente] = useState('todos');
  const hoje = hojeISO();

  useEffect(() => {
    if (carregandoBase) return;
    (async () => {
      setCarregando(true);
      const todasVisitas = await repo.listarVisitas().catch(() => [] as Visita[]);
      const lista = await Promise.all(
        clientes.map(async (cliente): Promise<DadosCliente> => {
          const [checklists, plano] = await Promise.all([
            repo.listarRelatorios(cliente.id).catch(() => [] as Relatorio[]),
            repo.carregarPlanoAcao(cliente.id).catch(() => null),
          ]);
          const visitas = todasVisitas.filter((v) => v.clienteId === cliente.id);
          // Mesmo critério do plano de ação: inclui as não conformidades ainda sem ação.
          const acoes = sincronizarPlano(plano?.acoes ?? [], {
            checklists,
            itensChecklist: ITENS_CHECKLIST,
            visitas,
            hoje,
          });
          return { cliente, checklists, visitas, acoes };
        }),
      );
      setDados(lista.sort((a, b) => a.cliente.nome.localeCompare(b.cliente.nome)));
      setCarregando(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregandoBase, clientes]);

  const visiveis = useMemo(
    () => (filtroCliente === 'todos' ? dados : dados.filter((d) => d.cliente.id === filtroCliente)),
    [dados, filtroCliente],
  );

  const todasAcoes = visiveis.flatMap((d) => d.acoes.map((a) => ({ a, cliente: d.cliente })));
  const situacoes = contarSituacoes(todasAcoes.map((x) => x.a), hoje);
  const abertas = todasAcoes.length - situacoes.concluido;
  const ultimas = visiveis.map((d) => (d.checklists[0] ? conformidade(d.checklists[0]) : null)).filter((x): x is number => x !== null);
  const mediaConformidade = ultimas.length > 0 ? Math.round(ultimas.reduce((s, x) => s + x, 0) / ultimas.length) : null;
  const visitas30 = visiveis.flatMap((d) => d.visitas).filter((v) => v.data <= hoje && v.data >= somarDias(hoje, -30)).length;

  const atrasadas = todasAcoes
    .filter(({ a }) => situacaoAcao(a, hoje) === 'atrasada')
    .sort((x, y) => x.a.prazo.localeCompare(y.a.prazo));

  const proximasVisitas = visiveis
    .map((d) => {
      const futuras = d.visitas
        .map((v) => v.proximaVisita)
        .filter((p): p is string => !!p && p >= hoje)
        .sort();
      return futuras[0] ? { cliente: d.cliente, data: futuras[0] } : null;
    })
    .filter((x): x is { cliente: Cliente; data: string } => !!x)
    .sort((a, b) => a.data.localeCompare(b.data));

  if (carregando || carregandoBase) {
    return <p style={{ padding: 32, color: 'var(--cinza)' }}>Carregando painel…</p>;
  }

  return (
    <div>
      <div className="linha" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Painel</h1>
          <p className="subtitulo" style={{ margin: 0 }}>
            Conformidade dos checklists, plano de ação (checklist e visitas) e agenda de visitas.
          </p>
        </div>
        <select
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
          style={{ width: 'auto', minWidth: 220 }}
          aria-label="Cliente"
        >
          <option value="todos">Todos os clientes</option>
          {dados.map((d) => (
            <option key={d.cliente.id} value={d.cliente.id}>{d.cliente.nome}</option>
          ))}
        </select>
      </div>

      {/* Indicadores */}
      <div className="painel-indicadores">
        <Indicador
          titulo="Conformidade média"
          valor={mediaConformidade === null ? '—' : `${mediaConformidade}%`}
          detalhe={`último checklist de ${ultimas.length} cliente(s)`}
        />
        <Indicador titulo="Ações abertas" valor={String(abertas)} detalhe={`de ${todasAcoes.length} no plano`} />
        <Indicador
          titulo="Ações atrasadas"
          valor={String(situacoes.atrasada)}
          detalhe="prazo vencido"
          alerta={situacoes.atrasada > 0}
        />
        <Indicador
          titulo="Concluídas"
          valor={todasAcoes.length > 0 ? `${Math.round((situacoes.concluido / todasAcoes.length) * 100)}%` : '—'}
          detalhe={`${situacoes.concluido} ação(ões)`}
        />
        <Indicador titulo="Visitas" valor={String(visitas30)} detalhe="nos últimos 30 dias" />
      </div>

      {/* Situação das ações */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Situação das ações corretivas</h3>
        {todasAcoes.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>Nenhuma ação no plano ainda.</p>
        ) : (
          <>
            <BarraSituacoes contagem={situacoes} total={todasAcoes.length} alta />
            <div className="painel-legenda">
              {SITUACOES.map(({ s, rotulo }) => (
                <span key={s}>
                  <i className={`painel-cor ${s}`} /> {rotulo}: <strong>{situacoes[s]}</strong>
                </span>
              ))}
              <span style={{ color: 'var(--cinza)' }}>
                Do checklist: {todasAcoes.filter(({ a }) => origemDe(a) === 'checklist').length} · das visitas:{' '}
                {todasAcoes.filter(({ a }) => origemDe(a) === 'visita').length} · manuais:{' '}
                {todasAcoes.filter(({ a }) => origemDe(a) === 'manual').length}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Por cliente */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Por cliente</h3>
        {visiveis.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>Nenhum cliente cadastrado.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="painel-tabela">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Último checklist</th>
                  <th>Evolução da conformidade</th>
                  <th>Ações corretivas</th>
                  <th>Visitas</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visiveis.map((d) => {
                  const ultimo = d.checklists[0];
                  const pct = ultimo ? conformidade(ultimo) : null;
                  const cont = contarSituacoes(d.acoes, hoje);
                  const ultimaVisita = [...d.visitas].sort((a, b) => b.data.localeCompare(a.data))[0];
                  const proxima = proximasVisitas.find((p) => p.cliente.id === d.cliente.id);
                  return (
                    <tr key={d.cliente.id}>
                      <td><strong>{d.cliente.nome}</strong></td>
                      <td>
                        {ultimo ? (
                          <>
                            <div style={{ fontSize: 20, fontWeight: 700 }}>{pct === null ? '—' : `${pct}%`}</div>
                            <div style={{ fontSize: 12, color: 'var(--cinza)' }}>{formatarData(ultimo.dataAvaliacao)}</div>
                          </>
                        ) : (
                          <span style={{ color: 'var(--cinza)' }}>Sem checklist</span>
                        )}
                      </td>
                      <td>
                        <Evolucao checklists={d.checklists} />
                      </td>
                      <td style={{ minWidth: 180 }}>
                        {d.acoes.length === 0 ? (
                          <span style={{ color: 'var(--cinza)' }}>Nenhuma</span>
                        ) : (
                          <>
                            <BarraSituacoes contagem={cont} total={d.acoes.length} />
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                              {d.acoes.length - cont.concluido} aberta(s)
                              {cont.atrasada > 0 && <strong style={{ color: 'var(--tom-vermelho-texto, #9a2f1c)' }}> · {cont.atrasada} atrasada(s)</strong>}
                              {' · '}
                              {cont.concluido} concluída(s)
                            </div>
                          </>
                        )}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        <div>Última: {ultimaVisita ? formatarData(ultimaVisita.data) : '—'}</div>
                        <div>Próxima: {proxima ? formatarData(proxima.data) : '—'}</div>
                      </td>
                      <td>
                        <div className="acoes" style={{ flexWrap: 'nowrap' }}>
                          <Link className="btn pequeno secundario" to={`/clientes/${d.cliente.id}/plano-acao`}>Plano</Link>
                          <Link className="btn pequeno secundario" to={`/clientes/${d.cliente.id}/relatorio`}>Checklist</Link>
                          <Link className="btn pequeno secundario" to={`/visitas?cliente=${d.cliente.id}`}>Visitas</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="painel-colunas">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Ações atrasadas ({atrasadas.length})</h3>
          {atrasadas.length === 0 ? (
            <p className="subtitulo" style={{ margin: 0 }}>Nenhuma ação com prazo vencido. 👍</p>
          ) : (
            <ul className="painel-lista">
              {atrasadas.slice(0, 12).map(({ a, cliente }, i) => (
                <li key={i}>
                  <div>
                    <strong>{a.itemTexto || 'Ação manual'}</strong>
                    <div style={{ fontSize: 12, color: 'var(--cinza)' }}>
                      {cliente.nome} · {a.responsavel || 'sem responsável'} · prazo {formatarData(a.prazo)} (
                      {diasEntre(a.prazo, hoje)} dia(s) de atraso)
                    </div>
                  </div>
                  <Link className="btn pequeno secundario" to={`/clientes/${cliente.id}/plano-acao`}>Abrir</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Próximas visitas</h3>
          {proximasVisitas.length === 0 ? (
            <p className="subtitulo" style={{ margin: 0 }}>Nenhuma próxima visita agendada.</p>
          ) : (
            <ul className="painel-lista">
              {proximasVisitas.slice(0, 12).map((p) => (
                <li key={p.cliente.id}>
                  <div>
                    <strong>{formatarData(p.data)}</strong> — {p.cliente.nome}
                    <div style={{ fontSize: 12, color: 'var(--cinza)' }}>
                      {diasEntre(hoje, p.data) === 0 ? 'hoje' : `em ${diasEntre(hoje, p.data)} dia(s)`}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Indicador({ titulo, valor, detalhe, alerta }: { titulo: string; valor: string; detalhe: string; alerta?: boolean }) {
  return (
    <div className={`painel-indicador${alerta ? ' alerta' : ''}`}>
      <div className="painel-indicador-titulo">
        {alerta && <span aria-hidden>⚠️ </span>}
        {titulo}
      </div>
      <div className="painel-indicador-valor">{valor}</div>
      <div className="painel-indicador-detalhe">{detalhe}</div>
    </div>
  );
}

/** Barra empilhada das situações, com o número de cada parte no tooltip. */
function BarraSituacoes({ contagem, total, alta }: { contagem: Record<SituacaoAcao, number>; total: number; alta?: boolean }) {
  return (
    <div className={`painel-barra${alta ? ' alta' : ''}`} role="img" aria-label={SITUACOES.map(({ s, rotulo }) => `${rotulo}: ${contagem[s]}`).join(', ')}>
      {SITUACOES.filter(({ s }) => contagem[s] > 0).map(({ s, rotulo }) => (
        <div
          key={s}
          className={`painel-cor ${s}`}
          style={{ flexGrow: contagem[s] }}
          title={`${rotulo}: ${contagem[s]} de ${total} (${Math.round((contagem[s] / total) * 100)}%)`}
        />
      ))}
    </div>
  );
}

/** Colunas com a conformidade dos últimos checklists (mais antigo à esquerda). */
function Evolucao({ checklists }: { checklists: Relatorio[] }) {
  const pontos = checklists
    .slice(0, 6)
    .reverse()
    .map((r) => ({ data: r.dataAvaliacao, pct: conformidade(r) }));
  if (pontos.length === 0) return <span style={{ color: 'var(--cinza)' }}>—</span>;
  return (
    <div className="painel-evolucao" role="img" aria-label={pontos.map((p) => `${formatarData(p.data)}: ${p.pct ?? '—'}%`).join(', ')}>
      {pontos.map((p, i) => (
        <div key={i} className="painel-evolucao-col" title={`${formatarData(p.data)}: ${p.pct === null ? 'sem respostas' : `${p.pct}%`}`}>
          <div className="painel-evolucao-barra" style={{ height: `${Math.max(p.pct ?? 0, 2)}%` }} />
          <span>{formatarData(p.data).slice(0, 5)}</span>
        </div>
      ))}
    </div>
  );
}
