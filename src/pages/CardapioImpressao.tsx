// Visão de impressão do cardápio voltada às famílias.
//
// Diferente da grade de edição (que separa cada categoria em sua própria linha
// para o trabalho do nutricionista), aqui cada refeição ocupa uma única linha e
// os pratos aparecem agrupados — o formato que os pais esperam ler.

import {
  CATEGORIAS_PRATO,
  DIAS_SEMANA,
  type Cardapio,
  type Cliente,
  type DiaSemana,
  type ItemCardapio,
  type RefeicaoConfig,
  type TipoRefeicao,
} from '../domain/types';

/** Um agrupamento impresso dentro de uma semana (uma turma, ou o cliente inteiro). */
export interface BlocoImpressao {
  /** Nome da turma; ausente quando o cliente não usa turmas. */
  titulo?: string;
  cardapio: Cardapio;
  refeicoes: RefeicaoConfig[];
}

export interface SemanaImpressao {
  semanaInicio: string;
  blocos: BlocoImpressao[];
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Ordem de exibição dos pratos dentro de uma refeição (prato principal primeiro). */
const ORDEM_CATEGORIA = new Map(CATEGORIAS_PRATO.map((c, i) => [c.valor, i]));

/** Data efetiva de um dia da semana, a partir da segunda-feira de referência. */
function dataDoDia(semanaInicio: string, dia: DiaSemana): Date {
  const d = new Date(`${semanaInicio}T00:00:00`);
  d.setDate(d.getDate() + (dia === 0 ? 6 : dia - 1));
  return d;
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** Ex.: "3 a 7 de fevereiro de 2026" — ou com dois meses quando a semana vira o mês. */
function rotuloPeriodo(semanaInicio: string, dias: DiaSemana[]): string {
  if (dias.length === 0) return '';
  const inicio = dataDoDia(semanaInicio, dias[0]);
  const fim = dataDoDia(semanaInicio, dias[dias.length - 1]);
  const mesmoMes = inicio.getMonth() === fim.getMonth();
  const ini = mesmoMes
    ? `${inicio.getDate()}`
    : `${inicio.getDate()} de ${MESES[inicio.getMonth()]}`;
  return `${ini} a ${fim.getDate()} de ${MESES[fim.getMonth()]} de ${fim.getFullYear()}`;
}

/** Pratos de uma célula (dia + refeição), ordenados do principal ao complemento. */
function pratosDaCelula(
  itens: ItemCardapio[],
  dia: DiaSemana,
  tipoRefeicaoId: string,
): string[] {
  return itens
    .filter((i) => i.dia === dia && i.tipoRefeicaoId === tipoRefeicaoId)
    .slice()
    .sort(
      (a, b) =>
        (ORDEM_CATEGORIA.get(a.categoria) ?? 99) - (ORDEM_CATEGORIA.get(b.categoria) ?? 99),
    )
    .map((i) => i.pratoNome);
}

export function CardapioImpressao({
  cliente,
  semanas,
  tiposRefeicao,
  responsavel,
  registro,
}: {
  cliente: Cliente;
  semanas: SemanaImpressao[];
  tiposRefeicao: TipoRefeicao[];
  responsavel?: string;
  registro?: string;
}) {
  const dias = DIAS_SEMANA.filter((d) => cliente.diasOperacao.includes(d.valor));
  const nomeTipo = (id: string) => tiposRefeicao.find((t) => t.id === id)?.nome ?? id;

  return (
    <div className="cp-folha">
      {semanas.map((semana, si) => (
        <section key={semana.semanaInicio} className={si > 0 ? 'cp-semana cp-quebra' : 'cp-semana'}>
          <header className="cp-cabecalho">
            {cliente.logo && <img className="cp-logo" src={cliente.logo} alt={cliente.nome} />}
            <div className="cp-cabecalho-texto">
              <p className="cp-supertitulo">Cardápio semanal</p>
              <h1 className="cp-titulo">{cliente.nome}</h1>
              <p className="cp-periodo">
                {rotuloPeriodo(semana.semanaInicio, dias.map((d) => d.valor))}
              </p>
            </div>
          </header>

          {semana.blocos.map((bloco) => (
            <div key={bloco.cardapio.id} className="cp-bloco">
              {bloco.titulo && <h2 className="cp-turma">{bloco.titulo}</h2>}

              <table className="cp-tabela">
                <thead>
                  <tr>
                    <th className="cp-col-refeicao">Refeição</th>
                    {dias.map((d) => {
                      const data = dataDoDia(semana.semanaInicio, d.valor);
                      return (
                        <th key={d.valor}>
                          <span className="cp-dia-nome">{d.nome.replace('-feira', '')}</span>
                          <span className="cp-dia-data">
                            {doisDigitos(data.getDate())}/{doisDigitos(data.getMonth() + 1)}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {bloco.refeicoes.map((ref) => (
                    <tr key={ref.tipoRefeicaoId}>
                      <th scope="row" className="cp-refeicao">
                        {nomeTipo(ref.tipoRefeicaoId)}
                      </th>
                      {dias.map((d) => {
                        const pratos = pratosDaCelula(
                          bloco.cardapio.itens,
                          d.valor,
                          ref.tipoRefeicaoId,
                        );
                        return (
                          <td key={d.valor}>
                            {pratos.length === 0 ? (
                              <span className="cp-vazio">—</span>
                            ) : (
                              <ul className="cp-pratos">
                                {pratos.map((nome, i) => (
                                  <li key={i} className={i === 0 ? 'cp-principal' : undefined}>
                                    {nome}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <footer className="cp-rodape">
            <p className="cp-nota">
              Cardápio sujeito a alterações conforme a disponibilidade e a qualidade
              dos alimentos.
            </p>
            {(responsavel || registro) && (
              <p className="cp-assinatura">
                {responsavel}
                {responsavel && registro ? ' — ' : ''}
                {registro}
              </p>
            )}
          </footer>
        </section>
      ))}

      <style>{`
        .cp-folha {
          --cp-verde: #1f7a4d;
          --cp-verde-claro: #eef7f1;
          --cp-verde-borda: #cfe3d6;
          --cp-texto: #1c2b24;
          --cp-suave: #6b7d74;
          background: #fff;
          color: var(--cp-texto);
          max-width: 1100px;
          margin: 0 auto;
        }

        .cp-semana {
          padding: 4px 0 28px;
        }

        /* ── Cabeçalho ─────────────────────────────── */
        .cp-cabecalho {
          display: flex;
          align-items: center;
          gap: 18px;
          padding-bottom: 14px;
          border-bottom: 3px solid var(--cp-verde);
          margin-bottom: 20px;
        }
        .cp-logo {
          max-height: 68px;
          max-width: 150px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .cp-cabecalho-texto { flex: 1; min-width: 0; }
        .cp-supertitulo {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--cp-verde);
        }
        .cp-titulo {
          margin: 2px 0 4px;
          font-size: 1.6rem;
          line-height: 1.15;
          font-weight: 700;
        }
        .cp-periodo {
          margin: 0;
          font-size: 0.95rem;
          color: var(--cp-suave);
        }

        /* ── Turma ─────────────────────────────────── */
        .cp-bloco { margin-bottom: 22px; break-inside: avoid; }
        .cp-turma {
          margin: 0 0 8px;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--cp-verde);
          background: var(--cp-verde-claro);
          border-left: 4px solid var(--cp-verde);
          border-radius: 0 6px 6px 0;
          padding: 7px 12px;
        }

        /* ── Tabela ────────────────────────────────── */
        .cp-tabela {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border: 1px solid var(--cp-verde-borda);
          border-radius: 8px;
          overflow: hidden;
          table-layout: fixed;
        }
        .cp-tabela thead th {
          background: var(--cp-verde);
          color: #fff;
          padding: 9px 8px;
          text-align: center;
          vertical-align: middle;
          border: none;
        }
        .cp-dia-nome {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .cp-dia-data {
          display: block;
          font-size: 0.7rem;
          font-weight: 400;
          opacity: 0.85;
          margin-top: 1px;
        }
        .cp-col-refeicao { width: 15%; }

        /* Zebra apenas nas células de pratos — a coluna de refeição mantém o
           tom verde uniforme, servindo de âncora visual à esquerda. */
        .cp-tabela tbody tr:nth-child(even) td {
          background: #fafcfb;
        }
        .cp-refeicao {
          background: var(--cp-verde-claro);
          color: var(--cp-verde);
          font-size: 0.8rem;
          font-weight: 700;
          text-align: left;
          vertical-align: middle;
          padding: 10px;
          border-top: 1px solid var(--cp-verde-borda);
          border-right: 1px solid var(--cp-verde-borda);
        }
        .cp-tabela tbody td {
          padding: 9px 10px;
          vertical-align: top;
          border-top: 1px solid var(--cp-verde-borda);
          border-right: 1px solid #e8f0eb;
        }
        .cp-tabela tbody td:last-child { border-right: none; }

        .cp-pratos { margin: 0; padding: 0; list-style: none; }
        .cp-pratos li {
          font-size: 0.82rem;
          line-height: 1.42;
          padding: 1px 0;
        }
        .cp-principal { font-weight: 600; }
        .cp-vazio { color: #b7c4bd; }

        /* ── Rodapé ────────────────────────────────── */
        .cp-rodape {
          margin-top: 18px;
          padding-top: 12px;
          border-top: 1px solid var(--cp-verde-borda);
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          flex-wrap: wrap;
        }
        .cp-nota {
          margin: 0;
          font-size: 0.74rem;
          color: var(--cp-suave);
          font-style: italic;
        }
        .cp-assinatura {
          margin: 0;
          font-size: 0.78rem;
          font-weight: 600;
          white-space: nowrap;
        }

        /* ── Impressão ─────────────────────────────── */
        @media print {
          @page { size: A4 landscape; margin: 10mm; }

          .cp-folha { max-width: none; }
          .cp-quebra { break-before: page; }
          .cp-semana { padding: 0 0 8px; }
          .cp-bloco { break-inside: avoid; page-break-inside: avoid; }
          .cp-tabela { break-inside: avoid; page-break-inside: avoid; }

          .cp-titulo { font-size: 1.35rem; }
          .cp-pratos li { font-size: 0.78rem; }

          /* Fundos coloridos precisam ser preservados na impressão. */
          .cp-tabela thead th,
          .cp-refeicao,
          .cp-turma {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
