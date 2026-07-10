import { useState } from 'react';
import { useData } from '../state/DataContext';
import { UNIDADES_MEDIDA, type Insumo, type UnidadeMedida } from '../domain/types';

function calcUnitario(precoEmbalagem: number, qtd: number): number {
  if (qtd <= 0) return 0;
  return precoEmbalagem / qtd;
}

function formatarPreco(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PaginaInsumos() {
  const { insumos, salvarInsumo, removerInsumo } = useData();
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState<UnidadeMedida>('kg');
  const [qtdEmbalagem, setQtdEmbalagem] = useState('1');
  const [precoEmbalagem, setPrecoEmbalagem] = useState('');

  const qtdNum = Number(qtdEmbalagem.replace(',', '.')) || 1;
  const precoNum = Number(precoEmbalagem.replace(',', '.')) || 0;
  const precoUnitarioPreview = calcUnitario(precoNum, qtdNum);
  const siglaAtual = UNIDADES_MEDIDA.find((u) => u.valor === unidade)?.sigla ?? unidade;

  const adicionar = async () => {
    if (!nome.trim() || precoNum <= 0) return;
    const insumo: Insumo = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      unidade,
      qtdEmbalagem: qtdNum,
      precoEmbalagem: precoNum,
      precoUnitario: calcUnitario(precoNum, qtdNum),
      ativo: true,
    };
    await salvarInsumo(insumo);
    setNome('');
    setQtdEmbalagem('1');
    setPrecoEmbalagem('');
  };

  const listados = [...insumos].sort((a, b) => a.nome.localeCompare(b.nome));
  const siglaUnidade = (u: UnidadeMedida) =>
    UNIDADES_MEDIDA.find((x) => x.valor === u)?.sigla ?? u;

  return (
    <div>
      <h1>Insumos</h1>
      <p className="subtitulo">
        Informe a embalagem que você compra — o sistema calcula o preço por unidade
        automaticamente para usar nas fichas técnicas.
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Novo insumo</h3>
        <div className="grid cols-2" style={{ marginBottom: 14 }}>
          <div>
            <label>Nome do insumo</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && adicionar()}
              placeholder="Ex.: Ovos, Peito de frango, Farinha de trigo"
            />
          </div>
          <div>
            <label>Unidade base (usada na receita)</label>
            <select value={unidade} onChange={(e) => setUnidade(e.target.value as UnidadeMedida)}>
              {UNIDADES_MEDIDA.map((u) => (
                <option key={u.valor} value={u.valor}>
                  {u.nome} ({u.sigla})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ background: 'var(--verde-claro)', borderRadius: 8, padding: '14px 16px' }}>
          <label style={{ marginBottom: 8, display: 'block' }}>Dados da embalagem comprada</label>
          <div className="grid cols-3">
            <div>
              <label>Quantidade na embalagem</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  value={qtdEmbalagem}
                  onChange={(e) => setQtdEmbalagem(e.target.value)}
                  placeholder="Ex.: 30"
                  inputMode="decimal"
                />
                <span style={{ color: 'var(--cinza)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {siglaAtual}
                </span>
              </div>
            </div>
            <div>
              <label>Preço da embalagem (R$)</label>
              <input
                value={precoEmbalagem}
                onChange={(e) => setPrecoEmbalagem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && adicionar()}
                placeholder="Ex.: 18,00"
                inputMode="decimal"
              />
            </div>
            <div>
              <label>Preço por {siglaAtual} (calculado)</label>
              <div
                style={{
                  padding: '9px 11px',
                  background: 'var(--branco)',
                  border: '1px solid var(--borda)',
                  borderRadius: 8,
                  fontWeight: 700,
                  color: precoUnitarioPreview > 0 ? 'var(--verde-escuro)' : 'var(--cinza)',
                  fontSize: '0.95rem',
                }}
              >
                {precoUnitarioPreview > 0
                  ? `R$ ${formatarPreco(precoUnitarioPreview)} / ${siglaAtual}`
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        <button className="btn" style={{ marginTop: 14 }} onClick={adicionar}>
          + Adicionar insumo
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Insumos cadastrados ({listados.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Unidade</th>
                <th>Embalagem</th>
                <th>Preço embalagem</th>
                <th>Preço unitário</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {listados.map((i) => (
                <InsumoLinha
                  key={i.id}
                  insumo={i}
                  siglaUnidade={siglaUnidade(i.unidade)}
                  onSalvar={salvarInsumo}
                  onRemover={removerInsumo}
                />
              ))}
            </tbody>
          </table>
        </div>
        {listados.length === 0 && (
          <p className="subtitulo" style={{ margin: '12px 0 0' }}>
            Nenhum insumo cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}

function InsumoLinha({
  insumo,
  siglaUnidade,
  onSalvar,
  onRemover,
}: {
  insumo: Insumo;
  siglaUnidade: string;
  onSalvar: (i: Insumo) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
}) {
  const [qtd, setQtd] = useState(String(insumo.qtdEmbalagem));
  const [preco, setPreco] = useState(insumo.precoEmbalagem.toFixed(2).replace('.', ','));

  const salvar = () => {
    const qtdNum = Number(qtd.replace(',', '.')) || 1;
    const precoNum = Number(preco.replace(',', '.')) || 0;
    onSalvar({
      ...insumo,
      qtdEmbalagem: qtdNum,
      precoEmbalagem: precoNum,
      precoUnitario: calcUnitario(precoNum, qtdNum),
    });
  };

  const qtdNum = Number(qtd.replace(',', '.')) || 1;
  const precoNum = Number(preco.replace(',', '.')) || 0;

  return (
    <tr>
      <td>{insumo.nome}</td>
      <td>{siglaUnidade}</td>
      <td style={{ width: 120 }}>
        <input
          value={qtd}
          onChange={(e) => setQtd(e.target.value)}
          onBlur={salvar}
          inputMode="decimal"
          style={{ width: 80 }}
        />
      </td>
      <td style={{ width: 140 }}>
        <input
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          onBlur={salvar}
          inputMode="decimal"
          style={{ width: 110 }}
        />
      </td>
      <td style={{ fontWeight: 600, color: 'var(--verde-escuro)', whiteSpace: 'nowrap' }}>
        R$ {formatarPreco(calcUnitario(precoNum, qtdNum))} / {siglaUnidade}
      </td>
      <td>{insumo.ativo ? 'Ativo' : 'Inativo'}</td>
      <td>
        <div className="acoes">
          <button
            className="btn pequeno secundario"
            onClick={() => onSalvar({ ...insumo, ativo: !insumo.ativo })}
          >
            {insumo.ativo ? 'Desativar' : 'Ativar'}
          </button>
          <button
            className="btn pequeno perigo"
            onClick={() => {
              if (confirm(`Remover "${insumo.nome}"?`)) onRemover(insumo.id);
            }}
          >
            Excluir
          </button>
        </div>
      </td>
    </tr>
  );
}
