import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import { rotuloCategoria } from '../domain/gerador';
import {
  UNIDADES_MEDIDA,
  type Insumo,
  type ItemReceita,
  type Receita,
  type UnidadeMedida,
} from '../domain/types';
import { RESTRICOES_DISPONIVEIS } from '../data/seed';
import { formatarMoeda } from '../lib/moeda';

function receitaVazia(): Receita {
  return { ingredientes: [], insumosUsados: [], modoPreparo: '', rendimento: '', tempoPreparo: '' };
}

/** Extrai o primeiro número inteiro de um texto (ex.: "10 porções" → 10). */
function extrairNumero(texto: string): number | null {
  const m = texto.match(/\d+/);
  return m ? Number(m[0]) : null;
}

/** Converte quantidade + unidade para gramas (null quando não calculável). */
function calcGramas(quantidade: number, unidade: UnidadeMedida, pesoGramas?: number): number | null {
  switch (unidade) {
    case 'kg': return quantidade * 1000;
    case 'g':  return quantidade;
    case 'l':  return quantidade * 1000;
    case 'ml': return quantidade;
    case 'un': return pesoGramas != null ? quantidade * pesoGramas : null;
    case 'dz': return pesoGramas != null ? quantidade * 12 * pesoGramas : null;
    case 'pct': return pesoGramas != null ? quantidade * pesoGramas : null;
  }
}

interface TotalNutricional {
  kcal: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  fibras: number;
  sodio: number;
  comDados: number;
  semDados: number;
}

function calcNutricao(itens: ItemReceita[], insumos: Insumo[]): TotalNutricional {
  const total: TotalNutricional = {
    kcal: 0, proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0, sodio: 0,
    comDados: 0, semDados: 0,
  };
  for (const item of itens) {
    const ins = insumos.find((i) => i.id === item.insumoId);
    if (!ins || !ins.nutricao) { total.semDados++; continue; }
    const gramas = calcGramas(item.quantidade, ins.unidade, ins.pesoGramas);
    if (gramas === null) { total.semDados++; continue; }
    const fator = gramas / 100;
    total.kcal += ins.nutricao.kcal * fator;
    total.proteinas += ins.nutricao.proteinas * fator;
    total.carboidratos += ins.nutricao.carboidratos * fator;
    total.gorduras += ins.nutricao.gorduras * fator;
    total.fibras += ins.nutricao.fibras * fator;
    total.sodio += ins.nutricao.sodio * fator;
    total.comDados++;
  }
  return total;
}

export function PaginaReceita() {
  const { id } = useParams();
  const { pratos, insumos, salvarPrato } = useData();
  const prato = pratos.find((p) => p.id === id);

  const [ingredientesTexto, setIngredientesTexto] = useState('');
  const [modoPreparo, setModoPreparo] = useState('');
  const [rendimento, setRendimento] = useState('');
  const [tempoPreparo, setTempoPreparo] = useState('');
  const [insumosUsados, setInsumosUsados] = useState<ItemReceita[]>([]);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    const r = prato?.receita ?? receitaVazia();
    setIngredientesTexto(r.ingredientes.join('\n'));
    setModoPreparo(r.modoPreparo);
    setRendimento(r.rendimento ?? '');
    setTempoPreparo(r.tempoPreparo ?? '');
    setInsumosUsados(r.insumosUsados ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prato?.id]);

  if (!prato) {
    return (
      <div className="card vazio">
        Prato não encontrado. <Link to="/pratos">Voltar</Link>
      </div>
    );
  }

  const ingredientesLista = ingredientesTexto
    .split('\n')
    .map((i) => i.trim())
    .filter(Boolean);

  const passos = modoPreparo
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const linhasCusto = insumosUsados
    .map((item) => ({ item, insumo: insumos.find((i) => i.id === item.insumoId) }))
    .filter((l) => l.insumo);

  const custoTotal = linhasCusto.reduce(
    (soma, l) => soma + l.item.quantidade * (l.insumo?.precoUnitario ?? 0),
    0,
  );
  const porcoes = extrairNumero(rendimento ?? '');
  const custoPorPorcao = porcoes && porcoes > 0 ? custoTotal / porcoes : null;

  const nutricaoTotal = calcNutricao(insumosUsados, insumos);

  const salvarReceita = async () => {
    const receita: Receita = {
      ingredientes: ingredientesLista,
      insumosUsados: insumosUsados.filter((i) => i.insumoId),
      modoPreparo,
      rendimento: rendimento.trim() || undefined,
      tempoPreparo: tempoPreparo.trim() || undefined,
    };
    await salvarPrato({ ...prato, receita });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };

  const adicionarLinhaCusto = () => {
    if (insumos.length === 0) return;
    setInsumosUsados((p) => [...p, { insumoId: insumos[0].id, quantidade: 0 }]);
  };

  const atualizarLinhaCusto = (idx: number, campo: keyof ItemReceita, valor: string) => {
    setInsumosUsados((p) =>
      p.map((it, i) =>
        i !== idx
          ? it
          : {
              ...it,
              [campo]: campo === 'quantidade' ? Number(valor.replace(',', '.')) || 0 : valor,
            },
      ),
    );
  };

  const removerLinhaCusto = (idx: number) => {
    setInsumosUsados((p) => p.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="linha no-print">
        <div>
          <h1>Receita</h1>
          <p className="subtitulo">
            {prato.nome} — {rotuloCategoria(prato.categoria)}
          </p>
        </div>
        <div className="acoes">
          <Link to="/pratos" className="btn secundario">
            ← Voltar
          </Link>
          <button className="btn" onClick={() => window.print()}>
            🖨️ Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="card no-print">
        <h3 style={{ marginTop: 0 }}>Editar ficha técnica</h3>
        <div className="grid cols-2">
          <div>
            <label>Rendimento</label>
            <input
              value={rendimento}
              onChange={(e) => setRendimento(e.target.value)}
              placeholder="Ex.: 10 porções"
            />
          </div>
          <div>
            <label>Tempo de preparo</label>
            <input
              value={tempoPreparo}
              onChange={(e) => setTempoPreparo(e.target.value)}
              placeholder="Ex.: 40 min"
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Ingredientes (um por linha)</label>
          <textarea
            rows={6}
            value={ingredientesTexto}
            onChange={(e) => setIngredientesTexto(e.target.value)}
            placeholder={'Ex.:\n500g de peito de frango\n1 cebola picada\n2 dentes de alho'}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Modo de preparo (um passo por linha)</label>
          <textarea
            rows={8}
            value={modoPreparo}
            onChange={(e) => setModoPreparo(e.target.value)}
            placeholder={'Ex.:\nTempere o frango com sal e alho.\nDoure a cebola em fogo médio.\nAcrescente o frango e cozinhe por 20 min.'}
          />
        </div>
        <button className="btn" style={{ marginTop: 14 }} onClick={salvarReceita}>
          {salvo ? '✓ Receita salva' : 'Salvar receita'}
        </button>
      </div>

      <div className="card no-print">
        <h3 style={{ marginTop: 0 }}>Custo da receita</h3>
        {insumos.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>
            Nenhum insumo cadastrado ainda. <Link to="/insumos">Cadastre insumos</Link> para
            vincular quantidades e calcular o custo automaticamente.
          </p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th style={{ width: 140 }}>Quantidade</th>
                  <th style={{ width: 130 }}>Preço unitário</th>
                  <th style={{ width: 110 }}>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {insumosUsados.map((item, idx) => {
                  const insumo = insumos.find((i) => i.id === item.insumoId);
                  const sigla =
                    UNIDADES_MEDIDA.find((u) => u.valor === insumo?.unidade)?.sigla ?? '';
                  const subtotal = item.quantidade * (insumo?.precoUnitario ?? 0);
                  return (
                    <tr key={idx}>
                      <td>
                        <select
                          value={item.insumoId}
                          onChange={(e) => atualizarLinhaCusto(idx, 'insumoId', e.target.value)}
                        >
                          {insumos.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.nome}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          key={idx}
                          defaultValue={item.quantidade || ''}
                          onChange={(e) => atualizarLinhaCusto(idx, 'quantidade', e.target.value)}
                          inputMode="decimal"
                          placeholder={`Qtd. em ${sigla}`}
                        />
                      </td>
                      <td>{insumo ? formatarMoeda(insumo.precoUnitario) : '—'}</td>
                      <td>{formatarMoeda(subtotal)}</td>
                      <td>
                        <button
                          className="btn pequeno perigo"
                          onClick={() => removerLinhaCusto(idx)}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button className="btn secundario" style={{ marginTop: 12 }} onClick={adicionarLinhaCusto}>
              + Adicionar insumo à receita
            </button>
          </>
        )}
      </div>

      <div className="card">
        <div className="grid cols-2">
          <div>
            <h2 style={{ margin: '0 0 4px' }}>{prato.nome}</h2>
            <div style={{ color: 'var(--cinza)' }}>{rotuloCategoria(prato.categoria)}</div>
            {prato.restricoes.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {prato.restricoes.map((r) => (
                  <span key={r} className="tag">
                    {RESTRICOES_DISPONIVEIS.find((x) => x.valor === r)?.nome ?? r}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', color: 'var(--cinza)' }}>
            {rendimento && <div>Rendimento: {rendimento}</div>}
            {tempoPreparo && <div>Tempo de preparo: {tempoPreparo}</div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="linha">
          <h3 style={{ margin: 0 }}>Custo estimado</h3>
        </div>
        {linhasCusto.length === 0 ? (
          <p className="subtitulo" style={{ margin: '12px 0 0' }}>
            Custo não calculado — nenhum insumo vinculado a esta receita.
          </p>
        ) : (
          <>
            <table style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Quantidade</th>
                  <th>Preço unitário</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {linhasCusto.map(({ item, insumo }, idx) => (
                  <tr key={idx}>
                    <td>{insumo?.nome}</td>
                    <td>
                      {item.quantidade}{' '}
                      {UNIDADES_MEDIDA.find((u) => u.valor === insumo?.unidade)?.sigla}
                    </td>
                    <td>{formatarMoeda(insumo?.precoUnitario ?? 0)}</td>
                    <td>{formatarMoeda(item.quantidade * (insumo?.precoUnitario ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid cols-2" style={{ marginTop: 16 }}>
              <Indicador titulo="Custo total da receita" valor={formatarMoeda(custoTotal)} destaque />
              {custoPorPorcao !== null && (
                <Indicador titulo={`Custo por porção (${porcoes})`} valor={formatarMoeda(custoPorPorcao)} />
              )}
            </div>
          </>
        )}
      </div>

      {nutricaoTotal.comDados > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Informação nutricional</h3>
          {nutricaoTotal.semDados > 0 && (
            <p className="subtitulo" style={{ margin: '0 0 12px' }}>
              ⚠ {nutricaoTotal.semDados} insumo(s) sem dados nutricionais — valores parciais.
            </p>
          )}
          <div className="grid cols-3" style={{ gap: 8 }}>
            <NutriCard titulo="Energia" valor={`${Math.round(nutricaoTotal.kcal)} kcal`} destaque />
            <NutriCard titulo="Proteínas" valor={`${nutricaoTotal.proteinas.toFixed(1)} g`} />
            <NutriCard titulo="Carboidratos" valor={`${nutricaoTotal.carboidratos.toFixed(1)} g`} />
            <NutriCard titulo="Gorduras" valor={`${nutricaoTotal.gorduras.toFixed(1)} g`} />
            <NutriCard titulo="Fibras" valor={`${nutricaoTotal.fibras.toFixed(1)} g`} />
            <NutriCard titulo="Sódio" valor={`${Math.round(nutricaoTotal.sodio)} mg`} />
          </div>
          {porcoes && porcoes > 0 && (
            <>
              <h4 style={{ margin: '16px 0 8px', color: 'var(--verde-escuro)' }}>
                Por porção ({porcoes})
              </h4>
              <div className="grid cols-3" style={{ gap: 8 }}>
                <NutriCard titulo="Energia" valor={`${Math.round(nutricaoTotal.kcal / porcoes)} kcal`} destaque />
                <NutriCard titulo="Proteínas" valor={`${(nutricaoTotal.proteinas / porcoes).toFixed(1)} g`} />
                <NutriCard titulo="Carboidratos" valor={`${(nutricaoTotal.carboidratos / porcoes).toFixed(1)} g`} />
                <NutriCard titulo="Gorduras" valor={`${(nutricaoTotal.gorduras / porcoes).toFixed(1)} g`} />
                <NutriCard titulo="Fibras" valor={`${(nutricaoTotal.fibras / porcoes).toFixed(1)} g`} />
                <NutriCard titulo="Sódio" valor={`${Math.round(nutricaoTotal.sodio / porcoes)} mg`} />
              </div>
            </>
          )}
          <p style={{ color: 'var(--cinza)', fontSize: '0.78rem', margin: '12px 0 0' }}>
            Referência: TACO, 4ª edição (NEPA/UNICAMP)
          </p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Ingredientes</h3>
        {ingredientesLista.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>
            Nenhum ingrediente cadastrado.
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {ingredientesLista.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Modo de preparo</h3>
        {passos.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>
            Nenhum passo cadastrado.
          </p>
        ) : (
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {passos.map((s, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                {s}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function Indicador({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: boolean }) {
  return (
    <div
      style={{
        border: '1px solid var(--borda)',
        borderRadius: 10,
        padding: 16,
        textAlign: 'center',
        background: destaque ? 'var(--verde-claro)' : 'var(--branco)',
      }}
    >
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--verde-escuro)' }}>
        {valor}
      </div>
      <div style={{ color: 'var(--cinza)', fontSize: '0.85rem' }}>{titulo}</div>
    </div>
  );
}

function NutriCard({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: boolean }) {
  return (
    <div
      style={{
        border: '1px solid var(--borda)',
        borderRadius: 8,
        padding: '10px 12px',
        textAlign: 'center',
        background: destaque ? 'var(--verde-claro)' : 'var(--branco)',
      }}
    >
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--verde-escuro)' }}>
        {valor}
      </div>
      <div style={{ color: 'var(--cinza)', fontSize: '0.78rem' }}>{titulo}</div>
    </div>
  );
}
