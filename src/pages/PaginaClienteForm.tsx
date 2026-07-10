import { useEffect, useMemo, useRef, useState } from 'react';

function lerImagemComoDataURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
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
  type TipoRefeicao,
  type Turma,
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

function refeicaoPadrao(): RefeicaoConfig[] {
  return [{ tipoRefeicaoId: 'almoco', composicao: composicaoPadrao() }];
}

function novaTurma(ordem: number): Turma {
  return {
    id: crypto.randomUUID(),
    clienteId: '',
    nome: '',
    ordem,
    refeicoes: refeicaoPadrao(),
    restricoes: [],
  };
}

export function PaginaClienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    clientes,
    tiposRefeicao,
    salvarCliente,
    turmas,
    salvarTurma,
    removerTurma,
    carregando,
  } = useData();

  const existente = useMemo(
    () => clientes.find((c) => c.id === id),
    [clientes, id],
  );

  const [nome, setNome] = useState(existente?.nome ?? '');
  const [cnpj, setCnpj] = useState(existente?.cnpj ?? '');
  const [responsavel, setResponsavel] = useState(existente?.responsavel ?? '');
  const [registroProfissional, setRegistroProfissional] = useState(existente?.registroProfissional ?? '');
  const [logo, setLogo] = useState(existente?.logo ?? '');
  const [cidade, setCidade] = useState(existente?.cidade ?? '');
  const [uf, setUf] = useState(existente?.uf ?? 'PR');
  const [observacoes, setObservacoes] = useState(existente?.observacoes ?? '');
  const [diasOperacao, setDias] = useState<DiaSemana[]>(
    existente?.diasOperacao ?? [1, 2, 3, 4, 5],
  );
  const [restricoes, setRestricoes] = useState<string[]>(existente?.restricoes ?? []);
  const [refeicoes, setRefeicoes] = useState<RefeicaoConfig[]>(
    existente?.refeicoes ?? refeicaoPadrao(),
  );

  const [usaTurmas, setUsaTurmas] = useState(false);
  const [turmasEdit, setTurmasEdit] = useState<Turma[]>([]);
  const idsOriginais = useRef<Set<string>>(new Set());
  const jaSemeado = useRef(false);

  useEffect(() => {
    if (jaSemeado.current || carregando) return;
    if (existente) {
      const doCliente = turmas
        .filter((t) => t.clienteId === existente.id)
        .sort((a, b) => a.ordem - b.ordem);
      if (doCliente.length > 0) {
        setUsaTurmas(true);
        setTurmasEdit(doCliente);
        idsOriginais.current = new Set(doCliente.map((t) => t.id));
      }
    }
    jaSemeado.current = true;
  }, [carregando, existente, turmas]);

  const toggleDia = (d: DiaSemana) =>
    setDias((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const toggleRestricao = (r: string) =>
    setRestricoes((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const adicionarTurma = () => setTurmasEdit((prev) => [...prev, novaTurma(prev.length)]);
  const atualizarTurma = (idx: number, patch: Partial<Turma>) =>
    setTurmasEdit((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  const removerTurmaEdit = (idx: number) =>
    setTurmasEdit((prev) => prev.filter((_, i) => i !== idx));
  const toggleRestricaoTurma = (idx: number, r: string) =>
    setTurmasEdit((prev) =>
      prev.map((t, i) =>
        i !== idx
          ? t
          : {
              ...t,
              restricoes: t.restricoes.includes(r)
                ? t.restricoes.filter((x) => x !== r)
                : [...t.restricoes, r],
            },
      ),
    );

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setLogo(await lerImagemComoDataURL(file));
    e.target.value = '';
  }

  const salvar = async () => {
    if (!nome.trim()) {
      alert('Informe o nome do cliente.');
      return;
    }
    if (diasOperacao.length === 0) {
      alert('Selecione ao menos um dia de operação.');
      return;
    }
    if (usaTurmas && turmasEdit.some((t) => !t.nome.trim())) {
      alert('Preencha o nome de todas as turmas ou remova as vazias.');
      return;
    }

    const cliente: Cliente = {
      id: existente?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      cnpj: cnpj.trim() || undefined,
      responsavel: responsavel.trim() || undefined,
      registroProfissional: registroProfissional.trim() || undefined,
      logo: logo || undefined,
      cidade: cidade.trim() || undefined,
      uf: uf.trim() || 'PR',
      diasOperacao,
      refeicoes,
      restricoes,
      observacoes: observacoes.trim() || undefined,
      criadoEm: existente?.criadoEm ?? new Date().toISOString(),
    };

    try {
      await salvarCliente(cliente);

      // Gravações sequenciais: o repositório local faz leitura-modificação-escrita
      // sobre um único array no localStorage, então chamadas concorrentes (Promise.all)
      // fariam uma sobrescrever o resultado da outra.
      const idsFinais = new Set(usaTurmas ? turmasEdit.map((t) => t.id) : []);
      const paraRemover = [...idsOriginais.current].filter((tid) => !idsFinais.has(tid));
      for (const tid of paraRemover) {
        await removerTurma(tid);
      }
      if (usaTurmas) {
        for (const [idx, t] of turmasEdit.entries()) {
          await salvarTurma({ ...t, clienteId: cliente.id, nome: t.nome.trim(), ordem: idx });
        }
      }

      navigate('/clientes');
    } catch (err) {
      console.error('[GerenciaFood] Erro ao salvar cliente:', err);
      alert(
        'Não foi possível salvar o cliente. Verifique a conexão com o banco de dados e tente novamente.',
      );
    }
  };

  return (
    <div>
      <h1>{existente ? 'Editar cliente' : 'Novo cliente'}</h1>
      <p className="subtitulo">
        Defina os dados e as particularidades de operação deste cliente.
      </p>

      <div className="card">
        <div style={{ marginBottom: 20 }}>
          <label>Logo do estabelecimento</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            {logo ? (
              <>
                <img
                  src={logo}
                  alt="Logo"
                  style={{ height: 64, objectFit: 'contain', border: '1px solid var(--borda)', borderRadius: 6, padding: 4 }}
                />
                <button className="btn pequeno secundario" type="button" onClick={() => setLogo('')}>
                  Remover
                </button>
              </>
            ) : (
              <label style={{ cursor: 'pointer', border: '2px dashed var(--borda)', borderRadius: 8, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--cinza)' }}>
                <span style={{ fontSize: '1.3rem' }}>🏢</span>
                <span>Selecionar imagem</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
              </label>
            )}
          </div>
          <p className="subtitulo" style={{ marginTop: 6 }}>Usada automaticamente no cabeçalho do relatório.</p>
        </div>

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
            <label>Responsável / Nutricionista</label>
            <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
          </div>
          <div>
            <label>Registro profissional (CRN / CFTA)</label>
            <input
              value={registroProfissional}
              onChange={(e) => setRegistroProfissional(e.target.value)}
              placeholder="Ex.: CRN-8 1234"
            />
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
        <div className="linha">
          <div>
            <strong>Turmas / faixas etárias</strong>
            <p className="subtitulo" style={{ margin: '4px 0 0' }}>
              Ative para clientes como CEIs, que atendem várias turmas (ex.: "Baby 1
              (4-6 meses)", "Infantis"), cada uma com seu próprio cardápio.
            </p>
          </div>
          <span
            className={`chip ${usaTurmas ? 'on' : ''}`}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={() => setUsaTurmas((v) => !v)}
          >
            {usaTurmas ? '✓ ' : ''}Usa turmas
          </span>
        </div>
      </div>

      {usaTurmas ? (
        <div className="card">
          <div className="linha">
            <h3 style={{ margin: 0 }}>Turmas</h3>
            <button className="btn pequeno" onClick={adicionarTurma}>
              + Adicionar turma
            </button>
          </div>

          {turmasEdit.length === 0 && (
            <p className="subtitulo" style={{ marginTop: 8 }}>
              Nenhuma turma ainda. Clique em "+ Adicionar turma".
            </p>
          )}

          {turmasEdit.map((turma, idx) => (
            <div
              key={turma.id}
              style={{
                border: '1px solid var(--borda)',
                borderRadius: 10,
                padding: 14,
                marginTop: 12,
              }}
            >
              <div className="linha">
                <div style={{ flex: 1, marginRight: 12 }}>
                  <label>Nome da turma</label>
                  <input
                    value={turma.nome}
                    onChange={(e) => atualizarTurma(idx, { nome: e.target.value })}
                    placeholder='Ex.: "Baby 1 (4-6 meses)"'
                  />
                </div>
                <button
                  className="btn pequeno perigo"
                  onClick={() => removerTurmaEdit(idx)}
                >
                  Remover turma
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                <label>Restrições / preferências desta turma</label>
                <div className="chips">
                  {RESTRICOES_DISPONIVEIS.map((r) => (
                    <span
                      key={r.valor}
                      className={`chip ${turma.restricoes.includes(r.valor) ? 'on' : ''}`}
                      onClick={() => toggleRestricaoTurma(idx, r.valor)}
                    >
                      {r.nome}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <EditorRefeicoes
                  refeicoes={turma.refeicoes}
                  tiposRefeicao={tiposRefeicao}
                  onChange={(r) => atualizarTurma(idx, { refeicoes: r })}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
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
            <h3 style={{ marginTop: 0 }}>Refeições servidas</h3>
            <p className="subtitulo" style={{ marginTop: 8 }}>
              Cada refeição pode ter sua própria composição (quantas proteínas,
              acompanhamentos etc.).
            </p>
            <EditorRefeicoes
              refeicoes={refeicoes}
              tiposRefeicao={tiposRefeicao}
              onChange={setRefeicoes}
            />
          </div>
        </>
      )}

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

function EditorRefeicoes({
  refeicoes,
  tiposRefeicao,
  onChange,
}: {
  refeicoes: RefeicaoConfig[];
  tiposRefeicao: TipoRefeicao[];
  onChange: (refeicoes: RefeicaoConfig[]) => void;
}) {
  const adicionarRefeicao = () => {
    const usados = new Set(refeicoes.map((r) => r.tipoRefeicaoId));
    const disponivel = tiposRefeicao.find((t) => !usados.has(t.id)) ?? tiposRefeicao[0];
    onChange([
      ...refeicoes,
      { tipoRefeicaoId: disponivel?.id ?? 'almoco', composicao: composicaoPadrao() },
    ]);
  };

  const atualizarRefeicao = (idx: number, patch: Partial<RefeicaoConfig>) =>
    onChange(refeicoes.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const removerRefeicao = (idx: number) => onChange(refeicoes.filter((_, i) => i !== idx));

  const atualizarComposicao = (
    refIdx: number,
    compIdx: number,
    patch: Partial<ComposicaoRefeicao>,
  ) =>
    onChange(
      refeicoes.map((r, i) =>
        i === refIdx
          ? {
              ...r,
              composicao: r.composicao.map((c, j) => (j === compIdx ? { ...c, ...patch } : c)),
            }
          : r,
      ),
    );

  const adicionarComposicao = (refIdx: number) =>
    onChange(
      refeicoes.map((r, i) =>
        i === refIdx
          ? { ...r, composicao: [...r.composicao, { categoria: 'outro' as CategoriaPrato, quantidade: 1 }] }
          : r,
      ),
    );

  const removerComposicao = (refIdx: number, compIdx: number) =>
    onChange(
      refeicoes.map((r, i) =>
        i === refIdx ? { ...r, composicao: r.composicao.filter((_, j) => j !== compIdx) } : r,
      ),
    );

  return (
    <>
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
      <button className="btn pequeno" style={{ marginTop: 12 }} onClick={adicionarRefeicao}>
        + Adicionar refeição
      </button>
    </>
  );
}
