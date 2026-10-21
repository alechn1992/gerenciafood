import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../state/DataContext';
import {
  type CategoriaPrato,
  type Prato,
} from '../domain/types';
import { categoriasDisponiveis } from '../domain/categorias';
import { rotuloCategoria } from '../domain/gerador';
import {
  pratoEhSazonal,
  UF_PARA_REGIAO,
  type RegiaoClimatica,
} from '../data/sazonalidade';

export function PaginaPratos() {
  const { pratos, salvarPrato, removerPrato, restricoesDisponiveis } = useData();
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaPrato>('proteina');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [filtro, setFiltro] = useState<CategoriaPrato | 'todas'>('todas');
  /** Prato em edição no formulário do topo; null = cadastrando um novo. */
  const [editando, setEditando] = useState<Prato | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const mesAtual = new Date().getMonth() + 1;
  const ufSalva = localStorage.getItem('sazonalidade_uf') ?? 'SP';
  const regiaoAtual = UF_PARA_REGIAO[ufSalva] as RegiaoClimatica | undefined;

  const idsSazonais = useMemo(() => {
    if (!regiaoAtual) return new Set<string>();
    return new Set(
      pratos
        .filter((p) => pratoEhSazonal(p.nome, p.tags, mesAtual, regiaoAtual))
        .map((p) => p.id),
    );
  }, [pratos, mesAtual, regiaoAtual]);

  const toggleRestricao = (r: string) =>
    setRestricoes((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]));

  const limparFormulario = () => {
    setEditando(null);
    setNome('');
    setCategoria('proteina');
    setRestricoes([]);
  };

  const editar = (p: Prato) => {
    setEditando(p);
    setNome(p.nome);
    setCategoria(p.categoria);
    setRestricoes(p.restricoes);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const salvar = async () => {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return;
    // A importação da planilha reaproveita pratos pelo nome: dois com o mesmo
    // nome fariam ela escolher um deles arbitrariamente.
    const repetido = pratos.find(
      (p) => p.id !== editando?.id && p.nome.trim().toLowerCase() === nomeLimpo.toLowerCase(),
    );
    if (repetido) {
      alert(`Já existe um prato chamado "${repetido.nome}".`);
      return;
    }
    const prato: Prato = editando
      ? { ...editando, nome: nomeLimpo, categoria, restricoes }
      : { id: crypto.randomUUID(), nome: nomeLimpo, categoria, restricoes, tags: [], ativo: true };
    try {
      await salvarPrato(prato);
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      alert(
        /categoria_check/.test(msg)
          ? 'O banco ainda não aceita categorias novas. Aplique a migração 0020_categorias_prato.sql no Supabase.'
          : `Não foi possível salvar o prato: ${msg}`,
      );
      return;
    }
    limparFormulario();
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

      <div className="card" ref={formRef}>
        <h3 style={{ marginTop: 0 }}>{editando ? `Editar prato — ${editando.nome}` : 'Novo prato'}</h3>
        <div className="grid cols-2">
          <div>
            <label>Nome do prato</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && salvar()}
              placeholder="Ex.: Strogonoff de frango"
            />
          </div>
          <div>
            <label>Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaPrato)}>
              {categoriasDisponiveis().map((c) => (
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
            {restricoesDisponiveis.map((r) => (
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
        <div className="acoes" style={{ marginTop: 14 }}>
          <button className="btn" onClick={salvar}>
            {editando ? 'Salvar alterações' : '+ Adicionar prato'}
          </button>
          {editando && (
            <button className="btn secundario" onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </div>
        {editando && (
          <p className="subtitulo" style={{ marginTop: 8, marginBottom: 0 }}>
            Cardápios já salvos guardam o nome antigo; os próximos usam o novo.
          </p>
        )}
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
            {categoriasDisponiveis().map((c) => (
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
              <th title={`Safra atual — ${ufSalva}`}>Safra</th>
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
                          {restricoesDisponiveis.find((x) => x.valor === r)?.nome ?? r}
                        </span>
                      ))}
                </td>
                <td>{p.ativo ? 'Ativo' : 'Inativo'}</td>
                <td style={{ textAlign: 'center' }}>
                  {idsSazonais.has(p.id) && (
                    <span title="Ingrediente em safra este mês" style={{ fontSize: 16 }}>
                      🌱
                    </span>
                  )}
                </td>
                <td>
                  <div className="acoes">
                    <button className="btn pequeno secundario" onClick={() => editar(p)}>
                      Editar
                    </button>
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
