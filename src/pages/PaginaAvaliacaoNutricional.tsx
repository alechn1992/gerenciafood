// Avaliação nutricional: a nutricionista cadastra as crianças da escola,
// registra peso e altura, e o sistema calcula IMC e escores-z pelas curvas da
// OMS, classifica (critérios do Ministério da Saúde) e mostra a curva.

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
  type Resultado,
  type TabelasOms,
} from '../domain/antropometria';
import { GraficoCrescimento, type PontoCrianca } from '../components/GraficoCrescimento';

const hoje = () => new Date().toISOString().slice(0, 10);
const dataBr = (iso: string) => iso.split('-').reverse().join('/');
const num = (n: number, casas = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const CHAVE_CLIENTE = 'gf:avaliacao-cliente';
const ultimoDe = <T,>(lista: T[] | undefined, deTras = 1): T | undefined => (lista ? lista[lista.length - deTras] : undefined);

function Selo({ c }: { c?: Classificacao }) {
  if (!c) return <span className="subtitulo">—</span>;
  return <span className={`selo-nutri ${c.situacao}`}>{c.rotulo}</span>;
}

interface Avaliada {
  medida: MedidaAntropometrica;
  r: Resultado;
}

export function PaginaAvaliacaoNutricional() {
  const { clientes, turmas, repo } = useData();
  const [clienteId, setClienteId] = useState<string>(() => {
    try {
      return localStorage.getItem(CHAVE_CLIENTE) ?? '';
    } catch {
      return '';
    }
  });
  const [turmaFiltro, setTurmaFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [medidas, setMedidas] = useState<MedidaAntropometrica[]>([]);
  const [tabelas, setTabelas] = useState<TabelasOms | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [editando, setEditando] = useState<Crianca | null>(null);

  const cliente = clientes.find((c) => c.id === clienteId) ?? clientes[0];
  const turmasDoCliente = useMemo(
    () => turmas.filter((t) => t.clienteId === cliente?.id).sort((a, b) => a.ordem - b.ordem),
    [turmas, cliente?.id],
  );
  const nomeTurma = (id?: string) => turmasDoCliente.find((t) => t.id === id)?.nome ?? '';

  useEffect(() => {
    carregarTabelasOms()
      .then(setTabelas)
      .catch(() => setErro('Não foi possível carregar as curvas da OMS. Recarregue a página.'));
  }, []);

  const carregar = async () => {
    if (!cliente) return;
    setCarregando(true);
    setErro(null);
    try {
      const lista = await repo.listarCriancas(cliente.id);
      setCriancas(lista);
      setMedidas(await repo.listarMedidas(lista.map((c) => c.id)));
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
    if (cliente)
      try {
        localStorage.setItem(CHAVE_CLIENTE, cliente.id);
      } catch {
        // sem armazenamento: só não lembra o cliente
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente?.id]);

  /** Medidas avaliadas por criança, em ordem de data. */
  const avaliadas = useMemo(() => {
    const mapa = new Map<string, Avaliada[]>();
    if (!tabelas) return mapa;
    for (const c of criancas) {
      mapa.set(
        c.id,
        medidas
          .filter((m) => m.criancaId === c.id)
          .map((m) => ({ medida: m, r: avaliarMedida(tabelas, c.sexo, c.dataNascimento, m) })),
      );
    }
    return mapa;
  }, [tabelas, criancas, medidas]);

  const lista = criancas.filter(
    (c) =>
      (!turmaFiltro || c.turmaId === turmaFiltro) &&
      (!busca.trim() || c.nome.toLowerCase().includes(busca.trim().toLowerCase())),
  );

  const resumo = useMemo(() => {
    const cont = new Map<string, { c: Classificacao; n: number }>();
    let semMedida = 0;
    for (const c of lista) {
      const ult = ultimoDe(avaliadas.get(c.id));
      if (!ult || ult.r.zImc === undefined) {
        semMedida++;
        continue;
      }
      const cl = classificarImc(ult.r.zImc, ult.r.meses);
      const atual = cont.get(cl.rotulo);
      cont.set(cl.rotulo, { c: cl, n: (atual?.n ?? 0) + 1 });
    }
    return { itens: [...cont.values()], semMedida };
  }, [lista, avaliadas]);

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
    if (!confirm(`Excluir ${c.nome} e todas as aferições? Esta ação não pode ser desfeita.`)) return;
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
    turmaId: turmaFiltro || undefined,
    nome: '',
    dataNascimento: '',
    sexo: 'F',
    ativo: true,
    criadoEm: new Date().toISOString(),
  });

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
        {turmasDoCliente.length > 0 && (
          <div>
            <label htmlFor="av-turma">Turma</label>
            <select id="av-turma" value={turmaFiltro} onChange={(e) => setTurmaFiltro(e.target.value)}>
              <option value="">Todas</option>
              {turmasDoCliente.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="filtros-avaliacao-busca">
          <label htmlFor="av-busca">Buscar criança</label>
          <input id="av-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome" />
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button className="btn" onClick={() => { setAbertaId(null); setEditando(novaCrianca()); }}>
            + Nova criança
          </button>
        </div>
      </div>

      {erro && <div className="aviso">{erro}</div>}

      {editando && (
        <FormCrianca
          crianca={editando}
          turmas={turmasDoCliente}
          onSalvar={salvarCrianca}
          onCancelar={() => setEditando(null)}
        />
      )}

      {aberta && tabelas ? (
        <DetalheCrianca
          crianca={aberta}
          turma={nomeTurma(aberta.turmaId)}
          clienteNome={cliente?.nome ?? ''}
          avaliadas={avaliadas.get(aberta.id) ?? []}
          tabelas={tabelas}
          onVoltar={() => setAbertaId(null)}
          onEditar={() => setEditando(aberta)}
          onExcluir={() => excluirCrianca(aberta)}
          onSalvarMedida={async (m) => {
            await repo.salvarMedida(m);
            setMedidas(await repo.listarMedidas(criancas.map((c) => c.id)));
          }}
          onRemoverMedida={async (id) => {
            await repo.removerMedida(id);
            setMedidas((atual) => atual.filter((m) => m.id !== id));
          }}
        />
      ) : (
        <div className="card no-print">
          {resumo.itens.length > 0 && (
            <div className="resumo-nutri" aria-label="Resumo do IMC-para-idade na última aferição">
              {resumo.itens.map(({ c, n }) => (
                <span key={c.rotulo} className={`selo-nutri ${c.situacao}`}>
                  {c.rotulo}: {n}
                </span>
              ))}
              {resumo.semMedida > 0 && <span className="subtitulo">Sem aferição: {resumo.semMedida}</span>}
            </div>
          )}
          {carregando || !tabelas ? (
            <p className="subtitulo">Carregando…</p>
          ) : lista.length === 0 ? (
            <p className="vazio">
              {criancas.length === 0 ? 'Nenhuma criança cadastrada neste cliente. Clique em "+ Nova criança".' : 'Nenhuma criança com esses filtros.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Criança</th>
                    <th>Turma</th>
                    <th>Idade</th>
                    <th>Última aferição</th>
                    <th>IMC</th>
                    <th>IMC para a idade</th>
                    <th>Estatura</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((c) => {
                    const ult = ultimoDe(avaliadas.get(c.id));
                    return (
                      <tr key={c.id} className="linha-clicavel" onClick={() => { setEditando(null); setAbertaId(c.id); }}>
                        <td>
                          <button type="button" className="btn-link" onClick={(e) => { e.stopPropagation(); setEditando(null); setAbertaId(c.id); }}>
                            {c.nome}
                          </button>
                        </td>
                        <td>{nomeTurma(c.turmaId) || '—'}</td>
                        <td>{idadePorExtenso(c.dataNascimento, hoje())}</td>
                        <td>{ult ? dataBr(ult.medida.data) : '—'}</td>
                        <td>{ult ? num(ult.r.imc) : '—'}</td>
                        <td>
                          <Selo c={ult?.r.zImc !== undefined ? classificarImc(ult.r.zImc, ult.r.meses) : undefined} />
                        </td>
                        <td>
                          <Selo c={ult?.r.zEstatura !== undefined ? classificarEstatura(ult.r.zEstatura) : undefined} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
  turmas,
  onSalvar,
  onCancelar,
}: {
  crianca: Crianca;
  turmas: { id: string; nome: string }[];
  onSalvar: (c: Crianca) => void;
  onCancelar: () => void;
}) {
  const [c, setC] = useState(crianca);
  const atualizar = (campos: Partial<Crianca>) => setC((x) => ({ ...x, ...campos }));
  const futuro = !!c.dataNascimento && c.dataNascimento > hoje();
  const valido = c.nome.trim() !== '' && !!c.dataNascimento && !futuro;
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
        {turmas.length > 0 && (
          <div>
            <label htmlFor="cr-turma">Turma</label>
            <select id="cr-turma" value={c.turmaId ?? ''} onChange={(e) => atualizar({ turmaId: e.target.value || undefined })}>
              <option value="">Sem turma</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
        )}
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
  turma,
  clienteNome,
  avaliadas,
  tabelas,
  onVoltar,
  onEditar,
  onExcluir,
  onSalvarMedida,
  onRemoverMedida,
}: {
  crianca: Crianca;
  turma: string;
  clienteNome: string;
  avaliadas: Avaliada[];
  tabelas: TabelasOms;
  onVoltar: () => void;
  onEditar: () => void;
  onExcluir: () => void;
  onSalvarMedida: (m: MedidaAntropometrica) => Promise<void>;
  onRemoverMedida: (id: string) => Promise<void>;
}) {
  const [indicador, setIndicador] = useState<Indicador>('imc');
  const ultima = ultimoDe(avaliadas);
  const anterior = ultimoDe(avaliadas, 2);
  const idadeHoje = idadeEmDias(crianca.dataNascimento, hoje());
  const mostraPeso = idadeHoje / 30.4375 < 121 || avaliadas.some((a) => a.r.zPeso !== undefined);

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
          <button className="btn secundario" onClick={() => window.print()}>🖨️ Imprimir</button>
          <button className="btn perigo" onClick={onExcluir}>Excluir</button>
        </div>
      </div>

      <div className="card">
        <div className="somente-print" style={{ fontSize: 12, color: '#6b7d74', marginBottom: 4 }}>
          Avaliação nutricional · {clienteNome}
        </div>
        <h2 style={{ margin: '0 0 4px' }}>{crianca.nome}</h2>
        <p className="subtitulo" style={{ margin: 0 }}>
          {crianca.sexo === 'F' ? 'Menina' : 'Menino'} · nascida(o) em {dataBr(crianca.dataNascimento)} ·{' '}
          {idadePorExtenso(crianca.dataNascimento, hoje())}
          {turma && ` · ${turma}`}
          {crianca.observacoes && ` · ${crianca.observacoes}`}
        </p>
      </div>

      <NovaMedida key={crianca.id} crianca={crianca} tabelas={tabelas} onSalvar={onSalvarMedida} />

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
            <h3 style={{ marginTop: 0 }}>Histórico de aferições</h3>
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
                          title="Excluir aferição"
                          onClick={() => confirm(`Excluir a aferição de ${dataBr(medida.data)}?`) && onRemoverMedida(medida.id)}
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
      ) : (
        <div className="card vazio">Nenhuma aferição ainda. Registre peso e altura acima.</div>
      )}
    </div>
  );
}

function NovaMedida({
  crianca,
  tabelas,
  onSalvar,
}: {
  crianca: Crianca;
  tabelas: TabelasOms;
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
  const [msg, setMsg] = useState<string | null>(null);

  const pesoKg = Number(peso.replace(',', '.'));
  const alturaCm = Number(altura.replace(',', '.'));
  const problemas: string[] = [];
  if (dias < 0) problemas.push('A data é anterior ao nascimento.');
  if (data > hoje()) problemas.push('A data não pode ser no futuro.');
  if (peso && !(pesoKg >= 1 && pesoKg <= 150)) problemas.push('Peso fora do esperado (1 a 150 kg).');
  if (altura && !(alturaCm >= 40 && alturaCm <= 200)) problemas.push('Altura fora do esperado (40 a 200 cm).');
  const completa = peso !== '' && altura !== '' && problemas.length === 0;
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
      setMsg('Aferição salva.');
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="card no-print">
      <h3 style={{ marginTop: 0 }}>Nova aferição</h3>
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
          {salvando ? 'Salvando…' : '💾 Salvar aferição'}
        </button>
        {msg && <span className={msg === 'Aferição salva.' ? 'login-aviso sucesso' : 'login-aviso erro'} style={{ margin: 0 }}>{msg}</span>}
      </div>
    </div>
  );
}
