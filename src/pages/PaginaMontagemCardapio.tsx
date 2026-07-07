import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../state/DataContext';
import { MontagemCardapio } from './PaginaCardapio';

export function PaginaMontagemCardapio() {
  const { clientes, carregando } = useData();
  const [clienteId, setClienteId] = useState('');

  const cliente = clientes.find((c) => c.id === clienteId);

  return (
    <div>
      <div className="linha no-print">
        <div>
          <h1>Montagem do cardápio</h1>
          <p className="subtitulo">
            Escolha um cliente para montar o cardápio aplicando automaticamente as
            particularidades já cadastradas (dias de operação, refeições, restrições
            e turmas, quando houver).
          </p>
        </div>
      </div>

      <div className="card no-print">
        <label>Cliente</label>
        {carregando ? (
          <p className="subtitulo" style={{ margin: 0 }}>
            Carregando clientes…
          </p>
        ) : clientes.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>
            Nenhum cliente cadastrado ainda.{' '}
            <Link to="/clientes/novo">Cadastre um cliente</Link> para montar o cardápio.
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

      {cliente && <MontagemCardapio cliente={cliente} />}
    </div>
  );
}
