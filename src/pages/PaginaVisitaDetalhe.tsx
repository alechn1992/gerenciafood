import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import type { Visita } from '../domain/types';
import { TIPOS_VISITA } from '../domain/types';

function formatarData(iso?: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function PaginaVisitaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { clientes, repo } = useData();
  const [visita, setVisita] = useState<Visita | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (id) setVisita(await repo.carregarVisita(id));
      } catch {
        // continua com null
      } finally {
        setCarregando(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (carregando) {
    return <p style={{ padding: 32, color: 'var(--cinza)' }}>Carregando…</p>;
  }

  if (!visita) {
    return (
      <div className="card vazio">
        Visita não encontrada. <Link to="/visitas">Voltar</Link>
      </div>
    );
  }

  const cliente = clientes.find((c) => c.id === visita.clienteId);
  const tipoNome = TIPOS_VISITA.find((t) => t.valor === visita.tipo)?.nome ?? visita.tipo;

  const totalConformes = visita.secoes.reduce(
    (acc, s) => acc + s.itens.filter((i) => i.status === 'conforme').length, 0,
  );
  const totalNaoConformes = visita.secoes.reduce(
    (acc, s) => acc + s.itens.filter((i) => i.status === 'nao_conforme').length, 0,
  );
  const totalItens = totalConformes + totalNaoConformes;

  return (
    <div>
      {/* Barra de ações — oculta na impressão */}
      <div className="linha no-print" style={{ marginBottom: 20 }}>
        <Link to="/visitas" className="btn secundario">← Voltar</Link>
        <div className="acoes">
          <button className="btn secundario" onClick={() => window.print()}>
            🖨️ Imprimir / PDF
          </button>
        </div>
      </div>

      {/* RELATÓRIO */}
      <div className="relatorio-visita-wrapper">
        {/* Título */}
        <h1 className="relatorio-visita-titulo">Visita do dia {formatarData(visita.data)}</h1>

        {/* Cabeçalho em tabela */}
        <table className="relatorio-visita-cabecalho">
          <tbody>
            <tr>
              <td className="label">Cliente:</td>
              <td colSpan={3}><strong>{cliente?.nome ?? '—'}</strong></td>
            </tr>
            {(visita.consultor || visita.emailConsultor) && (
              <tr>
                <td className="label">Consultor(a):</td>
                <td>{visita.consultor}</td>
                {visita.emailConsultor && (
                  <>
                    <td className="label">E-mail:</td>
                    <td>{visita.emailConsultor}</td>
                  </>
                )}
              </tr>
            )}
            <tr>
              <td className="label">Data:</td>
              <td>{formatarData(visita.data)}</td>
              {visita.hora && (
                <>
                  <td className="label">Hora:</td>
                  <td>{visita.hora}</td>
                </>
              )}
            </tr>
            <tr>
              <td className="label">Tipo:</td>
              <td colSpan={3}>{tipoNome}</td>
            </tr>
          </tbody>
        </table>

        {/* Observações gerais */}
        {visita.observacoes && (
          <div className="relatorio-visita-obs">
            <strong>Observações Gerais / Objetivo:</strong> {visita.observacoes}
          </div>
        )}

        {/* Resumo de conformidades (oculto na impressão se não houver seções) */}
        {totalItens > 0 && (
          <div className="relatorio-visita-resumo no-print">
            <span style={{ color: '#16a34a', fontWeight: 700 }}>✔ {totalConformes} conforme{totalConformes !== 1 ? 's' : ''}</span>
            <span style={{ color: '#dc2626', fontWeight: 700 }}>✘ {totalNaoConformes} não conforme{totalNaoConformes !== 1 ? 's' : ''}</span>
            <span style={{ color: 'var(--cinza)' }}>{totalItens} iten{totalItens !== 1 ? 's' : 's'} no total</span>
          </div>
        )}

        {/* Seções */}
        {visita.secoes.length === 0 && (
          <p className="no-print" style={{ color: 'var(--cinza)', fontStyle: 'italic', margin: '24px 0' }}>
            Nenhuma seção registrada nesta visita.
          </p>
        )}

        {visita.secoes.map((secao) => (
          <div key={secao.id} className="relatorio-visita-secao">
            <div className="relatorio-visita-secao-header">{secao.nome}</div>
            <ul className="relatorio-visita-itens">
              {secao.itens.map((item) => (
                <li key={item.id} className="relatorio-visita-item">
                  <span
                    className={`relatorio-visita-icone ${item.status === 'conforme' ? 'conforme' : 'nao-conforme'}`}
                  >
                    {item.status === 'conforme' ? '✔' : '✘'}
                  </span>
                  <span>{item.descricao}</span>
                </li>
              ))}
              {secao.itens.length === 0 && (
                <li style={{ color: 'var(--cinza)', fontStyle: 'italic', listStyle: 'none' }}>
                  Nenhum item registrado nesta seção.
                </li>
              )}
            </ul>
          </div>
        ))}

        {/* Próxima visita */}
        {visita.proximaVisita && (
          <div className="relatorio-visita-proxima">
            <strong>Próxima visita agendada:</strong> {formatarData(visita.proximaVisita)}
          </div>
        )}

        {/* Rodapé */}
        {visita.consultor && (
          <div className="relatorio-visita-rodape">
            <div className="relatorio-visita-assinatura">
              <div className="relatorio-visita-assinatura-linha" />
              <p>{visita.consultor}</p>
              {visita.emailConsultor && <p style={{ fontSize: 12 }}>{visita.emailConsultor}</p>}
            </div>
          </div>
        )}

        {/* Paginação impressão */}
        <div className="print-only relatorio-visita-footer-impressao">
          Gerado em {new Date().toLocaleDateString('pt-BR')} — GerenciaFood
        </div>
      </div>

      {/* Estilos específicos do relatório */}
      <style>{`
        .relatorio-visita-wrapper {
          max-width: 800px;
          margin: 0 auto;
          font-family: inherit;
        }
        .relatorio-visita-titulo {
          text-align: center;
          font-size: 22px;
          margin-bottom: 20px;
        }
        .relatorio-visita-cabecalho {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .relatorio-visita-cabecalho td {
          padding: 6px 10px;
          border: 1px solid #ccc;
        }
        .relatorio-visita-cabecalho td.label {
          font-weight: 600;
          background: #f5f5f5;
          width: 130px;
          white-space: nowrap;
        }
        .relatorio-visita-obs {
          background: #f9f9f9;
          border: 1px solid #e0e0e0;
          border-left: 4px solid #f59e0b;
          padding: 10px 14px;
          margin-bottom: 20px;
          font-size: 14px;
          border-radius: 4px;
        }
        .relatorio-visita-resumo {
          display: flex;
          gap: 24px;
          margin-bottom: 16px;
          font-size: 14px;
          padding: 10px 14px;
          background: #f9f9f9;
          border-radius: 8px;
          border: 1px solid var(--borda);
        }
        .relatorio-visita-secao {
          margin-bottom: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }
        .relatorio-visita-secao-header {
          background: #f59e0b;
          color: white;
          font-weight: 700;
          font-size: 14px;
          padding: 8px 14px;
          letter-spacing: 0.3px;
        }
        .relatorio-visita-itens {
          list-style: none;
          margin: 0;
          padding: 10px 14px;
        }
        .relatorio-visita-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 5px 0;
          font-size: 14px;
          line-height: 1.5;
          border-bottom: 1px solid #f0f0f0;
        }
        .relatorio-visita-item:last-child { border-bottom: none; }
        .relatorio-visita-icone {
          font-size: 15px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .relatorio-visita-icone.conforme { color: #f59e0b; }
        .relatorio-visita-icone.nao-conforme { color: #dc2626; }
        .relatorio-visita-proxima {
          margin: 20px 0;
          padding: 10px 14px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          font-size: 14px;
        }
        .relatorio-visita-rodape {
          margin-top: 48px;
          padding-top: 16px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
        }
        .relatorio-visita-assinatura {
          display: inline-block;
          text-align: center;
        }
        .relatorio-visita-assinatura-linha {
          border-bottom: 1px solid #333;
          width: 220px;
          margin: 0 auto 8px;
        }
        .relatorio-visita-assinatura p {
          margin: 2px 0;
          font-size: 14px;
        }
        .relatorio-visita-footer-impressao {
          margin-top: 32px;
          font-size: 11px;
          color: #888;
          text-align: center;
        }

        @media print {
          .relatorio-visita-cabecalho td.label { background: #f5f5f5 !important; -webkit-print-color-adjust: exact; }
          .relatorio-visita-secao-header { background: #f59e0b !important; -webkit-print-color-adjust: exact; }
          .relatorio-visita-icone.conforme { color: #f59e0b !important; }
          .relatorio-visita-icone.nao-conforme { color: #dc2626 !important; }
          .relatorio-visita-obs { border-left-color: #f59e0b !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
