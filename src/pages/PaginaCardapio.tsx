import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import { gerarCardapio, rotuloCategoria } from '../domain/gerador';
import {
  DIAS_SEMANA,
  type Cardapio,
  type Cliente,
  type ItemCardapio,
  type RefeicaoConfig,
  type Turma,
} from '../domain/types';
import { formatarData, segundaFeiraDaSemana } from '../lib/datas';

export function PaginaCardapio() {
  const { id } = useParams();
  const { clientes } = useData();
  const cliente = clientes.find((c) => c.id === id);

  if (!cliente) {
    return (
      <div className="card vazio">
        Cliente não encontrado. <Link to="/clientes">Voltar</Link>
      </div>
    );
  }

  return <MontagemCardapio cliente={cliente} />;
}

/**
 * Monta o cardápio (semanal ou mensal) de um cliente já escolhido, aplicando
 * automaticamente as particularidades cadastradas (dias de operação, refeições,
 * restrições e, quando houver, as turmas/faixas etárias do cliente).
 */
export function MontagemCardapio({ cliente }: { cliente: Cliente }) {
  const { turmas } = useData();

  const turmasDoCliente = useMemo(
    () =>
      turmas
        .filter((t) => t.clienteId === cliente.id)
        .sort((a, b) => a.ordem - b.ordem),
    [turmas, cliente.id],
  );

  return turmasDoCliente.length > 0 ? (
    <CardapioPorTurmas cliente={cliente} turmasDoCliente={turmasDoCliente} />
  ) : (
    <CardapioSimples cliente={cliente} />
  );
}

/** Fluxo original: um cardápio por cliente (sem turmas), semana a semana. */
function CardapioSimples({ cliente }: { cliente: Cliente }) {
  const { pratos, tiposRefeicao, salvarCardapio, listarCardapios } = useData();

  const [semana, setSemana] = useState(segundaFeiraDaSemana());
  const [atual, setAtual] = useState<Cardapio | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [salvos, setSalvos] = useState<Cardapio[]>([]);

  useEffect(() => {
    listarCardapios(cliente.id).then(setSalvos);
  }, [cliente.id, listarCardapios]);

  const diasVisiveis = useMemo(
    () => DIAS_SEMANA.filter((d) => cliente.diasOperacao.includes(d.valor)),
    [cliente],
  );

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

interface SemanaGerada {
  semanaInicio: string;
  porTurma: Record<string, Cardapio>;
  avisos: string[];
}

/** Fluxo por turmas/faixas etárias: várias grades por semana, com visão mensal (4 semanas). */
function CardapioPorTurmas({
  cliente,
  turmasDoCliente,
}: {
  cliente: Cliente;
  turmasDoCliente: Turma[];
}) {
  const { pratos, tiposRefeicao, salvarCardapio, listarCardapios } = useData();

  const [semana, setSemana] = useState(segundaFeiraDaSemana());
  const [semanasGeradas, setSemanasGeradas] = useState<SemanaGerada[]>([]);
  const [salvos, setSalvos] = useState<Cardapio[]>([]);

  useEffect(() => {
    listarCardapios(cliente.id).then(setSalvos);
  }, [cliente.id, listarCardapios]);

  const diasVisiveis = useMemo(
    () => DIAS_SEMANA.filter((d) => cliente.diasOperacao.includes(d.valor)),
    [cliente],
  );

  const somarSemanas = (base: string, quantas: number): string[] => {
    const inicio = new Date(`${base}T00:00:00`);
    return Array.from({ length: quantas }, (_, w) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + w * 7);
      return d.toISOString().slice(0, 10);
    });
  };

  const gerar = (quantasSemanas: number) => {
    const novas = somarSemanas(semana, quantasSemanas).map((semanaInicio, w) => {
      const porTurma: Record<string, Cardapio> = {};
      const avisos: string[] = [];
      turmasDoCliente.forEach((turma, idx) => {
        const { cardapio, avisos: av } = gerarCardapio({
          cliente,
          turma,
          pratos,
          semanaInicio,
          seed: Date.now() + w * 1000 + idx,
        });
        porTurma[turma.id] = cardapio;
        if (av.length > 0) avisos.push(`${turma.nome}: ${av.join(' ')}`);
      });
      return { semanaInicio, porTurma, avisos };
    });
    setSemanasGeradas(novas);
  };

  const salvarTudo = async () => {
    const cardapios = semanasGeradas.flatMap((s) => Object.values(s.porTurma));
    // Gravações sequenciais: o repositório local faz leitura-modificação-escrita
    // sobre um único array no localStorage; chamadas concorrentes se sobrescreveriam.
    for (const c of cardapios) {
      await salvarCardapio(c);
    }
    setSalvos(await listarCardapios(cliente.id));
    alert('Cardápio(s) salvo(s).');
  };

  const salvosTurma = salvos.filter((c) => c.turmaId);
  const semanasSalvas = [...new Set(salvosTurma.map((c) => c.semanaInicio))].sort().reverse();

  const verSemanaSalva = (semanaInicio: string) => {
    const porTurma: Record<string, Cardapio> = {};
    salvosTurma
      .filter((c) => c.semanaInicio === semanaInicio)
      .forEach((c) => {
        if (c.turmaId) porTurma[c.turmaId] = c;
      });
    setSemanasGeradas([{ semanaInicio, porTurma, avisos: [] }]);
    setSemana(semanaInicio);
  };

  return (
    <div>
      <div className="linha no-print">
        <div>
          <h1>Cardápio — {cliente.nome}</h1>
          <p className="subtitulo">
            {turmasDoCliente.length} turma(s) — geração automática por turma, respeitando
            dias de operação e restrições próprias de cada uma.
          </p>
        </div>
        <div className="acoes">
          <Link to="/clientes" className="btn secundario">
            ← Voltar
          </Link>
          {semanasGeradas.length > 0 && (
            <button className="btn secundario" onClick={() => window.print()}>
              🖨️ Imprimir / PDF
            </button>
          )}
        </div>
      </div>

      <div className="card no-print">
        <div className="linha">
          <div>
            <label>Semana inicial (segunda-feira de referência)</label>
            <input type="date" value={semana} onChange={(e) => setSemana(e.target.value)} />
          </div>
          <div className="acoes" style={{ marginTop: 20 }}>
            <button className="btn secundario" onClick={() => gerar(1)}>
              ⚙️ Gerar semana
            </button>
            <button className="btn" onClick={() => gerar(4)}>
              📅 Gerar mês (4 semanas)
            </button>
            {semanasGeradas.length > 0 && (
              <button className="btn secundario" onClick={salvarTudo}>
                Salvar
              </button>
            )}
          </div>
        </div>
      </div>

      {semanasGeradas.map((s) => (
        <div key={s.semanaInicio} className="semana-print-quebra">
          <h2 style={{ margin: '20px 0 8px' }}>Semana de {formatarData(s.semanaInicio)}</h2>
          {s.avisos.length > 0 && (
            <div className="aviso no-print">
              <strong>Atenção:</strong>
              <ul style={{ margin: '6px 0 0' }}>
                {s.avisos.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {turmasDoCliente.map((turma) => {
            const cardapio = s.porTurma[turma.id];
            if (!cardapio) return null;
            return (
              <div key={turma.id} className="card">
                <h3 style={{ marginTop: 0 }}>{turma.nome}</h3>
                <GradeTurma
                  cardapio={cardapio}
                  refeicoes={turma.refeicoes}
                  diasVisiveis={diasVisiveis}
                  nomeTipo={(tipoId) =>
                    tiposRefeicao.find((t) => t.id === tipoId)?.nome ?? tipoId
                  }
                />
              </div>
            );
          })}
        </div>
      ))}

      {semanasSalvas.length > 0 && (
        <div className="card no-print">
          <h3 style={{ marginTop: 0 }}>Semanas salvas</h3>
          <table>
            <thead>
              <tr>
                <th>Semana</th>
                <th>Turmas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {semanasSalvas.map((semanaInicio) => (
                <tr key={semanaInicio}>
                  <td>{formatarData(semanaInicio)}</td>
                  <td>
                    {salvosTurma.filter((c) => c.semanaInicio === semanaInicio).length}
                  </td>
                  <td>
                    <button
                      className="btn pequeno secundario"
                      onClick={() => verSemanaSalva(semanaInicio)}
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

function GradeTurma({
  cardapio,
  refeicoes,
  diasVisiveis,
  nomeTipo,
}: {
  cardapio: Cardapio;
  refeicoes: RefeicaoConfig[];
  diasVisiveis: { valor: number; nome: string; curto: string }[];
  nomeTipo: (tipoId: string) => string;
}) {
  const celula = (dia: number, tipoId: string, categoria: string) =>
    cardapio.itens
      .filter((i: ItemCardapio) => i.dia === dia && i.tipoRefeicaoId === tipoId && i.categoria === categoria)
      .map((i) => i.pratoNome);

  return (
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
          {refeicoes.map((ref) =>
            ref.composicao.map((comp, ci) => (
              <tr key={`${ref.tipoRefeicaoId}-${comp.categoria}-${ci}`}>
                <td>
                  {ci === 0 && <strong>{nomeTipo(ref.tipoRefeicaoId)}</strong>}
                  <div className="cat">{rotuloCategoria(comp.categoria)}</div>
                </td>
                {diasVisiveis.map((d) => (
                  <td key={d.valor}>
                    {celula(d.valor, ref.tipoRefeicaoId, comp.categoria).join(', ') || '—'}
                  </td>
                ))}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

