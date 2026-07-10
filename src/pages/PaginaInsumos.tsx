import { useState } from 'react';
import { useData } from '../state/DataContext';
import { UNIDADES_MEDIDA, type Insumo, type NutricaoInsumo, type UnidadeMedida } from '../domain/types';
import { TODAS_TABELAS, ROTULO_FONTE, COR_FONTE, type ItemTaco } from '../data/tabelasNutricao';

// Unidades cujo peso em gramas é derivado automaticamente da quantidade.
const PESO_AUTO = new Set<UnidadeMedida>(['kg', 'g', 'l', 'ml']);

function calcUnitario(precoEmbalagem: number, qtd: number): number {
  if (qtd <= 0) return 0;
  return precoEmbalagem / qtd;
}

function formatarPreco(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarNutri(v: number, casas = 1) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

// ─── Busca TACO ──────────────────────────────────────────────────────────────

function TacoBusca({ onSelecionar }: { onSelecionar: (item: ItemTaco) => void }) {
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);

  const resultados =
    busca.trim().length >= 2
      ? TODAS_TABELAS.filter((t) =>
          t.nome.toLowerCase().includes(busca.trim().toLowerCase()),
        ).slice(0, 12)
      : [];

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value);
          setAberto(true);
        }}
        onBlur={() => setTimeout(() => setAberto(false), 200)}
        onFocus={() => setAberto(true)}
        placeholder="Buscar na tabela TACO…"
      />
      {aberto && resultados.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--branco)',
            border: '1px solid var(--borda)',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,.1)',
            maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          {resultados.map((t) => {
            const cor = COR_FONTE[t.fonte];
            return (
              <div
                key={t.id}
                onMouseDown={() => {
                  onSelecionar(t);
                  setBusca(t.nome);
                  setAberto(false);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--borda)',
                  fontSize: '0.88rem',
                }}
                className="taco-opcao"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <strong>{t.nome}</strong>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: cor.bg,
                      color: cor.text,
                    }}
                  >
                    {ROTULO_FONTE[t.fonte]}
                  </span>
                </div>
                <span style={{ color: 'var(--cinza)' }}>
                  {t.kcal} kcal · P {formatarNutri(t.proteinas)}g · C{' '}
                  {formatarNutri(t.carboidratos)}g · G {formatarNutri(t.gorduras)}g
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Painel de nutrição expandível ───────────────────────────────────────────

function PainelNutricao({
  insumo,
  onSalvar,
  onFechar,
}: {
  insumo: Insumo;
  onSalvar: (nutricao: NutricaoInsumo | undefined, pesoGramas: number | undefined) => void;
  onFechar: () => void;
}) {
  const nutIni = insumo.nutricao;
  const [kcal, setKcal] = useState(String(nutIni?.kcal ?? ''));
  const [proteinas, setProteinas] = useState(String(nutIni?.proteinas ?? ''));
  const [carboidratos, setCarboidratos] = useState(String(nutIni?.carboidratos ?? ''));
  const [gorduras, setGorduras] = useState(String(nutIni?.gorduras ?? ''));
  const [fibras, setFibras] = useState(String(nutIni?.fibras ?? ''));
  const [sodio, setSodio] = useState(String(nutIni?.sodio ?? ''));
  const [tacoId, setTacoId] = useState(nutIni?.tacoId ?? '');
  const [pesoGramas, setPesoGramas] = useState(String(insumo.pesoGramas ?? ''));

  const precisaPeso = !PESO_AUTO.has(insumo.unidade);

  const aplicarTaco = (t: ItemTaco) => {
    setTacoId(t.id);
    setKcal(String(t.kcal));
    setProteinas(String(t.proteinas));
    setCarboidratos(String(t.carboidratos));
    setGorduras(String(t.gorduras));
    setFibras(String(t.fibras));
    setSodio(String(t.sodio));
  };

  const salvar = () => {
    const kcalN = parseFloat(kcal.replace(',', '.'));
    const ok = !isNaN(kcalN) && kcalN > 0;
    const nutricao: NutricaoInsumo | undefined = ok
      ? {
          tacoId: tacoId || undefined,
          kcal: kcalN,
          proteinas: parseFloat(proteinas.replace(',', '.')) || 0,
          carboidratos: parseFloat(carboidratos.replace(',', '.')) || 0,
          gorduras: parseFloat(gorduras.replace(',', '.')) || 0,
          fibras: parseFloat(fibras.replace(',', '.')) || 0,
          sodio: parseFloat(sodio.replace(',', '.')) || 0,
        }
      : undefined;
    const pesoN = parseFloat(pesoGramas.replace(',', '.'));
    onSalvar(nutricao, !isNaN(pesoN) && pesoN > 0 ? pesoN : undefined);
  };

  const limpar = () => {
    setKcal(''); setProteinas(''); setCarboidratos('');
    setGorduras(''); setFibras(''); setSodio(''); setTacoId(''); setPesoGramas('');
    onSalvar(undefined, undefined);
  };

  return (
    <div
      style={{
        background: 'var(--verde-claro)',
        borderRadius: 8,
        padding: '14px 16px',
        marginTop: 4,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <label>
          Buscar nas tabelas{' '}
          {(['taco', 'usda', 'ibge'] as const).map((f) => (
            <span
              key={f}
              style={{
                marginLeft: 4,
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 4,
                background: COR_FONTE[f].bg,
                color: COR_FONTE[f].text,
              }}
            >
              {ROTULO_FONTE[f]}
            </span>
          ))}
        </label>
        <TacoBusca onSelecionar={aplicarTaco} />
      </div>

      {precisaPeso && (
        <div style={{ marginBottom: 10 }}>
          <label>
            Peso por 1 {UNIDADES_MEDIDA.find((u) => u.valor === insumo.unidade)?.sigla} (g)
          </label>
          <input
            value={pesoGramas}
            onChange={(e) => setPesoGramas(e.target.value)}
            inputMode="decimal"
            placeholder="Ex.: 60 (para ovo)"
          />
        </div>
      )}

      <label style={{ marginBottom: 8, display: 'block' }}>
        Valores nutricionais por 100 g / 100 ml
      </label>
      <div className="grid cols-3" style={{ gap: 8 }}>
        {[
          { label: 'Energia (kcal)', val: kcal, set: setKcal },
          { label: 'Proteínas (g)', val: proteinas, set: setProteinas },
          { label: 'Carboidratos (g)', val: carboidratos, set: setCarboidratos },
          { label: 'Gorduras (g)', val: gorduras, set: setGorduras },
          { label: 'Fibras (g)', val: fibras, set: setFibras },
          { label: 'Sódio (mg)', val: sodio, set: setSodio },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label style={{ fontSize: '0.8rem' }}>{label}</label>
            <input value={val} onChange={(e) => set(e.target.value)} inputMode="decimal" />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn pequeno" onClick={salvar}>
          Salvar nutrição
        </button>
        <button className="btn pequeno secundario" onClick={limpar}>
          Limpar
        </button>
        <button className="btn pequeno secundario" onClick={onFechar} style={{ marginLeft: 'auto' }}>
          Fechar
        </button>
      </div>
    </div>
  );
}

// ─── Linha da tabela de insumos ───────────────────────────────────────────────

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
  const [expandido, setExpandido] = useState(false);

  const salvarPreco = () => {
    const qtdNum = Number(qtd.replace(',', '.')) || 1;
    const precoNum = Number(preco.replace(',', '.')) || 0;
    onSalvar({
      ...insumo,
      qtdEmbalagem: qtdNum,
      precoEmbalagem: precoNum,
      precoUnitario: calcUnitario(precoNum, qtdNum),
    });
  };

  const salvarNutricao = (nutricao: NutricaoInsumo | undefined, pesoGramas: number | undefined) => {
    onSalvar({ ...insumo, nutricao, pesoGramas });
    setExpandido(false);
  };

  const qtdNum = Number(qtd.replace(',', '.')) || 1;
  const precoNum = Number(preco.replace(',', '.')) || 0;
  const temNutri = !!insumo.nutricao;
  const fonteItem = temNutri && insumo.nutricao?.tacoId
    ? (insumo.nutricao.tacoId.startsWith('usda-')
        ? 'usda'
        : insumo.nutricao.tacoId.startsWith('ibge-')
        ? 'ibge'
        : 'taco') as import('../data/tabelasNutricao').FonteNutricional
    : null;

  return (
    <>
      <tr>
        <td>{insumo.nome}</td>
        <td>{siglaUnidade}</td>
        <td style={{ width: 120 }}>
          <input
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
            onBlur={salvarPreco}
            inputMode="decimal"
            style={{ width: 80 }}
          />
        </td>
        <td style={{ width: 140 }}>
          <input
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            onBlur={salvarPreco}
            inputMode="decimal"
            style={{ width: 110 }}
          />
        </td>
        <td style={{ fontWeight: 600, color: 'var(--verde-escuro)', whiteSpace: 'nowrap' }}>
          R$ {formatarPreco(calcUnitario(precoNum, qtdNum))} / {siglaUnidade}
        </td>
        <td>
          <button
            className={`btn pequeno ${temNutri ? '' : 'secundario'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setExpandido((v) => !v)}
          >
            {temNutri ? (
              <>
                ✓ {insumo.nutricao!.kcal} kcal
                {fonteItem && (
                  <span
                    style={{
                      marginLeft: 5,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: 3,
                      background: COR_FONTE[fonteItem].bg,
                      color: COR_FONTE[fonteItem].text,
                    }}
                  >
                    {ROTULO_FONTE[fonteItem]}
                  </span>
                )}
              </>
            ) : (
              '🔬 Vincular'
            )}
          </button>
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
      {expandido && (
        <tr>
          <td colSpan={8} style={{ padding: '0 12px 12px' }}>
            <PainelNutricao
              insumo={insumo}
              onSalvar={salvarNutricao}
              onFechar={() => setExpandido(false)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

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
        automaticamente. Vincule dados nutricionais (TACO) para calcular os macros das receitas.
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
        <p className="subtitulo" style={{ margin: '0 0 12px' }}>
          Clique em <strong>🔬 Vincular</strong> para associar dados nutricionais da tabela TACO a um
          insumo.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Unidade</th>
                <th>Embalagem</th>
                <th>Preço embalagem</th>
                <th>Preço unitário</th>
                <th>Nutrição</th>
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

      <style>{`
        .taco-opcao:hover { background: var(--verde-claro); }
      `}</style>
    </div>
  );
}
