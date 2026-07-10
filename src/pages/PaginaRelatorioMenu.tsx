import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../state/DataContext';
import { RelatorioCliente } from './PaginaRelatorio';

export function PaginaRelatorioMenu() {
  const { clientes, carregando } = useData();
  const [clienteId, setClienteId] = useState('');

  const cliente = clientes.find((c) => c.id === clienteId);

  return (
    <div>
      <div className="linha no-print">
        <div>
          <h1>Relatório de segurança dos alimentos</h1>
          <p className="subtitulo">
            Checklist de Boas Práticas — RDC ANVISA nº 216/2004 e normas do Paraná.
          </p>
        </div>
        {cliente && (
          <button className="btn no-print" onClick={() => window.print()}>
            🖨️ Imprimir / PDF
          </button>
        )}
      </div>

      <div className="card no-print">
        <label>Cliente</label>
        {carregando ? (
          <p className="subtitulo" style={{ margin: 0 }}>Carregando clientes…</p>
        ) : clientes.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>
            Nenhum cliente cadastrado ainda.{' '}
            <Link to="/clientes/novo">Cadastre um cliente</Link> para gerar o relatório.
          </p>
        ) : (
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Selecione um cliente…</option>
            {[...clientes]
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
          </select>
        )}
      </div>

      {cliente && <RelatorioCliente cliente={cliente} />}
    </div>
  );
}
