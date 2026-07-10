import { useState } from 'react';
import { useData } from '../state/DataContext';
import { UNIDADES_MEDIDA, type Insumo, type UnidadeMedida } from '../domain/types';

export function PaginaInsumos() {
  const { insumos, salvarInsumo, removerInsumo } = useData();
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState<UnidadeMedida>('kg');
  const [preco, setPreco] = useState('');

  const adicionar = async () => {
    if (!nome.trim()) return;
    const insumo: Insumo = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      unidade,
      precoUnitario: Number(preco.replace(',', '.')) || 0,
      ativo: true,
    };
    await salvarInsumo(insumo);
    setNome('');
    setPreco('');
  };

  const atualizarPreco = (insumo: Insumo, valor: string) => {
    salvarInsumo({ ...insumo, precoUnitario: Number(valor.replace(',', '.')) || 0 });
  };

  const listados = [...insumos].sort((a, b) => a.nome.localeCompare(b.nome));
  const siglaUnidade = (u: UnidadeMedida) =>
    UNIDADES_MEDIDA.find((x) => x.valor === u)?.sigla ?? u;

  return (
    <div>
      <h1>Insumos</h1>
      <p className="subtitulo">
        Cadastre os insumos (matérias-primas) e seus preços. Ao vincular
        quantidades na receita de um prato, o custo é calculado automaticamente.
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Novo insumo</h3>
        <div className="grid cols-3">
          <div>
            <label>Nome do insumo</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && adicionar()}
              placeholder="Ex.: Peito de frango"
            />
          </div>
          <div>
            <label>Unidade de medida</label>
            <select value={unidade} onChange={(e) => setUnidade(e.target.value as UnidadeMedida)}>
              {UNIDADES_MEDIDA.map((u) => (
                <option key={u.valor} value={u.valor}>
                  {u.nome} ({u.sigla})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Preço por unidade (R$)</label>
            <input
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && adicionar()}
              placeholder="Ex.: 18,90"
              inputMode="decimal"
            />
          </div>
        </div>
        <button className="btn" style={{ marginTop: 14 }} onClick={adicionar}>
          + Adicionar insumo
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Insumos cadastrados ({listados.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Unidade</th>
              <th style={{ width: 160 }}>Preço por unidade</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {listados.map((i) => (
              <tr key={i.id}>
                <td>{i.nome}</td>
                <td>{siglaUnidade(i.unidade)}</td>
                <td>
                  <input
                    defaultValue={i.precoUnitario.toFixed(2).replace('.', ',')}
                    onBlur={(e) => atualizarPreco(i, e.target.value)}
                    inputMode="decimal"
                  />
                </td>
                <td>{i.ativo ? 'Ativo' : 'Inativo'}</td>
                <td>
                  <div className="acoes">
                    <button
                      className="btn pequeno secundario"
                      onClick={() => salvarInsumo({ ...i, ativo: !i.ativo })}
                    >
                      {i.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      className="btn pequeno perigo"
                      onClick={() => {
                        if (confirm(`Remover "${i.nome}"?`)) removerInsumo(i.id);
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
        {listados.length === 0 && (
          <p className="subtitulo" style={{ margin: '12px 0 0' }}>
            Nenhum insumo cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
