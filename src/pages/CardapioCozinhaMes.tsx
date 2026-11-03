// Cardápio mensal para a cozinha: todas as semanas do mês de uma turma em uma
// única folha A4 em retrato. A letra diminui sozinha até tudo caber na página.

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { aplicarCalendario } from '../domain/calendario';
import { ordemCategoria } from '../domain/categorias';
import { dataNaSemana, noMes, rotuloMes, semanasDoMes } from '../domain/cozinhaMensal';
import {
  DIAS_SEMANA,
  type Cardapio,
  type Cliente,
  type DiaSemana,
  type PeriodoSemFuncionamento,
  type RefeicaoConfig,
  type TipoRefeicao,
} from '../domain/types';

/** Uma turma (ou o cliente inteiro, sem turmas) que pode ir para a folha. */
export interface OpcaoCozinha {
  /** Vazio quando o cliente não usa turmas. */
  id: string;
  nome: string;
  refeicoes: RefeicaoConfig[];
}

const LETRA_MAX = 11;
const LETRA_MIN = 6;

const ddmm = (isoData: string) => `${isoData.slice(8, 10)}/${isoData.slice(5, 7)}`;

export function VisualizacaoCozinha({
  cliente,
  opcoes,
  cardapios,
  periodos,
  tiposRefeicao,
  mesInicial,
  opcaoInicial,
  onFechar,
}: {
  cliente: Cliente;
  opcoes: OpcaoCozinha[];
  /** Cardápios salvos do cliente (todas as turmas e semanas). */
  cardapios: Cardapio[];
  periodos: PeriodoSemFuncionamento[];
  tiposRefeicao: TipoRefeicao[];
  mesInicial: string;
  opcaoInicial: string;
  onFechar: () => void;
}) {
  const [mes, setMes] = useState(mesInicial);
  const [opcaoId, setOpcaoId] = useState(opcaoInicial);
  const opcao = opcoes.find((o) => o.id === opcaoId) ?? opcoes[0];

  const dias = DIAS_SEMANA.filter((d) => cliente.diasOperacao.includes(d.valor));
  const semanas = useMemo(() => {
    return semanasDoMes(mes, cliente.diasOperacao).map((semanaInicio) => {
      const salvo = cardapios.find(
        (c) => c.semanaInicio === semanaInicio && (c.turmaId ?? '') === (opcao?.id ?? ''),
      );
      return { semanaInicio, cardapio: salvo ? aplicarCalendario(salvo, periodos) : undefined };
    });
  }, [mes, cliente.diasOperacao, cardapios, opcao?.id, periodos]);

  const faltando = semanas.filter((s) => !s.cardapio).length;
  const rascunhos = semanas.filter((s) => s.cardapio?.status === 'rascunho').length;

  return (
    <div>
      <div className="linha no-print" style={{ marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Cardápio da cozinha — mês</h1>
          <p className="subtitulo" style={{ margin: '4px 0 0' }}>
            Todas as semanas do mês em uma folha A4 em pé, para afixar na cozinha.
          </p>
        </div>
        <div className="acoes">
          <button className="btn secundario" onClick={onFechar}>← Voltar</button>
          <button className="btn" onClick={() => window.print()}>🖨️ Imprimir / PDF</button>
        </div>
      </div>

      <div className="card no-print cz-filtros">
        <div>
          <label htmlFor="cz-mes">Mês</label>
          <input id="cz-mes" type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} />
        </div>
        {opcoes.length > 1 && (
          <div>
            <label htmlFor="cz-turma">Turma</label>
            <select id="cz-turma" value={opcao?.id} onChange={(e) => setOpcaoId(e.target.value)}>
              {opcoes.map((o) => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
        )}
        {(faltando > 0 || rascunhos > 0) && (
          <p className="aviso" style={{ margin: 0, flexBasis: '100%' }}>
            {faltando > 0 && `${faltando} semana(s) do mês ainda sem cardápio salvo para esta turma. `}
            {rascunhos > 0 && `${rascunhos} semana(s) em rascunho (saem marcadas na folha).`}
          </p>
        )}
      </div>

      {opcao && (
        <FolhaCozinha
          cliente={cliente}
          titulo={opcao.id ? opcao.nome : undefined}
          refeicoes={opcao.refeicoes}
          mes={mes}
          dias={dias.map((d) => ({ valor: d.valor, curto: d.curto }))}
          semanas={semanas}
          tiposRefeicao={tiposRefeicao}
        />
      )}
    </div>
  );
}

function pratosDe(cardapio: Cardapio, dia: DiaSemana, tipoRefeicaoId: string): string[] {
  return cardapio.itens
    .filter((i) => i.dia === dia && i.tipoRefeicaoId === tipoRefeicaoId)
    .sort((a, b) => ordemCategoria(a.categoria) - ordemCategoria(b.categoria))
    .map((i) => i.pratoNome);
}

function FolhaCozinha({
  cliente,
  titulo,
  refeicoes,
  mes,
  dias,
  semanas,
  tiposRefeicao,
}: {
  cliente: Cliente;
  titulo?: string;
  refeicoes: RefeicaoConfig[];
  mes: string;
  dias: { valor: DiaSemana; curto: string }[];
  semanas: { semanaInicio: string; cardapio?: Cardapio }[];
  tiposRefeicao: TipoRefeicao[];
}) {
  const medidaRef = useRef<HTMLDivElement>(null);
  const conteudoRef = useRef<HTMLDivElement>(null);
  const [naoCoube, setNaoCoube] = useState(false);
  const nomeTipo = (id: string) => tiposRefeicao.find((t) => t.id === id)?.nome ?? id;

  // Maior letra que ainda cabe na folha (busca binária medindo o conteúdo).
  useLayoutEffect(() => {
    const medida = medidaRef.current;
    const conteudo = conteudoRef.current;
    if (!medida || !conteudo) return;
    const altura = medida.getBoundingClientRect().height;
    const cabe = (px: number) => {
      conteudo.style.fontSize = `${px}px`;
      return conteudo.scrollHeight <= altura;
    };
    let lo = LETRA_MIN;
    let hi = LETRA_MAX;
    if (cabe(hi)) lo = hi;
    else {
      for (let i = 0; i < 8; i++) {
        const meio = (lo + hi) / 2;
        if (cabe(meio)) lo = meio;
        else hi = meio;
      }
    }
    const final = Math.floor(lo * 10) / 10;
    setNaoCoube(!cabe(final));
  });

  const responsavel = [cliente.responsavel, cliente.registroProfissional].filter(Boolean).join(' — ');

  return (
    <>
      {naoCoube && (
        <p className="aviso no-print">
          O mês não coube em uma página nem com a letra mínima; a impressão vai usar mais de uma folha.
        </p>
      )}
      <div className="cz-papel">
        <div ref={medidaRef} className="cz-medida" aria-hidden />
        <div className={`cz-folha${naoCoube ? ' cz-folha-livre' : ''}`}>
          <div ref={conteudoRef} className="cz-conteudo">
            <header className="cz-cabecalho">
              {cliente.logo && <img className="cz-logo" src={cliente.logo} alt="" />}
              <div className="cz-cabecalho-texto">
                <div className="cz-supertitulo">Cardápio da cozinha</div>
                <div className="cz-titulo">
                  {cliente.nome}
                  {titulo && <span className="cz-turma"> · {titulo}</span>}
                </div>
              </div>
              <div className="cz-mes">{rotuloMes(mes)}</div>
            </header>

            {semanas.map(({ semanaInicio, cardapio }, si) => {
              const doMes = dias.filter((d) => noMes(dataNaSemana(semanaInicio, d.valor), mes));
              const primeiro = doMes[0] ? dataNaSemana(semanaInicio, doMes[0].valor) : semanaInicio;
              const ultimo = doMes.length ? dataNaSemana(semanaInicio, doMes[doMes.length - 1].valor) : semanaInicio;
              const aviso = (dia: DiaSemana) => cardapio?.avisos?.find((a) => a.dia === dia)?.texto;
              const soAviso = (dia: DiaSemana) =>
                !!aviso(dia) && !cardapio?.itens.some((i) => i.dia === dia);
              const foraDoMes = (dia: DiaSemana) => !noMes(dataNaSemana(semanaInicio, dia), mes);
              return (
                <table key={semanaInicio} className="cz-semana">
                  <colgroup>
                    <col className="cz-col-refeicao" />
                    {dias.map((d) => <col key={d.valor} />)}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="cz-rotulo-semana">
                        Semana {si + 1}
                        <span>{ddmm(primeiro)} a {ddmm(ultimo)}</span>
                        {cardapio?.status === 'rascunho' && <em className="cz-rascunho">rascunho</em>}
                      </th>
                      {dias.map((d) => {
                        const data = dataNaSemana(semanaInicio, d.valor);
                        return (
                          <th key={d.valor} className={foraDoMes(d.valor) ? 'cz-fora' : undefined}>
                            {d.curto} <span>{ddmm(data)}</span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {!cardapio ? (
                      <tr>
                        <td className="cz-sem-cardapio" colSpan={dias.length + 1}>
                          Semana sem cardápio salvo para esta turma.
                        </td>
                      </tr>
                    ) : (
                      refeicoes.map((ref, ri) => (
                        <tr key={ref.tipoRefeicaoId}>
                          <th scope="row" className="cz-refeicao">{nomeTipo(ref.tipoRefeicaoId)}</th>
                          {dias.map((d) => {
                            if (foraDoMes(d.valor)) {
                              return ri === 0 ? (
                                <td key={d.valor} rowSpan={refeicoes.length} className="cz-fora" />
                              ) : null;
                            }
                            if (soAviso(d.valor)) {
                              return ri === 0 ? (
                                <td key={d.valor} rowSpan={refeicoes.length} className="cz-aviso">
                                  {aviso(d.valor)}
                                </td>
                              ) : null;
                            }
                            const pratos = pratosDe(cardapio, d.valor, ref.tipoRefeicaoId);
                            return (
                              <td key={d.valor}>
                                {pratos.length === 0
                                  ? <span className="cz-vazio">—</span>
                                  : pratos.map((p, i) => <div key={i}>{p}</div>)}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              );
            })}

            <footer className="cz-rodape">
              <span>Sujeito a alterações conforme disponibilidade e qualidade dos alimentos.</span>
              {responsavel && <strong>{responsavel}</strong>}
            </footer>
          </div>
        </div>
      </div>

      <style>{`
        .cz-filtros { display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: flex-end; }
        .cz-filtros > div { min-width: 180px; }

        /* Folha A4 em pé: 210 × 297 mm menos 8 mm de margem de cada lado. */
        .cz-papel { position: relative; overflow-x: auto; padding-bottom: 8px; }
        .cz-medida { position: absolute; visibility: hidden; height: 279mm; width: 1px; pointer-events: none; }
        .cz-folha {
          width: 194mm;
          height: 279mm;
          margin: 0 auto;
          padding: 0;
          overflow: hidden;
          background: #fff;
          color: #1c2b24;
          box-shadow: 0 0 0 1px #d8e3dc, 0 4px 18px rgba(20, 40, 30, 0.12);
          outline: 8mm solid #fff;
          box-sizing: content-box;
        }
        .cz-folha-livre { height: auto; overflow: visible; }
        .cz-conteudo { font-size: ${LETRA_MAX}px; line-height: 1.25; }

        .cz-cabecalho {
          display: flex;
          align-items: center;
          gap: 1em;
          padding-bottom: 0.5em;
          margin-bottom: 0.7em;
          border-bottom: 0.25em solid #1f7a4d;
        }
        .cz-logo { max-height: 4.2em; max-width: 9em; object-fit: contain; }
        .cz-cabecalho-texto { flex: 1; min-width: 0; }
        .cz-supertitulo {
          font-size: 0.8em;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #1f7a4d;
        }
        .cz-titulo { font-size: 1.45em; font-weight: 700; line-height: 1.15; }
        .cz-turma { color: #1f7a4d; }
        .cz-mes {
          font-size: 1.25em;
          font-weight: 700;
          color: #fff;
          background: #1f7a4d;
          border-radius: 0.35em;
          padding: 0.3em 0.7em;
          white-space: nowrap;
        }

        .cz-semana {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          margin-bottom: 0.6em;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .cz-col-refeicao { width: 13%; }
        .cz-semana th, .cz-semana td {
          border: 1px solid #b9cfc2;
          padding: 0.3em 0.4em;
          vertical-align: top;
          text-align: left;
          font-size: 1em;
          text-transform: none;
          letter-spacing: 0;
          color: inherit;
        }
        .cz-semana thead th {
          background: #1f7a4d;
          color: #fff;
          font-weight: 700;
          text-align: center;
          vertical-align: middle;
          border-color: #1f7a4d;
        }
        .cz-semana thead th span { font-weight: 400; opacity: 0.9; }
        .cz-semana thead th.cz-rotulo-semana { text-align: left; background: #145636; border-color: #145636; }
        .cz-rotulo-semana span { display: block; font-size: 0.85em; }
        .cz-semana thead th.cz-fora { background: #9fb3a8; border-color: #9fb3a8; }
        .cz-rascunho {
          display: inline-block;
          margin-top: 0.15em;
          padding: 0 0.35em;
          border-radius: 0.25em;
          background: #fff1c2;
          color: #6b4a00;
          font-size: 0.75em;
          font-style: normal;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .cz-refeicao {
          background: #eef7f1;
          color: #145636;
          font-weight: 700;
          vertical-align: middle !important;
        }
        .cz-semana td div + div { margin-top: 0.15em; }
        .cz-semana td div:first-child { font-weight: 600; }
        .cz-semana td.cz-fora { background: repeating-linear-gradient(135deg, #f3f6f4 0 4px, #e9efeb 4px 8px); }
        .cz-semana td.cz-aviso {
          background: #fff4e0;
          color: #8a4b00;
          text-align: center;
          vertical-align: middle;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .cz-semana td.cz-sem-cardapio { color: #6b7d74; font-style: italic; text-align: center; }
        .cz-vazio { color: #b7c4bd; }

        .cz-rodape {
          display: flex;
          justify-content: space-between;
          gap: 1em;
          flex-wrap: wrap;
          font-size: 0.85em;
          color: #6b7d74;
          border-top: 1px solid #cfe3d6;
          padding-top: 0.4em;
        }
        .cz-rodape strong { color: #1c2b24; }

        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          .cz-papel { overflow: visible; padding: 0; }
          .cz-medida { display: none; }
          /* A folha em pé é estreita e cairia no espaçamento do layout de celular. */
          .conteudo { padding: 0 !important; margin: 0 !important; }
          html, body { background: #fff !important; }
          .cz-folha { box-shadow: none; outline: none; margin: 0; }
          .cz-semana thead th, .cz-refeicao, .cz-aviso, .cz-fora, .cz-mes, .cz-rascunho {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
}
