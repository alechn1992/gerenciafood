import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../state/DataContext';
import { DIAS_SEMANA } from '../domain/types';

export function PaginaClientes() {
  const { clientes, carregando, removerCliente } = useData();
  const navigate = useNavigate();

  return (
    <div>
      <div className="linha">
        <div>
          <h1>Clientes</h1>
          <p className="subtitulo">
            Cadastre cada cliente com suas particularidades de operação.
          </p>
        </div>
        <Link to="/clientes/novo" className="btn">
          + Novo cliente
        </Link>
      </div>

      <div className="card">
        {carregando ? (
          <div className="vazio">Carregando…</div>
        ) : clientes.length === 0 ? (
          <div className="vazio">
            Nenhum cliente cadastrado ainda.
            <br />
            Clique em <strong>Novo cliente</strong> para começar.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cidade/UF</th>
                <th>Dias de operação</th>
                <th>Refeições</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.nome}</strong>
                    {c.responsavel && (
                      <div style={{ color: 'var(--cinza)', fontSize: '0.82rem' }}>
                        {c.responsavel}
                      </div>
                    )}
                  </td>
                  <td>
                    {c.cidade ? `${c.cidade}/` : ''}
                    {c.uf}
                  </td>
                  <td>
                    {DIAS_SEMANA.filter((d) => c.diasOperacao.includes(d.valor))
                      .map((d) => d.curto)
                      .join(', ')}
                  </td>
                  <td>{c.refeicoes.length}</td>
                  <td>
                    <div className="acoes">
                      <Link
                        to={`/clientes/${c.id}/cardapio`}
                        className="btn pequeno"
                      >
                        Cardápio
                      </Link>
                      <Link
                        to={`/clientes/${c.id}/relatorio`}
                        className="btn pequeno secundario"
                      >
                        Relatório
                      </Link>
                      <Link
                        to={`/visitas?cliente=${c.id}`}
                        className="btn pequeno secundario"
                      >
                        Visitas
                      </Link>
                      <button
                        className="btn pequeno secundario"
                        onClick={() => navigate(`/clientes/${c.id}/editar`)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn pequeno perigo"
                        onClick={() => {
                          if (confirm(`Remover o cliente "${c.nome}"?`)) removerCliente(c.id);
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
