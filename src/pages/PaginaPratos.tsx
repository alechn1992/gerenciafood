import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../state/DataContext';
import {
  CATEGORIAS_PRATO,
  type CategoriaPrato,
  type Prato,
} from '../domain/types';
import { RESTRICOES_DISPONIVEIS } from '../data/seed';
import { rotuloCategoria } from '../domain/gerador';

export function PaginaPratos() {
  const { pratos, salvarPrato, removerPrato } = useData();
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaPrato>('proteina');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [filtro, setFiltro] = useState<CategoriaPrato | 'todas'>('todas');

  const toggleRestricao = (r: string) =>
    setRestricoes((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]));

  const adicionar = async () => {
    if (!nome.trim()) return;
    const prato: Prato = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      categoria,
      restricoes,
      tags: [],
      ativo: true,
    };
    await salvarPrato(prato);
    setNome('');
    setRestricoes([]);
  };

  const listados = pratos
    .filter((p) => filtro === 'todas' || p.categoria === filtro)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div>
      <h1>Banco de pratos</h1>
      <p className="subtitulo">
        Cadastre os pratos disponíveis. Eles alimentam a geração automática dos
        cardápios.
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Novo prato</h3>
        <div className="grid cols-2">
          <div>
            <label>Nome do prato</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && adicionar()}
              placeholder="Ex.: Strogonoff de frango"
            />
          </div>
          <div>
            <label>Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaPrato)}>
              {CATEGORIAS_PRATO.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Atende às restrições (opcional)</label>
          <div className="chips">
            {RESTRICOES_DISPONIVEIS.map((r) => (
              <span
                key={r.valor}
                className={`chip ${restricoes.includes(r.valor) ? 'on' : ''}`}
                onClick={() => toggleRestricao(r.valor)}
              >
                {r.nome}
              </span>
            ))}
          </div>
        </div>
        <button className="btn" style={{ marginTop: 14 }} onClick={adicionar}>
          + Adicionar prato
        </button>
      </div>

      <div className="card">
        <div className="linha" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Pratos cadastrados ({listados.length})</h3>
          <select
            value={filtro}
            style={{ width: 200 }}
            onChange={(e) => setFiltro(e.target.value as CategoriaPrato | 'todas')}
          >
            <option value="todas">Todas as categorias</option>
            {CATEGORIAS_PRATO.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Prato</th>
              <th>Categoria</th>
              <th>Restrições atendidas</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {listados.map((p) => (
              <tr key={p.id}>
                <td>{p.nome}</td>
                <td>{rotuloCategoria(p.categoria)}</td>
                <td>
                  {p.restricoes.length === 0
                    ? '—'
                    : p.restricoes.map((r) => (
                        <span key={r} className="tag">
                          {RESTRICOES_DISPONIVEIS.find((x) => x.valor === r)?.nome ?? r}
                        </span>
                      ))}
                </td>
                <td>{p.ativo ? 'Ativo' : 'Inativo'}</td>
                <td>
                  <div className="acoes">
                    <button
                      className="btn pequeno secundario"
                      onClick={() => salvarPrato({ ...p, ativo: !p.ativo })}
                    >
                      {p.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <Link className="btn pequeno secundario" to={`/pratos/${p.id}/receita`}>
                      {p.receita ? 'Receita' : '+ Receita'}
                    </Link>
                    <button
                      className="btn pequeno perigo"
                      onClick={() => {
                        if (confirm(`Remover "${p.nome}"?`)) removerPrato(p.id);
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
      </div>
    </div>
  );
}
