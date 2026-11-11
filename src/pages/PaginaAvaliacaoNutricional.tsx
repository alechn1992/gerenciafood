// Avaliação nutricional: a nutricionista cadastra as crianças da escola por
// turma (Berçário a Infantil 5), registra peso e altura quantas vezes quiser
// (uma a uma ou a turma inteira), e o sistema calcula IMC e escores-z pelas
// curvas da OMS, classifica (Ministério da Saúde), mostra a curva e monta os
// relatórios da turma e individuais em PDF.

import { useEffect, useMemo, useState } from 'react';
import { useData } from '../state/DataContext';
import type { Crianca, MedidaAntropometrica } from '../domain/types';
import {
  avaliacaoEmTexto,
  avaliarMedida,
  carregarTabelasOms,
  classificarEstatura,
  classificarImc,
  classificarPeso,
  idadeEmDias,
  idadePorExtenso,
  type Classificacao,
  type Indicador,
  type TabelasOms,
} from '../domain/antropometria';
import {
  agendaDaCrianca,
  avaliarTodas,
  GRUPOS_CRIANCA,
  ordemGrupo,
  PERIODICIDADES,
  SEM_GRUPO,
  sugerirGrupo,
  type Avaliada,
} from '../domain/relatorioNutricional';
import { GraficoCrescimento, type PontoCrianca } from '../components/GraficoCrescimento';
import { AvaliarTurma } from '../components/avaliacao/AvaliarTurma';
import { RelatorioNutricional, type PedidoRelatorio } from '../components/avaliacao/RelatorioNutricional';
import { dataBr, hoje, lerDecimal, num, problemasDaMedida, Selo, ultimoDe } from '../components/avaliacao/comum';

const CHAVE_CLIENTE = 'gf:avaliacao-cliente';
const chavePeriodicidade = (clienteId: string) => `gf:avaliacao-periodicidade:${clienteId}`;

type Aba = 'criancas' | 'turma' | 'relatorios';

const ler = (chave: string) => {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
};
const gravar = (chave: string, valor: string) => {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // sem armazenamento: só não lembra a escolha
  }
};

export function PaginaAvaliacaoNutricional() {
  const { clientes, repo } = useData();
  const [clienteId, setClienteId] = useState<string>(() => ler(CHAVE_CLIENTE) ?? '');
  const [aba, setAba] = useState<Aba>('criancas');
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [medidas, setMedidas] = useState<MedidaAntropometrica[]>([]);
  const [tabelas, setTabelas] = useState<TabelasOms | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [editando, setEditando] = useState<Crianca | null>(null);
  const [pedido, setPedido] = useState<PedidoRelatorio | undefined>();
  const [periodicidade, setPeriodicidade] = useState(3);

  const cliente = clientes.find((c) => c.id === clienteId) ?? clientes[0];

  useEffect(() => {
    carregarTabelasOms()
      .then(setTabelas)
      .catch(() => setErro('Não foi possível carregar as curvas da OMS. Recarregue a página.'));
  }, []);

  const recarregarMedidas = async (lista = criancas) => setMedidas(await repo.listarMedidas(lista.map((c) => c.id)));

  const carregar = async () => {
    if (!cliente) return;
    setCarregando(true);
    setErro(null);
    try {
      const lista = await repo.listarCriancas(cliente.id);
      setCriancas(lista);
      await recarregarMedidas(lista);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    setAbertaId(null);
    setEditando(null);
    carregar();
    if (cliente) {
      gravar(CHAVE_CLIENTE, cliente.id);
      setPeriodicidade(Number(ler(chavePeriodicidade(cliente.id))) || 3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente?.id]);

  const avaliadas = useMemo(
    () => (tabelas ? avaliarTodas(tabelas, criancas, medidas) : new Map<string, Avaliada[]>()),
    [tabelas, criancas, medidas],
  );

  const lista = criancas
    .filter(
      (c) =>
        (grupoFiltro === '' || (grupoFiltro === SEM_GRUPO ? !c.grupo : c.grupo === grupoFiltro)) &&
        (!busca.trim() || c.nome.toLowerCase().includes(busca.trim().toLowerCase())),
    )
    .sort((a, b) => ordemGrupo(a.grupo) - ordemGrupo(b.grupo) || a.nome.localeCompare(b.nome, 'pt-BR'));

  const resumo = useMemo(() => {
    const cont = new Map<string, { c: Classificacao; n: number }>();
    let semMedida = 0;
    let atrasadas = 0;
    for (const c of lista) {
      const ult = ultimoDe(avaliadas.get(c.id));
      if (agendaDaCrianca(ult?.medida.data, periodicidade, hoje()).situacao === 'atrasada') atrasadas++;
      if (!ult || ult.r.zImc === undefined) {
        semMedida++;
        continue;
      }
      const cl = classificarImc(ult.r.zImc, ult.r.meses);
      const atual = cont.get(cl.rotulo);
      cont.set(cl.rotulo, { c: cl, n: (atual?.n ?? 0) + 1 });
    }
    return { itens: [...cont.values()], semMedida, atrasadas };
  }, [lista, avaliadas, periodicidade]);

  const semTurma = criancas.filter((c) => !c.grupo).length;

  const salvarCrianca = async (c: Crianca) => {
    try {
      await repo.salvarCrianca(c);
      setEditando(null);
      await carregar();
      setAbertaId(c.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível salvar.');
    }
  };

  const excluirCrianca = async (c: Crianca) => {
    if (!confirm(`Excluir ${c.nome} e todas as avaliações? Esta ação não pode ser desfeita.`)) return;
    try {
      await repo.removerCrianca(c.id);
      setAbertaId(null);
      await carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível excluir.');
    }
  };

  const novaCrianca = (): Crianca => ({
    id: crypto.randomUUID(),
    clienteId: cliente!.id,
    grupo: grupoFiltro && grupoFiltro !== SEM_GRUPO ? grupoFiltro : undefined,
    nome: '',
    dataNascimento: '',
    sexo: 'F',
    ativo: true,
    criadoEm: new Date().toISOString(),
  });

  const mudarPeriodicidade = (meses: number) => {
    setPeriodicidade(meses);
    if (cliente) gravar(chavePeriodicidade(cliente.id), String(meses));
  };

  const abrirRelatorio = (p: PedidoRelatorio) => {
    setPedido({ ...p });
    setAba('relatorios');
  };

  const aberta = criancas.find((c) => c.id === abertaId);

  if (clientes.length === 0) {
    return (
      <div>
        <h1>Avaliação nutricional</h1>
        <div className="card vazio">Cadastre um cliente (escola) para começar.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="linha no-print">
        <div>
          <h1>Avaliação nutricional</h1>
          <p className="subtitulo">
            Peso e altura das crianças, IMC e curvas de crescimento da OMS (as mesmas da Caderneta da Criança).
          </p>
        </div>
      </div>

      <div className="card no-print filtros-avaliacao">
        <div>
          <label htmlFor="av-cliente">Cliente</label>
          <select id="av-cliente" value={cliente?.id} onChange={(e) => setClienteId(e.target.value)}>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="abas-avaliacao" role="tablist" aria-label="Seção">
          {(
            [
              ['criancas', '👧 Crianças'],
              ['turma', '📋 Avaliar turma'],
              ['relatorios', '📄 Relatórios'],
            ] as [Aba, string][]
          ).map(([id, nome]) => (
            <button
              key={id}
              role="tab"
              aria-selected={aba === id}
              className={`chip${aba === id ? ' on' : ''}`}
              onClick={() => {
                setAba(id);
                if (id === 'relatorios') setPedido(undefined);
              }}
            >
              {nome}
            </button>
          ))}
        </div>
      </div>

      {erro && <div className="aviso">{erro}</div>}

      {carregando || !tabelas ? (
        <div className="card">
          <p className="subtitulo">Carregando…</p>
        </div>
      ) : aba === 'turma' ? (
        <AvaliarTurma
          criancas={criancas}
          avaliadas={avaliadas}
          tabelas={tabelas}
          grupoInicial={grupoFiltro}
          onSalvar={async (novas) => {
            for (const m of novas) await repo.salvarMedida(m);
            await recarregarMedidas();
          }}
        />
      ) : aba === 'relatorios' ? (
        <RelatorioNutricional
          key={`${cliente?.id}-${pedido?.criancaId ?? ''}-${pedido?.tipo ?? ''}`}
          clienteNome={cliente?.nome ?? ''}
          criancas={criancas}
          avaliadas={avaliadas}
          tabelas={tabelas}
          grupoInicial={pedido?.criancaId ? '' : grupoFiltro}
          pedido={pedido}
        />
      ) : (
        <>
          {editando && (
            <FormCrianca crianca={editando} onSalvar={salvarCrianca} onCancelar={() => setEditando(null)} />
          )}

          {aberta ? (
            <DetalheCrianca
              crianca={aberta}
              avaliadas={avaliadas.get(aberta.id) ?? []}
              tabelas={tabelas}
              periodicidade={periodicidade}
              onVoltar={() => setAbertaId(null)}
              onEditar={() => setEditando(aberta)}
              onExcluir={() => excluirCrianca(aberta)}
              onRelatorio={() => abrirRelatorio({ tipo: 'individual', criancaId: aberta.id })}
              onSalvarMedida={async (m) => {
                await repo.salvarMedida(m);
                await recarregarMedidas();
              }}
              onRemoverMedida={async (id) => {
                await repo.removerMedida(id);
                setMedidas((atual) => atual.filter((m) => m.id !== id));
              }}
            />
          ) : (
            <>
              <div className="card no-print filtros-avaliacao">
                <div>
                  <label htmlFor="av-turma">Turma</label>
                  <select id="av-turma" value={grupoFiltro} onChange={(e) => setGrupoFiltro(e.target.value)}>
                    <option value="">Todas</option>
                    {GRUPOS_CRIANCA.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                    <option value={SEM_GRUPO}>Sem turma</option>
                  </select>
                </div>
                <div className="filtros-avaliacao-busca">
                  <label htmlFor="av-busca">Buscar criança</label>
                  <input id="av-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome" />
                </div>
                <div>
                  <label htmlFor="av-periodicidade">Reavaliar a cada</label>
                  <select id="av-periodicidade" value={periodicidade} onChange={(e) => mudarPeriodicidade(Number(e.target.value))}>
                    {PERIODICIDADES.map((p) => (
                      <option key={p.meses} value={p.meses}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ alignSelf: 'flex-end' }}>
                  <button className="btn" onClick={() => setEditando(novaCrianca())}>
                    + Nova criança
                  </button>
                </div>
              </div>

              {semTurma > 0 && (
                <div className="aviso no-print">
                  {semTurma} criança(s) sem turma. Abra a criança, clique em ✏️ Editar e escolha a turma (Berçário a
                  Infantil 5).
                </div>
              )}

              <div className="card no-print">
                {(resumo.itens.length > 0 || resumo.atrasadas > 0) && (
                  <div className="resumo-nutri" aria-label="Resumo do IMC-para-idade na última avaliação">
                    {resumo.itens.map(({ c, n }) => (
                      <span key={c.rotulo} className={`selo-nutri ${c.situacao}`}>
                        {c.rotulo}: {n}
                      </span>
                    ))}
                    {resumo.semMedida > 0 && <span className="resumo-nutri-texto">Sem avaliação: {resumo.semMedida}</span>}
                    {resumo.atrasadas > 0 && <span className="agenda-nutri atrasada">Reavaliação atrasada: {resumo.atrasadas}</span>}
                  </div>
                )}
                {lista.length === 0 ? (
                  <p className="vazio">
                    {criancas.length === 0
                      ? 'Nenhuma criança cadastrada neste cliente. Clique em "+ Nova criança".'
                      : 'Nenhuma criança com esses filtros.'}
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Criança</th>
                          <th>Turma</th>
                          <th>Idade</th>
                          <th>Última avaliação</th>
                          <th>IMC</th>
                          <th>IMC para a idade</th>
                          <th>Estatura</th>
                          <th>Próxima avaliação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lista.map((c) => {
                          const doCrianca = avaliadas.get(c.id);
                          const ult = ultimoDe(doCrianca);
                          const agenda = agendaDaCrianca(ult?.medida.data, periodicidade, hoje());
                          return (
                            <tr key={c.id} className="linha-clicavel" onClick={() => { setEditando(null); setAbertaId(c.id); }}>
                              <td>
                                <button type="button" className="btn-link" onClick={(e) => { e.stopPropagation(); setEditando(null); setAbertaId(c.id); }}>
                                  {c.nome}
                                </button>
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>{c.grupo ?? '—'}</td>
                              <td>{idadePorExtenso(c.dataNascimento, hoje())}</td>
                              <td>
                                {ult ? dataBr(ult.medida.data) : '—'}
                                {(doCrianca?.length ?? 0) > 1 && <small className="subtitulo"> · {doCrianca!.length} no total</small>}
                              </td>
                              <td>{ult ? num(ult.r.imc) : '—'}</td>
                              <td>
                                <Selo c={ult?.r.zImc !== undefined ? classificarImc(ult.r.zImc, ult.r.meses) : undefined} />
                              </td>
                              <td>
                                <Selo c={ult?.r.zEstatura !== undefined ? classificarEstatura(ult.r.zEstatura) : undefined} curto />
                              </td>
                              <td>
                                <span className={`agenda-nutri ${agenda.situacao}`}>
                                  {agenda.situacao === 'nunca' ? 'Avaliar' : dataBr(agenda.proxima)}
                                </span>
                                {agenda.situacao !== 'em-dia' && agenda.situacao !== 'nunca' && (
                                  <small className="subtitulo"> {agenda.rotulo}</small>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      <p className="subtitulo no-print" style={{ fontSize: 12, marginTop: 8 }}>
        Curvas e escores-z: OMS 2006 (0 a 5 anos) e OMS 2007 (5 a 19 anos). Classificação conforme o Ministério da Saúde
        (SISVAN). A avaliação é um apoio: a conduta é da nutricionista.
      </p>
    </div>
  );
}

function FormCrianca({
  crianca,
  onSalvar,
  onCancelar,
}: {
  crianca: Crianca;
  onSalvar: (c: Crianca) => void;
  onCancelar: () => void;
}) {
  const [c, setC] = useState(crianca);
  const atualizar = (campos: Partial<Crianca>) => setC((x) => ({ ...x, ...campos }));
  const futuro = !!c.dataNascimento && c.dataNascimento > hoje();
  const valido = c.nome.trim() !== '' && !!c.dataNascimento && !futuro;
  const sugestao = !futuro ? sugerirGrupo(c.dataNascimento, hoje()) : undefined;
  return (
    <div className="card no-print">
      <h3 style={{ marginTop: 0 }}>{crianca.nome ? `Editar ${crianca.nome}` : 'Nova criança'}</h3>
      <div className="form-crianca">
        <div className="largura-toda">
          <label htmlFor="cr-nome">Nome</label>
          <input id="cr-nome" value={c.nome} onChange={(e) => atualizar({ nome: e.target.value })} autoFocus />
        </div>
        <div>
          <label htmlFor="cr-nasc">Data de nascimento</label>
          <input id="cr-nasc" type="date" max={hoje()} value={c.dataNascimento} onChange={(e) => atualizar({ dataNascimento: e.target.value })} />
          {futuro && <small className="erro-campo">A data não pode ser no futuro.</small>}
        </div>
        <div>
          <span className="rotulo-campo">Sexo</span>
          <div className="opcoes-inline" role="radiogroup" aria-label="Sexo">
            {(['F', 'M'] as const).map((s) => (
              <label key={s} className="opcao-inline">
                <input type="radio" name="cr-sexo" checked={c.sexo === s} onChange={() => atualizar({ sexo: s })} />
                {s === 'F' ? 'Feminino' : 'Masculino'}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="cr-turma">Turma</label>
          <select id="cr-turma" value={c.grupo ?? ''} onChange={(e) => atualizar({ grupo: e.target.value || undefined })}>
            <option value="">Sem turma</option>
            {GRUPOS_CRIANCA.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {sugestao && c.grupo !== sugestao && (
            <small className="subtitulo">
              Pela idade: {sugestao}.{' '}
              <button type="button" className="btn-link" onClick={() => atualizar({ grupo: sugestao })}>
                Usar
              </button>
            </small>
          )}
        </div>
        <div className="largura-toda">
          <label htmlFor="cr-obs">Observações (opcional)</label>
          <input id="cr-obs" value={c.observacoes ?? ''} onChange={(e) => atualizar({ observacoes: e.target.value })} placeholder="Ex.: APLV, prematuro" />
        </div>
      </div>
      <div className="acoes" style={{ marginTop: 12 }}>
        <button className="btn secundario" onClick={onCancelar}>Cancelar</button>
        <button className="btn" disabled={!valido} onClick={() => onSalvar({ ...c, nome: c.nome.trim() })}>
          💾 Salvar
        </button>
      </div>
    </div>
  );
}

function DetalheCrianca({
  crianca,
  avaliadas,
  tabelas,
  periodicidade,
  onVoltar,
  onEditar,
  onExcluir,
  onRelatorio,
  onSalvarMedida,
  onRemoverMedida,
}: {
  crianca: Crianca;
  avaliadas: Avaliada[];
  tabelas: TabelasOms;
  periodicidade: number;
  onVoltar: () => void;
  onEditar: () => void;
  onExcluir: () => void;
  onRelatorio: () => void;
  onSalvarMedida: (m: MedidaAntropometrica) => Promise<void>;
  onRemoverMedida: (id: string) => Promise<void>;
}) {
  const [indicador, setIndicador] = useState<Indicador>('imc');
  const ultima = ultimoDe(avaliadas);
  const anterior = ultimoDe(avaliadas, 2);
  const idadeHoje = idadeEmDias(crianca.dataNascimento, hoje());
  const mostraPeso = idadeHoje / 30.4375 < 121 || avaliadas.some((a) => a.r.zPeso !== undefined);
  const agenda = agendaDaCrianca(ultima?.medida.data, periodicidade, hoje());
  const nomePeriodicidade = PERIODICIDADES.find((p) => p.meses === periodicidade)?.nome.toLowerCase() ?? '';

  const pontos = (ind: Indicador): PontoCrianca[] =>
    avaliadas.map(({ medida, r }) => ({
      meses: r.meses,
      data: medida.data,
      valor: ind === 'imc' ? r.imc : ind === 'estatura' ? r.alturaCm : medida.pesoKg,
      z: ind === 'imc' ? r.zImc : ind === 'estatura' ? r.zEstatura : r.zPeso,
    }));

  return (
    <div>
      <div className="linha no-print" style={{ marginBottom: 12 }}>
        <button className="btn secundario" onClick={onVoltar}>← Voltar à lista</button>
        <div className="acoes">
          <button className="btn secundario" onClick={onEditar}>✏️ Editar</button>
          <button className="btn secundario" onClick={onRelatorio}>📄 Relatório / PDF</button>
          <button className="btn perigo" onClick={onExcluir}>Excluir</button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 4px' }}>{crianca.nome}</h2>
        <p className="subtitulo" style={{ margin: 0 }}>
          {crianca.sexo === 'F' ? 'Menina' : 'Menino'} · nascida(o) em {dataBr(crianca.dataNascimento)} ·{' '}
          {idadePorExtenso(crianca.dataNascimento, hoje())}
          {crianca.grupo ? ` · ${crianca.grupo}` : ' · sem turma'}
          {crianca.observacoes && ` · ${crianca.observacoes}`}
        </p>
        <p className="subtitulo" style={{ margin: '6px 0 0' }}>
          {avaliadas.length === 0 ? (
            'Nenhuma avaliação ainda.'
          ) : (
            <>
              {avaliadas.length} avaliação(ões) · próxima ({nomePeriodicidade}):{' '}
              <span className={`agenda-nutri ${agenda.situacao}`}>{dataBr(agenda.proxima)}</span>
              {agenda.situacao !== 'em-dia' && ` · ${agenda.rotulo}`}
            </>
          )}
        </p>
      </div>

      <NovaMedida key={crianca.id} crianca={crianca} tabelas={tabelas} quantas={avaliadas.length} onSalvar={onSalvarMedida} />

      {ultima ? (
        <>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Avaliação · {dataBr(ultima.medida.data)}</h3>
            <div className="selos-avaliacao">
              {ultima.r.zImc !== undefined && <Selo c={classificarImc(ultima.r.zImc, ultima.r.meses)} />}
              {ultima.r.zEstatura !== undefined && <Selo c={classificarEstatura(ultima.r.zEstatura)} />}
              {ultima.r.zPeso !== undefined && <Selo c={classificarPeso(ultima.r.zPeso)} />}
            </div>
            <ul className="texto-avaliacao">
              {avaliacaoEmTexto(ultima.r, anterior?.r).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="abas-grafico no-print" role="tablist" aria-label="Curva">
              {(['imc', 'estatura', ...(mostraPeso ? (['peso'] as const) : [])] as Indicador[]).map((i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={indicador === i}
                  className={`chip${indicador === i ? ' on' : ''}`}
                  onClick={() => setIndicador(i)}
                >
                  {i === 'imc' ? 'IMC/idade' : i === 'estatura' ? 'Estatura/idade' : 'Peso/idade'}
                </button>
              ))}
            </div>
            <GraficoCrescimento tabelas={tabelas} indicador={indicador} sexo={crianca.sexo} pontos={pontos(indicador)} />
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Histórico de avaliações ({avaliadas.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Idade</th>
                    <th>Peso</th>
                    <th>Altura</th>
                    <th>IMC</th>
                    <th>IMC/idade</th>
                    <th>Estatura/idade</th>
                    <th>Peso/idade</th>
                    <th className="no-print"></th>
                  </tr>
                </thead>
                <tbody>
                  {[...avaliadas].reverse().map(({ medida, r }) => (
                    <tr key={medida.id}>
                      <td>{dataBr(medida.data)}</td>
                      <td>{idadePorExtenso(crianca.dataNascimento, medida.data)}</td>
                      <td>{num(medida.pesoKg, 2)} kg</td>
                      <td>
                        {num(medida.alturaCm)} cm{medida.forma === 'deitado' ? ' (deitada)' : ''}
                      </td>
                      <td>{num(r.imc)}</td>
                      <td>
                        {r.zImc !== undefined ? (
                          <>
                            {num(r.zImc, 2)} <Selo c={classificarImc(r.zImc, r.meses)} />
                          </>
                        ) : '—'}
                      </td>
                      <td>{r.zEstatura !== undefined ? num(r.zEstatura, 2) : '—'}</td>
                      <td>{r.zPeso !== undefined ? num(r.zPeso, 2) : '—'}</td>
                      <td className="no-print">
                        <button
                          className="btn pequeno perigo"
                          title="Excluir avaliação"
                          onClick={() => confirm(`Excluir a avaliação de ${dataBr(medida.data)}?`) && onRemoverMedida(medida.id)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function NovaMedida({
  crianca,
  tabelas,
  quantas,
  onSalvar,
}: {
  crianca: Crianca;
  tabelas: TabelasOms;
  quantas: number;
  onSalvar: (m: MedidaAntropometrica) => Promise<void>;
}) {
  const [data, setData] = useState(hoje());
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const dias = idadeEmDias(crianca.dataNascimento, data);
  // Sem escolha, segue a idade na data da medida: deitada até 2 anos, em pé depois.
  const [formaEscolhida, setForma] = useState<'deitado' | 'em_pe' | null>(null);
  const forma = formaEscolhida ?? (dias < 731 ? 'deitado' : 'em_pe');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const pesoKg = lerDecimal(peso);
  const alturaCm = lerDecimal(altura);
  const problemas = problemasDaMedida(pesoKg, alturaCm);
  if (dias < 0) problemas.push('A data é anterior ao nascimento.');
  if (data > hoje()) problemas.push('A data não pode ser no futuro.');
  const completa = !Number.isNaN(pesoKg) && !Number.isNaN(alturaCm) && problemas.length === 0;
  const previa = completa ? avaliarMedida(tabelas, crianca.sexo, crianca.dataNascimento, { data, pesoKg, alturaCm, forma }) : null;

  const salvar = async () => {
    if (!completa) return;
    setSalvando(true);
    setMsg(null);
    try {
      await onSalvar({
        id: crypto.randomUUID(),
        criancaId: crianca.id,
        data,
        pesoKg,
        alturaCm,
        forma,
        criadoEm: new Date().toISOString(),
      });
      setPeso('');
      setAltura('');
      setForma(null);
      setMsg({ ok: true, texto: `Avaliação de ${dataBr(data)} salva no histórico.` });
      setTimeout(() => setMsg(null), 4000);
    } catch (e) {
      setMsg({ ok: false, texto: e instanceof Error ? e.message : 'Não foi possível salvar.' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="card no-print">
      <h3 style={{ marginTop: 0 }}>{quantas === 0 ? 'Primeira avaliação' : 'Nova avaliação (reavaliação)'}</h3>
      <p className="subtitulo" style={{ marginTop: 0 }}>
        Cada avaliação salva entra no histórico e na curva, sem apagar as anteriores. Para reavaliar (todo mês,
        trimestre ou semestre), é só lançar aqui a nova data com o peso e a altura do dia. Para a turma inteira, use
        a aba "Avaliar turma".
      </p>
      <div className="form-medida">
        <div>
          <label htmlFor="md-data">Data</label>
          <input id="md-data" type="date" max={hoje()} value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div>
          <label htmlFor="md-peso">Peso (kg)</label>
          <input id="md-peso" inputMode="decimal" placeholder="Ex.: 14,6" value={peso} onChange={(e) => setPeso(e.target.value)} />
        </div>
        <div>
          <label htmlFor="md-altura">Altura (cm)</label>
          <input id="md-altura" inputMode="decimal" placeholder="Ex.: 96,5" value={altura} onChange={(e) => setAltura(e.target.value)} />
        </div>
        <div>
          <span className="rotulo-campo">Medida</span>
          <div className="opcoes-inline" role="radiogroup" aria-label="Como a altura foi medida">
            <label className="opcao-inline">
              <input type="radio" name="md-forma" checked={forma === 'deitado'} onChange={() => setForma('deitado')} />
              Deitada
            </label>
            <label className="opcao-inline">
              <input type="radio" name="md-forma" checked={forma === 'em_pe'} onChange={() => setForma('em_pe')} />
              Em pé
            </label>
          </div>
        </div>
      </div>
      {problemas.length > 0 && <p className="erro-campo">{problemas.join(' ')}</p>}
      {previa && (
        <p className="previa-medida">
          IMC <strong>{num(previa.imc)}</strong>
          {previa.zImc !== undefined && (
            <>
              {' '}· <Selo c={classificarImc(previa.zImc, previa.meses)} />
            </>
          )}
          {previa.zEstatura !== undefined && (
            <>
              {' '}· <Selo c={classificarEstatura(previa.zEstatura)} />
            </>
          )}
          {forma === 'em_pe' && dias < 731 && <small> · medida em pé antes dos 2 anos: +0,7 cm (padrão OMS)</small>}
          {forma === 'deitado' && dias >= 731 && <small> · medida deitada após os 2 anos: −0,7 cm (padrão OMS)</small>}
        </p>
      )}
      <div className="acoes" style={{ marginTop: 8, alignItems: 'center' }}>
        <button className="btn" disabled={!completa || salvando} onClick={salvar}>
          {salvando ? 'Salvando…' : '💾 Salvar avaliação'}
        </button>
        {msg && <span className={msg.ok ? 'login-aviso sucesso' : 'login-aviso erro'} style={{ margin: 0 }}>{msg.texto}</span>}
      </div>
    </div>
  );
}
