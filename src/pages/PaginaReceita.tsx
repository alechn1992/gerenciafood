import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import { rotuloCategoria } from '../domain/gerador';
import type { Receita } from '../domain/types';
import { RESTRICOES_DISPONIVEIS } from '../data/seed';

function receitaVazia(): Receita {
  return { ingredientes: [], modoPreparo: '', rendimento: '', tempoPreparo: '' };
}

export function PaginaReceita() {
  const { id } = useParams();
  const { pratos, salvarPrato } = useData();
  const prato = pratos.find((p) => p.id === id);

  const [ingredientesTexto, setIngredientesTexto] = useState('');
  const [modoPreparo, setModoPreparo] = useState('');
  const [rendimento, setRendimento] = useState('');
  const [tempoPreparo, setTempoPreparo] = useState('');
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    const r = prato?.receita ?? receitaVazia();
    setIngredientesTexto(r.ingredientes.join('\n'));
    setModoPreparo(r.modoPreparo);
    setRendimento(r.rendimento ?? '');
    setTempoPreparo(r.tempoPreparo ?? '');
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

  const salvarReceita = async () => {
    const receita: Receita = {
      ingredientes: ingredientesLista,
      modoPreparo,
      rendimento: rendimento.trim() || undefined,
      tempoPreparo: tempoPreparo.trim() || undefined,
    };
    await salvarPrato({ ...prato, receita });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
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
