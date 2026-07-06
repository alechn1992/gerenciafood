import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import {
  CATEGORIAS_PRATO,
  DIAS_SEMANA,
  type CategoriaPrato,
  type Cliente,
  type ComposicaoRefeicao,
  type DiaSemana,
  type RefeicaoConfig,
} from '../domain/types';
import { RESTRICOES_DISPONIVEIS } from '../data/seed';

function composicaoPadrao(): ComposicaoRefeicao[] {
  return [
    { categoria: 'proteina', quantidade: 1 },
    { categoria: 'acompanhamento', quantidade: 2 },
    { categoria: 'salada', quantidade: 1 },
    { categoria: 'sobremesa', quantidade: 1 },
  ];
}

export function PaginaClienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clientes, tiposRefeicao, salvarCliente } = useData();

  const existente = useMemo(
    () => clientes.find((c) => c.id === id),
    [clientes, id],
  );

  const [nome, setNome] = useState(existente?.nome ?? '');
  const [cnpj, setCnpj] = useState(existente?.cnpj ?? '');
  const [responsavel, setResponsavel] = useState(existente?.responsavel ?? '');
  const [cidade, setCidade] = useState(existente?.cidade ?? '');
  const [uf, setUf] = useState(existente?.uf ?? 'PR');
  const [observacoes, setObservacoes] = useState(existente?.observacoes ?? '');
  const [diasOperacao, setDias] = useState<DiaSemana[]>(
    existente?.diasOperacao ?? [1, 2, 3, 4, 5],
  );
  const [restricoes, setRestricoes] = useState<string[]>(existente?.restricoes ?? []);
  const [refeicoes, setRefeicoes] = useState<RefeicaoConfig[]>(
    existente?.refeicoes ?? [{ tipoRefeicaoId: 'almoco', composicao: composicaoPadrao() }],
  );

  const toggleDia = (d: DiaSemana) =>
    setDias((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const toggleRestricao = (r: string) =>
    setRestricoes((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const adicionarRefeicao = () => {
    const usados = new Set(refeicoes.map((r) => r.tipoRefeicaoId));
    const disponivel = tiposRefeicao.find((t) => !usados.has(t.id)) ?? tiposRefeicao[0];
    setRefeicoes((prev) => [
      ...prev,
      { tipoRefeicaoId: disponivel?.id ?? 'almoco', composicao: composicaoPadrao() },
    ]);
  };

  const atualizarRefeicao = (idx: number, patch: Partial<RefeicaoConfig>) =>
    setRefeicoes((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const removerRefeicao = (idx: number) =>
    setRefeicoes((prev) => prev.filter((_, i) => i !== idx));

  const atualizarComposicao = (
    refIdx: number,
    compIdx: number,
    patch: Partial<ComposicaoRefeicao>,
  ) =>
    setRefeicoes((prev) =>
      prev.map((r, i) =>
        i === refIdx
          ? {
              ...r,
              composicao: r.composicao.map((c, j) => (j === compIdx ? { ...c, ...patch } : c)),
            }
          : r,
      ),
    );

  const adicionarComposicao = (refIdx: number) =>
    setRefeicoes((prev) =>
      prev.map((r, i) =>
        i === refIdx
          ? { ...r, composicao: [...r.composicao, { categoria: 'outro' as CategoriaPrato, quantidade: 1 }] }
          : r,
      ),
    );

  const removerComposicao = (refIdx: number, compIdx: number) =>
    setRefeicoes((prev) =>
      prev.map((r, i) =>
        i === refIdx ? { ...r, composicao: r.composicao.filter((_, j) => j !== compIdx) } : r,
      ),
    );

  const salvar = async () => {
    if (!nome.trim()) {
      alert('Informe o nome do cliente.');
      return;
    }
    if (diasOperacao.length === 0) {
      alert('Selecione ao menos um dia de operação.');
      return;
    }
    const cliente: Cliente = {
      id: existente?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      cnpj: cnpj.trim() || undefined,
      responsavel: responsavel.trim() || undefined,
      cidade: cidade.trim() || undefined,
      uf: uf.trim() || 'PR',
      diasOperacao,
      refeicoes,
      restricoes,
      observacoes: observacoes.trim() || undefined,
      criadoEm: existente?.criadoEm ?? new Date().toISOString(),
    };
    await salvarCliente(cliente);
    navigate('/clientes');
  };

  return (
    <div>
      <h1>{existente ? 'Editar cliente' : 'Novo cliente'}</h1>
      <p className="subtitulo">
        Defina os dados e as particularidades de operação deste cliente.
      </p>

      <div className="card">
        <div className="grid cols-2">
          <div>
            <label>Nome / Razão social *</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <label>CNPJ</label>
            <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
          </div>
          <div>
            <label>Responsável técnico</label>
            <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
          </div>
          <div className="grid cols-2">
            <div>
              <label>Cidade</label>
              <input value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </div>
            <div>
              <label>UF</label>
              <input value={uf} maxLength={2} onChange={(e) => setUf(e.target.value.toUpperCase())} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Dias de operação</h3>
        <p className="subtitulo" style={{ marginBottom: 12 }}>
          Marque os dias em que o cliente opera. Inclua sábado/domingo se trabalhar
          nos finais de semana.
        </p>
        <div className="chips">
          {DIAS_SEMANA.map((d) => (
            <span
              key={d.valor}
              className={`chip ${diasOperacao.includes(d.valor) ? 'on' : ''}`}
              onClick={() => toggleDia(d.valor)}
            >
              {d.nome}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 12 }} className="acoes">
          <button className="btn pequeno secundario" onClick={() => setDias([1, 2, 3, 4, 5])}>
            Seg a Sex
          </button>
          <button
            className="btn pequeno secundario"
            onClick={() => setDias([0, 1, 2, 3, 4, 5, 6])}
          >
            Todos os dias
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Restrições / preferências alimentares</h3>
        <p className="subtitulo" style={{ marginBottom: 12 }}>
          Aplicadas a todas as refeições ao gerar o cardápio.
        </p>
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

      <div className="card">
        <div className="linha">
          <h3 style={{ margin: 0 }}>Refeições servidas</h3>
          <button className="btn pequeno" onClick={adicionarRefeicao}>
            + Adicionar refeição
          </button>
        </div>
        <p className="subtitulo" style={{ marginTop: 8 }}>
          Cada refeição pode ter sua própria composição (quantas proteínas,
          acompanhamentos etc.).
        </p>

        {refeicoes.map((ref, refIdx) => (
          <div
            key={refIdx}
            style={{
              border: '1px solid var(--borda)',
              borderRadius: 10,
              padding: 14,
              marginTop: 12,
            }}
          >
            <div className="linha">
              <div style={{ minWidth: 220 }}>
                <label>Tipo de refeição</label>
                <select
                  value={ref.tipoRefeicaoId}
                  onChange={(e) => atualizarRefeicao(refIdx, { tipoRefeicaoId: e.target.value })}
                >
                  {tiposRefeicao.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn pequeno perigo"
                onClick={() => removerRefeicao(refIdx)}
                disabled={refeicoes.length === 1}
              >
                Remover refeição
              </button>
            </div>

            <table style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th style={{ width: 120 }}>Quantidade</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ref.composicao.map((comp, compIdx) => (
                  <tr key={compIdx}>
                    <td>
                      <select
                        value={comp.categoria}
                        onChange={(e) =>
                          atualizarComposicao(refIdx, compIdx, {
                            categoria: e.target.value as CategoriaPrato,
                          })
                        }
                      >
                        {CATEGORIAS_PRATO.map((cat) => (
                          <option key={cat.valor} value={cat.valor}>
                            {cat.nome}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={comp.quantidade}
                        onChange={(e) =>
                          atualizarComposicao(refIdx, compIdx, {
                            quantidade: Math.max(1, Number(e.target.value)),
                          })
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="btn pequeno perigo"
                        onClick={() => removerComposicao(refIdx, compIdx)}
                        disabled={ref.composicao.length === 1}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="btn pequeno secundario"
              style={{ marginTop: 8 }}
              onClick={() => adicionarComposicao(refIdx)}
            >
              + Categoria
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <label>Observações</label>
        <textarea
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </div>

      <div className="acoes">
        <button className="btn" onClick={salvar}>
          Salvar cliente
        </button>
        <button className="btn secundario" onClick={() => navigate('/clientes')}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
