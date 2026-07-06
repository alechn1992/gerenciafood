import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import {
  CHECKLIST_BOAS_PRATICAS,
  POPS_OBRIGATORIOS,
  REFERENCIAS_NORMATIVAS,
} from '../domain/legislacao';
import { formatarData } from '../lib/datas';

type Situacao = 'conforme' | 'nao_conforme' | 'na' | '';

export function PaginaRelatorio() {
  const { id } = useParams();
  const { clientes } = useData();
  const cliente = clientes.find((c) => c.id === id);

  const [respostas, setRespostas] = useState<Record<string, Situacao>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [avaliador, setAvaliador] = useState('');
  const [dataAval, setDataAval] = useState(new Date().toISOString().slice(0, 10));

  if (!cliente) {
    return (
      <div className="card vazio">
        Cliente não encontrado. <Link to="/clientes">Voltar</Link>
      </div>
    );
  }

  const itensTotais = CHECKLIST_BOAS_PRATICAS.flatMap((b) => b.itens);
  const respondidos = itensTotais.filter((i) => respostas[i.id] && respostas[i.id] !== '');
  const conformes = itensTotais.filter((i) => respostas[i.id] === 'conforme');
  const naoConformes = itensTotais.filter((i) => respostas[i.id] === 'nao_conforme');
  const aplicaveis = itensTotais.filter((i) => respostas[i.id] && respostas[i.id] !== 'na');
  const indice =
    aplicaveis.length > 0
      ? Math.round((conformes.length / aplicaveis.length) * 100)
      : 0;

  return (
    <div>
      <div className="linha no-print">
        <div>
          <h1>Relatório de segurança dos alimentos</h1>
          <p className="subtitulo">
            Checklist de Boas Práticas — RDC ANVISA nº 216/2004 e normas do Paraná.
          </p>
        </div>
        <div className="acoes">
          <Link to="/clientes" className="btn secundario">
            ← Voltar
          </Link>
          <button className="btn" onClick={() => window.print()}>
            🖨️ Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="card">
        <div className="grid cols-2">
          <div>
            <h2 style={{ margin: '0 0 4px' }}>{cliente.nome}</h2>
            <div style={{ color: 'var(--cinza)' }}>
              {cliente.cnpj && <div>CNPJ: {cliente.cnpj}</div>}
              {cliente.responsavel && <div>Responsável: {cliente.responsavel}</div>}
              <div>
                {cliente.cidade ? `${cliente.cidade}/` : ''}
                {cliente.uf}
              </div>
            </div>
          </div>
          <div className="grid cols-2">
            <div className="no-print">
              <label>Avaliador</label>
              <input value={avaliador} onChange={(e) => setAvaliador(e.target.value)} />
            </div>
            <div className="no-print">
              <label>Data da avaliação</label>
              <input type="date" value={dataAval} onChange={(e) => setDataAval(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid cols-3">
          <Indicador titulo="Índice de conformidade" valor={`${indice}%`} destaque />
          <Indicador titulo="Conformes" valor={`${conformes.length}`} />
          <Indicador
            titulo="Não conformes"
            valor={`${naoConformes.length}`}
            alerta={naoConformes.length > 0}
          />
        </div>
        <p className="subtitulo" style={{ marginTop: 12, marginBottom: 0 }}>
          {respondidos.length} de {itensTotais.length} itens avaliados. Índice calculado
          sobre os itens aplicáveis (exclui "N/A").
        </p>
      </div>

      {CHECKLIST_BOAS_PRATICAS.map((bloco) => (
        <div key={bloco.titulo} className="card">
          <h3 style={{ marginTop: 0 }}>{bloco.titulo}</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ width: 210 }} className="no-print">
                  Situação
                </th>
                <th style={{ width: 90 }} className="somente-print" />
              </tr>
            </thead>
            <tbody>
              {bloco.itens.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.texto}
                    <div style={{ color: 'var(--cinza)', fontSize: '0.78rem', marginTop: 2 }}>
                      {item.referencia}
                    </div>
                    <input
                      className="no-print"
                      style={{ marginTop: 6 }}
                      placeholder="Observação (opcional)"
                      value={observacoes[item.id] ?? ''}
                      onChange={(e) =>
                        setObservacoes((p) => ({ ...p, [item.id]: e.target.value }))
                      }
                    />
                    {observacoes[item.id] && (
                      <div className="somente-print" style={{ fontSize: '0.82rem', marginTop: 4 }}>
                        Obs.: {observacoes[item.id]}
                      </div>
                    )}
                  </td>
                  <td className="no-print">
                    <SeletorSituacao
                      valor={respostas[item.id] ?? ''}
                      onChange={(v) => setRespostas((p) => ({ ...p, [item.id]: v }))}
                    />
                  </td>
                  <td className="somente-print">
                    {rotuloSituacao(respostas[item.id] ?? '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>POPs obrigatórios (RDC 216/2004, item 4.11.2)</h3>
        <ul>
          {POPS_OBRIGATORIOS.map((pop) => (
            <li key={pop}>{pop}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Referências normativas</h3>
        <table>
          <thead>
            <tr>
              <th>Norma</th>
              <th>Âmbito</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {REFERENCIAS_NORMATIVAS.map((r) => (
              <tr key={r.sigla}>
                <td>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer">
                      {r.sigla}
                    </a>
                  ) : (
                    r.sigla
                  )}
                </td>
                <td>{r.ambito}</td>
                <td>{r.titulo}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="subtitulo" style={{ marginTop: 12, marginBottom: 0 }}>
          Documento gerado em {formatarData(dataAval)}
          {avaliador && ` por ${avaliador}`}. Material de apoio operacional; não
          substitui a íntegra das normas nem a fiscalização da vigilância sanitária.
        </p>
      </div>
    </div>
  );
}

function Indicador({
  titulo,
  valor,
  destaque,
  alerta,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
  alerta?: boolean;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--borda)',
        borderRadius: 10,
        padding: 16,
        textAlign: 'center',
        background: destaque ? 'var(--verde-claro)' : alerta ? 'var(--alerta-bg)' : 'var(--branco)',
      }}
    >
      <div
        style={{
          fontSize: '1.8rem',
          fontWeight: 700,
          color: alerta ? 'var(--alerta)' : 'var(--verde-escuro)',
        }}
      >
        {valor}
      </div>
      <div style={{ color: 'var(--cinza)', fontSize: '0.85rem' }}>{titulo}</div>
    </div>
  );
}

function SeletorSituacao({
  valor,
  onChange,
}: {
  valor: Situacao;
  onChange: (v: Situacao) => void;
}) {
  const opcoes: { v: Situacao; label: string }[] = [
    { v: 'conforme', label: 'Conforme' },
    { v: 'nao_conforme', label: 'Não conf.' },
    { v: 'na', label: 'N/A' },
  ];
  return (
    <div className="chips">
      {opcoes.map((o) => (
        <span
          key={o.v}
          className={`chip ${valor === o.v ? 'on' : ''}`}
          onClick={() => onChange(valor === o.v ? '' : o.v)}
        >
          {o.label}
        </span>
      ))}
    </div>
  );
}

function rotuloSituacao(s: Situacao): string {
  return s === 'conforme'
    ? '☑ Conforme'
    : s === 'nao_conforme'
      ? '☒ Não conforme'
      : s === 'na'
        ? '— N/A'
        : '☐';
}
