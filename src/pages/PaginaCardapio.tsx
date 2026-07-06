import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import { gerarCardapio, rotuloCategoria } from '../domain/gerador';
import { DIAS_SEMANA, type Cardapio, type ItemCardapio } from '../domain/types';
import { formatarData, segundaFeiraDaSemana } from '../lib/datas';

export function PaginaCardapio() {
  const { id } = useParams();
  const { clientes, pratos, tiposRefeicao, salvarCardapio, listarCardapios } = useData();
  const cliente = clientes.find((c) => c.id === id);

  const [semana, setSemana] = useState(segundaFeiraDaSemana());
  const [atual, setAtual] = useState<Cardapio | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [salvos, setSalvos] = useState<Cardapio[]>([]);

  useEffect(() => {
    if (id) listarCardapios(id).then(setSalvos);
  }, [id, listarCardapios]);

  const diasVisiveis = useMemo(
    () => DIAS_SEMANA.filter((d) => cliente?.diasOperacao.includes(d.valor)),
    [cliente],
  );

  if (!cliente) {
    return (
      <div className="card vazio">
        Cliente não encontrado. <Link to="/clientes">Voltar</Link>
      </div>
    );
  }

  const gerar = () => {
    const { cardapio, avisos } = gerarCardapio({
      cliente,
      pratos,
      semanaInicio: semana,
      seed: Date.now(),
    });
    setAtual(cardapio);
    setAvisos(avisos);
  };

  const salvar = async () => {
    if (!atual) return;
    await salvarCardapio(atual);
    setSalvos(await listarCardapios(cliente.id));
    alert('Cardápio salvo.');
  };

  const nomeTipo = (tipoId: string) =>
    tiposRefeicao.find((t) => t.id === tipoId)?.nome ?? tipoId;

  const celula = (itens: ItemCardapio[], dia: number, tipoId: string, categoria: string) =>
    itens
      .filter((i) => i.dia === dia && i.tipoRefeicaoId === tipoId && i.categoria === categoria)
      .map((i) => i.pratoNome);

  const renderGrade = (c: Cardapio) => (
    <div className="cardapio-grid">
      <table>
        <thead>
          <tr>
            <th>Refeição</th>
            {diasVisiveis.map((d) => (
              <th key={d.valor}>{d.nome}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cliente.refeicoes.map((ref) =>
            ref.composicao.map((comp, ci) => (
              <tr key={`${ref.tipoRefeicaoId}-${comp.categoria}-${ci}`}>
                <td>
                  {ci === 0 && <strong>{nomeTipo(ref.tipoRefeicaoId)}</strong>}
                  <div className="cat">{rotuloCategoria(comp.categoria)}</div>
                </td>
                {diasVisiveis.map((d) => (
                  <td key={d.valor}>
                    {celula(c.itens, d.valor, ref.tipoRefeicaoId, comp.categoria).join(', ') ||
                      '—'}
                  </td>
                ))}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="linha">
        <div>
          <h1>Cardápio — {cliente.nome}</h1>
          <p className="subtitulo">
            Geração automática respeitando dias de operação, refeições e restrições.
          </p>
        </div>
        <Link to="/clientes" className="btn secundario">
          ← Voltar
        </Link>
      </div>

      <div className="card">
        <div className="linha">
          <div>
            <label>Semana (segunda-feira de referência)</label>
            <input type="date" value={semana} onChange={(e) => setSemana(e.target.value)} />
          </div>
          <div className="acoes" style={{ marginTop: 20 }}>
            <button className="btn" onClick={gerar}>
              ⚙️ Gerar cardápio
            </button>
            {atual && (
              <button className="btn secundario" onClick={salvar}>
                Salvar
              </button>
            )}
          </div>
        </div>
      </div>

      {avisos.length > 0 && (
        <div className="aviso">
          <strong>Atenção:</strong>
          <ul style={{ margin: '6px 0 0' }}>
            {avisos.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {atual && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            Semana de {formatarData(atual.semanaInicio)}
          </h3>
          {renderGrade(atual)}
        </div>
      )}

      {salvos.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Cardápios salvos</h3>
          <table>
            <thead>
              <tr>
                <th>Semana</th>
                <th>Gerado em</th>
                <th>Itens</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {salvos.map((c) => (
                <tr key={c.id}>
                  <td>{formatarData(c.semanaInicio)}</td>
                  <td>{new Date(c.geradoEm).toLocaleString('pt-BR')}</td>
                  <td>{c.itens.length}</td>
                  <td>
                    <button
                      className="btn pequeno secundario"
                      onClick={() => {
                        setAtual(c);
                        setAvisos([]);
                        setSemana(c.semanaInicio);
                      }}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
