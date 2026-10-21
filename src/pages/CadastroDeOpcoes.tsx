// Tela de cadastro de uma lista simples de opções (nome + identificador),
// somadas às padrão do sistema. Usada por Preferências alimentares e por
// Categorias de prato.

import { useState } from 'react';

export interface Opcao {
  valor: string;
  nome: string;
  criadoEm?: string;
}

/** "Sem ovo" → "sem_ovo": identificador estável gravado nos cadastros. */
export function gerarValor(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

interface Props {
  titulo: string;
  descricao: string;
  /** Ex.: "Ex.: Sem ovo". */
  placeholder: string;
  /** Rótulo da coisa cadastrada, no singular (ex.: "preferência"). */
  rotulo: string;
  padrao: Opcao[];
  itens: Opcao[];
  erroCarregar: string | null;
  /** Arquivo da migração que cria a tabela, para a mensagem de erro. */
  migracao: string;
  /** Onde a opção está em uso, já descrito (ex.: "3 prato(s)"). */
  usos: (valor: string) => string[];
  /** Quando true, não deixa excluir enquanto estiver em uso. */
  bloquearExclusaoEmUso?: boolean;
  salvar: (o: Opcao) => Promise<void>;
  remover: (valor: string) => Promise<void>;
}

export function CadastroDeOpcoes({
  titulo,
  descricao,
  placeholder,
  rotulo,
  padrao,
  itens,
  erroCarregar,
  migracao,
  usos,
  bloquearExclusaoEmUso,
  salvar,
  remover,
}: Props) {
  const [novo, setNovo] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const todas = [...padrao, ...itens];
  const mensagem = (err: unknown) => (err instanceof Error ? err.message : String(err));

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
      await salvar({ valor, nome, criadoEm: new Date().toISOString() });
      setNovo('');
    } catch (err) {
      setErro(`Não foi possível salvar: ${mensagem(err)}`);
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
    const atual = itens.find((p) => p.valor === valor);
    try {
      // Só o rótulo muda: os cadastros guardam o identificador.
      await salvar({ valor, nome, criadoEm: atual?.criadoEm });
      setEditando(null);
    } catch (err) {
      setErro(`Não foi possível salvar: ${mensagem(err)}`);
    }
  }

  async function excluir(valor: string, nome: string) {
    const emUso = usos(valor);
    if (emUso.length > 0 && bloquearExclusaoEmUso) {
      alert(`"${nome}" está em uso em ${emUso.join(', ')}. Troque esses cadastros para outra ${rotulo} antes de excluir.`);
      return;
    }
    const aviso = emUso.length
      ? `\n\n"${nome}" está marcada em ${emUso.join(', ')}. A marcação deixa de aparecer nesses cadastros.`
      : '';
    if (!confirm(`Excluir a ${rotulo} "${nome}"?${aviso}`)) return;
    setErro(null);
    try {
      await remover(valor);
    } catch (err) {
      setErro(`Não foi possível excluir: ${mensagem(err)}`);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>{titulo}</h2>
        <p className="subtitulo">{descricao}</p>
      </div>

      {erroCarregar && (
        <div className="aviso" style={{ marginBottom: 16 }}>
          <strong>As opções cadastradas não puderam ser carregadas.</strong> Se esta é a primeira vez,
          aplique a migração <code>{migracao}</code> no SQL Editor do Supabase e recarregue a página.
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>{erroCarregar}</div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Nova {rotulo}</h3>
        <form onSubmit={adicionar} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            placeholder={placeholder}
            maxLength={60}
            style={{ flex: '1 1 240px' }}
            aria-label={`Nome da ${rotulo}`}
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
        {itens.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>Nenhuma {rotulo} cadastrada ainda.</p>
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
              {itens.map((p) => {
                const emUso = usos(p.valor);
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
                      {emUso.length > 0 ? emUso.join(' · ') : '—'}
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
                          <button className="btn secundario" onClick={() => excluir(p.valor, p.nome)}>
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
          {padrao.map((r) => (
            <span key={r.valor} className="chip">{r.nome}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
