// Cadastro de restrições/preferências alimentares. As cadastradas aqui somam-se
// às padrão e aparecem nas turmas, no cadastro do cliente e no Receituário.

import { useState } from 'react';
import { useData } from '../state/DataContext';
import { RESTRICOES_DISPONIVEIS } from '../data/seed';

/** "Sem ovo" → "sem_ovo": identificador estável gravado nas turmas e pratos. */
function gerarValor(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function PaginaPreferencias() {
  const {
    preferencias,
    erroPreferencias,
    turmas,
    clientes,
    pratos,
    salvarPreferencia,
    removerPreferencia,
  } = useData();
  const [novo, setNovo] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const todas = [...RESTRICOES_DISPONIVEIS, ...preferencias];

  /** Onde a preferência está marcada — para avisar antes de excluir. */
  const usos = (valor: string) => ({
    turmas: turmas.filter((t) => t.restricoes.includes(valor)).length,
    clientes: clientes.filter((c) => c.restricoes.includes(valor)).length,
    pratos: pratos.filter((p) => p.restricoes.includes(valor)).length,
  });

  const nomeRepetido = (nome: string, ignorar?: string) =>
    todas.some((r) => r.valor !== ignorar && r.nome.trim().toLowerCase() === nome.trim().toLowerCase());

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    const nome = novo.trim();
    const valor = gerarValor(nome);
    setErro(null);
    if (!valor) return;
    if (nomeRepetido(nome) || todas.some((r) => r.valor === valor)) {
      setErro(`"${nome}" já está cadastrada.`);
      return;
    }
    setSalvando(true);
    try {
      await salvarPreferencia({ valor, nome, criadoEm: new Date().toISOString() });
      setNovo('');
    } catch (err) {
      setErro(`Não foi possível salvar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSalvando(false);
    }
  }

  async function renomear(valor: string) {
    const nome = nomeEditado.trim();
    setErro(null);
    if (!nome) return;
    if (nomeRepetido(nome, valor)) {
      setErro(`"${nome}" já está cadastrada.`);
      return;
    }
    const atual = preferencias.find((p) => p.valor === valor);
    try {
      // Só o rótulo muda: turmas e pratos guardam o identificador.
      await salvarPreferencia({ valor, nome, criadoEm: atual?.criadoEm });
      setEditando(null);
    } catch (err) {
      setErro(`Não foi possível salvar: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function remover(valor: string, nome: string) {
    const u = usos(valor);
    const partes = [
      u.turmas && `${u.turmas} turma(s)`,
      u.clientes && `${u.clientes} cliente(s)`,
      u.pratos && `${u.pratos} prato(s)`,
    ].filter(Boolean);
    const aviso = partes.length
      ? `\n\n"${nome}" está marcada em ${partes.join(', ')}. A marcação deixa de aparecer nesses cadastros.`
      : '';
    if (!confirm(`Excluir a preferência "${nome}"?${aviso}`)) return;
    setErro(null);
    try {
      await removerPreferencia(valor);
    } catch (err) {
      setErro(`Não foi possível excluir: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Preferências alimentares</h2>
        <p className="subtitulo">
          Restrições e preferências disponíveis nas turmas, no cadastro do cliente e no Receituário
          (ex.: Sem ovo, Sem carne suína, APLV).
        </p>
      </div>

      {erroPreferencias && (
        <div className="aviso" style={{ marginBottom: 16 }}>
          <strong>As preferências cadastradas não puderam ser carregadas.</strong> Se esta é a
          primeira vez, aplique a migração <code>0019_preferencias_alimentares.sql</code> no SQL
          Editor do Supabase e recarregue a página.
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>{erroPreferencias}</div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Nova preferência</h3>
        <form onSubmit={adicionar} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            placeholder="Ex.: Sem ovo"
            maxLength={60}
            style={{ flex: '1 1 240px' }}
            aria-label="Nome da preferência"
          />
          <button className="btn" type="submit" disabled={salvando || !gerarValor(novo)}>
            + Adicionar
          </button>
        </form>
        {erro && (
          <p className="login-aviso" style={{ marginTop: 8 }}>
            {erro}
          </p>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Cadastradas</h3>
        {preferencias.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>Nenhuma preferência cadastrada ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Em uso</th>
                <th style={{ width: 1 }} />
              </tr>
            </thead>
            <tbody>
              {preferencias.map((p) => {
                const u = usos(p.valor);
                return (
                  <tr key={p.valor}>
                    <td>
                      {editando === p.valor ? (
                        <input
                          value={nomeEditado}
                          onChange={(e) => setNomeEditado(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') renomear(p.valor);
                            if (e.key === 'Escape') setEditando(null);
                          }}
                          maxLength={60}
                          autoFocus
                          aria-label="Novo nome"
                        />
                      ) : (
                        p.nome
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--cinza)' }}>
                      {u.turmas} turma(s) · {u.clientes} cliente(s) · {u.pratos} prato(s)
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {editando === p.valor ? (
                        <>
                          <button className="btn" onClick={() => renomear(p.valor)}>Salvar</button>{' '}
                          <button className="btn secundario" onClick={() => setEditando(null)}>Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn secundario"
                            onClick={() => {
                              setEditando(p.valor);
                              setNomeEditado(p.nome);
                            }}
                          >
                            Renomear
                          </button>{' '}
                          <button className="btn secundario" onClick={() => remover(p.valor, p.nome)}>
                            Excluir
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Padrão do sistema</h3>
        <div className="chips">
          {RESTRICOES_DISPONIVEIS.map((r) => (
            <span key={r.valor} className="chip">{r.nome}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
