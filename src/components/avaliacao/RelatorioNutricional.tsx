// Relatórios da avaliação nutricional, com filtros e PDF:
// - da turma: distribuição das classificações, evolução e a lista das crianças;
// - individual: dados da criança, avaliação, curvas e histórico do período.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  avaliacaoEmTexto,
  classificarEstatura,
  classificarImc,
  classificarPeso,
  idadeEmMeses,
  idadePorExtenso,
  type Indicador,
  type TabelasOms,
} from '../../domain/antropometria';
import {
  evolucaoImc,
  FILTROS_SITUACAO,
  GRUPOS_CRIANCA,
  montarRelatorioTurma,
  noPeriodo,
  periodoDoPreset,
  PRESETS_PERIODO,
  SEM_GRUPO,
  type Avaliada,
  type Contagem,
  type FiltroSituacao,
  type PresetPeriodo,
} from '../../domain/relatorioNutricional';
import type { Crianca } from '../../domain/types';
import { baixarPdf, gerarPdf, nomeArquivo } from '../../lib/pdf';
import { GraficoCrescimento, type PontoCrianca } from '../GraficoCrescimento';
import { dataBr, hoje, idadeCurta, num, Selo, ultimoDe } from './comum';

export interface PedidoRelatorio {
  tipo: 'turma' | 'individual';
  criancaId?: string;
}

const nomeGrupo = (g: string) => (g === '' ? 'Todas as turmas' : g === SEM_GRUPO ? 'Sem turma' : g);

export function RelatorioNutricional({
  clienteNome,
  criancas,
  avaliadas,
  tabelas,
  grupoInicial,
  pedido,
}: {
  clienteNome: string;
  criancas: Crianca[];
  avaliadas: Map<string, Avaliada[]>;
  tabelas: TabelasOms;
  grupoInicial: string;
  pedido?: PedidoRelatorio;
}) {
  const [tipo, setTipo] = useState<'turma' | 'individual'>(pedido?.tipo ?? 'turma');
  const [grupo, setGrupo] = useState(grupoInicial);
  const [preset, setPreset] = useState<PresetPeriodo>(pedido?.tipo === 'individual' ? 'tudo' : 'trimestre');
  const [periodo, setPeriodo] = useState(() => periodoDoPreset(pedido?.tipo === 'individual' ? 'tudo' : 'trimestre', hoje()));
  const [sexo, setSexo] = useState<'' | 'M' | 'F'>('');
  const [situacao, setSituacao] = useState<FiltroSituacao>('');
  const [criancaId, setCriancaId] = useState(pedido?.criancaId ?? '');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const folha = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pedido) {
      setTipo(pedido.tipo);
      if (pedido.criancaId) setCriancaId(pedido.criancaId);
    }
  }, [pedido]);

  const escolherPreset = (p: PresetPeriodo) => {
    setPreset(p);
    if (p !== 'personalizado') setPeriodo(periodoDoPreset(p, hoje()));
  };

  const ordenadas = useMemo(
    () => criancas.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [criancas],
  );
  const opcoesCriancas = ordenadas.filter((c) => (grupo === '' ? true : grupo === SEM_GRUPO ? !c.grupo : c.grupo === grupo));
  const crianca = criancas.find((c) => c.id === criancaId) ?? opcoesCriancas[0];

  const relTurma = useMemo(
    () => montarRelatorioTurma(criancas, avaliadas, { grupo, de: periodo.de, ate: periodo.ate, sexo, situacao }),
    [criancas, avaliadas, grupo, periodo, sexo, situacao],
  );

  const baixar = async () => {
    if (!folha.current) return;
    setGerando(true);
    setErro(null);
    try {
      const nome =
        tipo === 'turma'
          ? nomeArquivo('Avaliacao-nutricional', clienteNome, nomeGrupo(grupo), periodo.de, periodo.ate)
          : nomeArquivo('Avaliacao-nutricional', crianca?.nome ?? 'crianca', hoje());
      baixarPdf(
        await gerarPdf(folha.current, nome, {
          evitarQuebra: ['.rel-nutri-bloco', '.grafico-crescimento', '.rel-nutri-tabela tr'],
        }),
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar o PDF.');
    } finally {
      setGerando(false);
    }
  };

  return (
    <div>
      <div className="card no-print">
        <div className="filtros-relatorio">
          <div>
            <span className="rotulo-campo">Relatório</span>
            <div className="opcoes-inline" role="radiogroup" aria-label="Tipo de relatório">
              <label className="opcao-inline">
                <input type="radio" name="rel-tipo" checked={tipo === 'turma'} onChange={() => setTipo('turma')} />
                Da turma
              </label>
              <label className="opcao-inline">
                <input type="radio" name="rel-tipo" checked={tipo === 'individual'} onChange={() => setTipo('individual')} />
                Individual
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="rel-grupo">Turma</label>
            <select id="rel-grupo" value={grupo} onChange={(e) => setGrupo(e.target.value)}>
              <option value="">Todas</option>
              {GRUPOS_CRIANCA.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
              <option value={SEM_GRUPO}>Sem turma</option>
            </select>
          </div>
          {tipo === 'individual' && (
            <div>
              <label htmlFor="rel-crianca">Criança</label>
              <select id="rel-crianca" value={crianca?.id ?? ''} onChange={(e) => setCriancaId(e.target.value)}>
                {opcoesCriancas.length === 0 && <option value="">Nenhuma criança</option>}
                {opcoesCriancas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="rel-periodo">Período</label>
            <select id="rel-periodo" value={preset} onChange={(e) => escolherPreset(e.target.value as PresetPeriodo)}>
              {PRESETS_PERIODO.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          {preset === 'personalizado' && (
            <>
              <div>
                <label htmlFor="rel-de">De</label>
                <input id="rel-de" type="date" value={periodo.de} onChange={(e) => setPeriodo((p) => ({ ...p, de: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="rel-ate">Até</label>
                <input id="rel-ate" type="date" value={periodo.ate} onChange={(e) => setPeriodo((p) => ({ ...p, ate: e.target.value }))} />
              </div>
            </>
          )}
          {tipo === 'turma' && (
            <>
              <div>
                <label htmlFor="rel-sexo">Sexo</label>
                <select id="rel-sexo" value={sexo} onChange={(e) => setSexo(e.target.value as '' | 'M' | 'F')}>
                  <option value="">Todos</option>
                  <option value="F">Meninas</option>
                  <option value="M">Meninos</option>
                </select>
              </div>
              <div>
                <label htmlFor="rel-situacao">Classificação</label>
                <select id="rel-situacao" value={situacao} onChange={(e) => setSituacao(e.target.value as FiltroSituacao)}>
                  {FILTROS_SITUACAO.map((s) => (
                    <option key={s.valor} value={s.valor}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        <div className="acoes" style={{ marginTop: 12, alignItems: 'center' }}>
          <button className="btn" onClick={baixar} disabled={gerando || (tipo === 'individual' && !crianca)}>
            {gerando ? 'Gerando PDF…' : '⬇️ Baixar PDF'}
          </button>
          <button className="btn secundario" onClick={() => window.print()} disabled={tipo === 'individual' && !crianca}>
            🖨️ Imprimir
          </button>
          {erro && <span className="login-aviso erro" style={{ margin: 0 }}>{erro}</span>}
        </div>
      </div>

      <div className="folha-relatorio">
        <div ref={folha} className="rel-nutri">
          {tipo === 'turma' ? (
            <RelatorioDaTurma
              clienteNome={clienteNome}
              grupo={grupo}
              de={periodo.de}
              ate={periodo.ate}
              tudo={preset === 'tudo'}
              sexo={sexo}
              situacao={situacao}
              rel={relTurma}
            />
          ) : crianca ? (
            <RelatorioIndividual
              clienteNome={clienteNome}
              crianca={crianca}
              avaliadas={avaliadas.get(crianca.id) ?? []}
              tabelas={tabelas}
              de={periodo.de}
              ate={periodo.ate}
              tudo={preset === 'tudo'}
            />
          ) : (
            <p className="vazio">Nenhuma criança nesta turma.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Cabecalho({ titulo, clienteNome, linhas }: { titulo: string; clienteNome: string; linhas: string[] }) {
  return (
    <header className="rel-nutri-cabecalho rel-nutri-bloco">
      <div>
        <div className="rel-nutri-sobretitulo">Avaliação nutricional · {clienteNome}</div>
        <h2>{titulo}</h2>
        {linhas.filter(Boolean).map((l) => (
          <div key={l} className="rel-nutri-linha">
            {l}
          </div>
        ))}
      </div>
      <div className="rel-nutri-emissao">Emitido em {dataBr(hoje())}</div>
    </header>
  );
}

function Rodape() {
  return (
    <footer className="rel-nutri-rodape rel-nutri-bloco">
      <p>
        Curvas e escores-z: OMS 2006 (0 a 5 anos) e OMS 2007 (5 a 19 anos). Classificação conforme o Ministério da
        Saúde (SISVAN). A avaliação é um apoio; a conduta é da nutricionista.
      </p>
      <div className="rel-nutri-assinatura">
        <div className="rel-nutri-assinatura-linha" />
        <div>Nutricionista responsável · CRN</div>
      </div>
    </footer>
  );
}

function Distribuicao({ titulo, itens, total }: { titulo: string; itens: Contagem[]; total: number }) {
  return (
    <div className="rel-nutri-dist">
      <h4>{titulo}</h4>
      {itens.length === 0 ? (
        <p className="subtitulo">Sem dados no período.</p>
      ) : (
        <ul>
          {itens.map((c) => (
            <li key={c.rotulo}>
              <span className="rel-nutri-dist-rotulo">{c.rotulo.replace(' para a idade', '')}</span>
              <span className="rel-nutri-dist-barra" aria-hidden>
                <span className={`rel-nutri-dist-preench ${c.situacao}`} style={{ width: `${Math.max(c.pct, 1.5)}%` }} />
              </span>
              <span className="rel-nutri-dist-valor">
                {c.n} <small>({num(c.pct, 0)}%)</small>
              </span>
            </li>
          ))}
        </ul>
      )}
      <small className="subtitulo">Base: {total} criança(s) avaliada(s)</small>
    </div>
  );
}

function SetaEvolucao({ antes, depois }: { antes?: number; depois?: number }) {
  if (antes === undefined || depois === undefined) return <span className="evolucao">1ª avaliação</span>;
  const e = evolucaoImc(antes, depois);
  const delta = depois - antes;
  const variacao = <small className="evolucao-delta">z {`${delta > 0 ? '+' : ''}${num(delta, 2)}`}</small>;
  if (e === 'melhorou') return <span className="evolucao melhorou">▲ melhorou {variacao}</span>;
  if (e === 'piorou') return <span className="evolucao piorou">▼ piorou {variacao}</span>;
  return <span className="evolucao estavel">● estável {variacao}</span>;
}

function RelatorioDaTurma({
  clienteNome,
  grupo,
  de,
  ate,
  tudo,
  sexo,
  situacao,
  rel,
}: {
  clienteNome: string;
  grupo: string;
  de: string;
  ate: string;
  tudo: boolean;
  sexo: '' | 'M' | 'F';
  situacao: FiltroSituacao;
  rel: ReturnType<typeof montarRelatorioTurma>;
}) {
  const avaliadas = rel.linhas.length;
  const comAlteracao = rel.linhas.filter(
    (l) => (l.imc && l.imc.situacao !== 'adequado') || (l.estatura && l.estatura.situacao !== 'adequado'),
  ).length;
  const filtros = [
    sexo ? (sexo === 'F' ? 'Meninas' : 'Meninos') : '',
    situacao ? FILTROS_SITUACAO.find((s) => s.valor === situacao)?.nome ?? '' : '',
  ].filter(Boolean);
  const todasTurmas = grupo === '';

  return (
    <>
      <Cabecalho
        titulo={`Relatório da turma · ${nomeGrupo(grupo)}`}
        clienteNome={clienteNome}
        linhas={[
          tudo ? 'Período: todo o histórico (última avaliação de cada criança)' : `Período: ${dataBr(de)} a ${dataBr(ate)} (última avaliação de cada criança no período)`,
          filtros.length ? `Filtros: ${filtros.join(' · ')}` : '',
        ]}
      />

      <section className="rel-nutri-indicadores rel-nutri-bloco">
        <div>
          <strong>{rel.totalCriancas}</strong>
          <span>crianças{todasTurmas ? '' : ' na turma'}</span>
        </div>
        <div>
          <strong>{avaliadas}</strong>
          <span>{situacao ? 'com essa classificação' : 'avaliadas no período'}</span>
        </div>
        {!situacao && (
          <div>
            <strong>{rel.naoAvaliadas.length}</strong>
            <span>sem avaliação no período</span>
          </div>
        )}
        <div>
          <strong>{comAlteracao}</strong>
          <span>com alteração</span>
        </div>
      </section>

      <section className="rel-nutri-graficos rel-nutri-bloco">
        <Distribuicao titulo="IMC para a idade" itens={rel.imc} total={avaliadas} />
        <Distribuicao titulo="Estatura para a idade" itens={rel.estatura} total={avaliadas} />
        <div className="rel-nutri-dist">
          <h4>Evolução do IMC desde a avaliação anterior</h4>
          <ul className="rel-nutri-evolucao">
            <li>
              <span className="evolucao melhorou">▲ Melhorou</span> <strong>{rel.evolucao.melhorou}</strong>
            </li>
            <li>
              <span className="evolucao estavel">● Estável</span> <strong>{rel.evolucao.estavel}</strong>
            </li>
            <li>
              <span className="evolucao piorou">▼ Piorou</span> <strong>{rel.evolucao.piorou}</strong>
            </li>
            <li>
              <span className="evolucao">Primeira avaliação</span> <strong>{rel.evolucao.semAnterior}</strong>
            </li>
          </ul>
          <small className="subtitulo">Melhorou = escore-z mais perto da eutrofia (−2 a +1).</small>
        </div>
      </section>

      <section className="rel-nutri-bloco-tabela">
        <h3>Crianças avaliadas</h3>
        {rel.linhas.length === 0 ? (
          <p className="vazio">Nenhuma avaliação com esses filtros.</p>
        ) : (
          <table className="rel-nutri-tabela">
            <thead>
              <tr>
                <th>Criança</th>
                {todasTurmas && <th>Turma</th>}
                <th>Idade</th>
                <th>Data</th>
                <th>Peso (kg)</th>
                <th>Altura (cm)</th>
                <th>IMC</th>
                <th>IMC/idade</th>
                <th>Estatura/idade</th>
                <th>Evolução do IMC</th>
              </tr>
            </thead>
            <tbody>
              {rel.linhas.map((l) => (
                <tr key={l.crianca.id}>
                  <td className="quebra">
                    {l.crianca.nome}
                    {l.noPeriodo > 1 && <small className="subtitulo"> · {l.noPeriodo} avaliações</small>}
                  </td>
                  {todasTurmas && <td>{l.crianca.grupo ?? '—'}</td>}
                  <td>{idadeCurta(l.crianca.dataNascimento, l.atual.medida.data)}</td>
                  <td>{dataBr(l.atual.medida.data)}</td>
                  <td>{num(l.atual.medida.pesoKg, 1)}</td>
                  <td>{num(l.atual.medida.alturaCm, 1)}</td>
                  <td>{num(l.atual.r.imc)}</td>
                  <td>
                    <Selo c={l.imc} curto />
                  </td>
                  <td>
                    <Selo c={l.estatura} curto />
                  </td>
                  <td>
                    <SetaEvolucao antes={l.anterior?.r.zImc} depois={l.atual.r.zImc} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {rel.naoAvaliadas.length > 0 && (
        <section className="rel-nutri-bloco rel-nutri-nao-avaliadas">
          <h3>Sem avaliação no período ({rel.naoAvaliadas.length})</h3>
          <p>{rel.naoAvaliadas.map((c) => (todasTurmas && c.grupo ? `${c.nome} (${c.grupo})` : c.nome)).join(' · ')}</p>
        </section>
      )}

      <Rodape />
    </>
  );
}

function RelatorioIndividual({
  clienteNome,
  crianca,
  avaliadas,
  tabelas,
  de,
  ate,
  tudo,
}: {
  clienteNome: string;
  crianca: Crianca;
  avaliadas: Avaliada[];
  tabelas: TabelasOms;
  de: string;
  ate: string;
  tudo: boolean;
}) {
  const doPeriodo = noPeriodo(avaliadas, de, ate);
  const ultima = ultimoDe(doPeriodo);
  const anterior = ultima ? avaliadas[avaliadas.indexOf(ultima) - 1] : undefined;
  // A curva mostra a trajetória até o fim do período.
  const ateOFim = avaliadas.filter((a) => a.medida.data <= ate);
  const pontos = (ind: Indicador): PontoCrianca[] =>
    ateOFim.map(({ medida, r }) => ({
      meses: r.meses,
      data: medida.data,
      valor: ind === 'imc' ? r.imc : ind === 'estatura' ? r.alturaCm : medida.pesoKg,
      z: ind === 'imc' ? r.zImc : ind === 'estatura' ? r.zEstatura : r.zPeso,
    }));
  const mostraPeso = ateOFim.some((a) => a.r.zPeso !== undefined);
  const idadeNoFim = idadeEmMeses(crianca.dataNascimento, ate < hoje() ? ate : hoje());

  return (
    <>
      <Cabecalho
        titulo={crianca.nome}
        clienteNome={clienteNome}
        linhas={[
          `${crianca.sexo === 'F' ? 'Menina' : 'Menino'} · nascida(o) em ${dataBr(crianca.dataNascimento)} · ${idadePorExtenso(
            crianca.dataNascimento,
            hoje(),
          )}${crianca.grupo ? ` · ${crianca.grupo}` : ''}`,
          crianca.observacoes ? `Observações: ${crianca.observacoes}` : '',
          tudo ? 'Período: todo o histórico' : `Período: ${dataBr(de)} a ${dataBr(ate)}`,
        ]}
      />

      {!ultima ? (
        <p className="vazio">Nenhuma avaliação no período.</p>
      ) : (
        <>
          <section className="rel-nutri-bloco">
            <h3>Avaliação de {dataBr(ultima.medida.data)}</h3>
            <p className="rel-nutri-medidas">
              Peso <strong>{num(ultima.medida.pesoKg, 2)} kg</strong> · Altura{' '}
              <strong>{num(ultima.medida.alturaCm)} cm</strong> · IMC <strong>{num(ultima.r.imc)} kg/m²</strong> · Idade{' '}
              {idadePorExtenso(crianca.dataNascimento, ultima.medida.data)}
            </p>
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
          </section>

          <section className="rel-nutri-curvas">
            <GraficoCrescimento tabelas={tabelas} indicador="imc" sexo={crianca.sexo} pontos={pontos('imc')} />
            <GraficoCrescimento tabelas={tabelas} indicador="estatura" sexo={crianca.sexo} pontos={pontos('estatura')} />
            {mostraPeso && idadeNoFim < 121 && (
              <GraficoCrescimento tabelas={tabelas} indicador="peso" sexo={crianca.sexo} pontos={pontos('peso')} />
            )}
          </section>

          <section className={`rel-nutri-bloco-tabela${doPeriodo.length <= 12 ? ' rel-nutri-bloco' : ''}`}>
            <h3>Avaliações no período ({doPeriodo.length})</h3>
            <table className="rel-nutri-tabela">
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
                </tr>
              </thead>
              <tbody>
                {[...doPeriodo].reverse().map(({ medida, r }) => (
                  <tr key={medida.id}>
                    <td>{dataBr(medida.data)}</td>
                    <td>{idadeCurta(crianca.dataNascimento, medida.data)}</td>
                    <td>{num(medida.pesoKg, 2)} kg</td>
                    <td>
                      {num(medida.alturaCm)} cm{medida.forma === 'deitado' ? ' (deitada)' : ''}
                    </td>
                    <td>{num(r.imc)}</td>
                    <td>
                      {r.zImc !== undefined ? (
                        <>
                          {num(r.zImc, 2)} <Selo c={classificarImc(r.zImc, r.meses)} curto />
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{r.zEstatura !== undefined ? num(r.zEstatura, 2) : '—'}</td>
                    <td>{r.zPeso !== undefined ? num(r.zPeso, 2) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <Rodape />
    </>
  );
}
