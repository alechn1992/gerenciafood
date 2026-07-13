import { useEffect, useState } from 'react';
import { useData, type ResultadoSync } from '../state/DataContext';
import { usePermissoes, TELAS_DISPONIVEIS, TELAS_PADRAO } from '../auth/PermissoesContext';
import { migrarDadosLocais } from '../lib/migrarDadosLocais';
import { supabase } from '../lib/supabase';
import type { ConfiguracaoSync } from '../domain/types';

interface Perfil {
  id: string;
  email: string;
  telas: string[];
  admin: boolean;
}

export function PaginaConfiguracoes() {
  const { repo, configuracaoSync, salvarConfiguracaoSync, sincronizarInsumos } = useData();
  const { admin } = usePermissoes();

  // ── migração ──
  const [estadoMig, setEstadoMig] = useState<'idle' | 'migrando' | 'ok' | 'erro'>('idle');
  const [resultMig, setResultMig] = useState<{ migrados: number; erros: string[] } | null>(null);

  // ── integração API ──
  const [urlBase, setUrlBase] = useState(configuracaoSync?.urlBase ?? '');
  const [apiKey, setApiKey] = useState(configuracaoSync?.apiKey ?? '');
  const [mostrarChave, setMostrarChave] = useState(false);
  const [salvandoApi, setSalvandoApi] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [resultSync, setResultSync] = useState<ResultadoSync | null>(null);

  useEffect(() => {
    if (configuracaoSync) {
      setUrlBase(configuracaoSync.urlBase);
      setApiKey(configuracaoSync.apiKey);
    }
  }, [configuracaoSync]);

  async function handleSalvarApi() {
    setSalvandoApi(true);
    const cfg: ConfiguracaoSync = {
      urlBase: urlBase.trim(),
      apiKey: apiKey.trim(),
      ultimaSincronizacao: configuracaoSync?.ultimaSincronizacao,
    };
    await salvarConfiguracaoSync(cfg);
    setSalvandoApi(false);
  }

  async function handleSincronizar() {
    setSincronizando(true);
    setResultSync(null);
    const r = await sincronizarInsumos();
    setResultSync(r);
    setSincronizando(false);
  }

  async function handleMigrar() {
    setEstadoMig('migrando');
    setResultMig(null);
    try {
      const r = await migrarDadosLocais(repo);
      setResultMig(r);
      setEstadoMig(r.erros.length === 0 ? 'ok' : 'erro');
    } catch (e: unknown) {
      setResultMig({ migrados: 0, erros: [e instanceof Error ? e.message : String(e)] });
      setEstadoMig('erro');
    }
  }

  // ── usuários ──
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [novoEmail, setNovoEmail] = useState('');
  const [novasTelas, setNovasTelas] = useState<string[]>(TELAS_PADRAO);
  const [convidando, setConvidando] = useState(false);
  const [msgConvite, setMsgConvite] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);

  async function carregarUsuarios() {
    if (!supabase || !admin) return;
    setCarregando(true);
    const { data } = await supabase.from('perfis').select('id, email, telas, admin').order('criado_em');
    setUsuarios((data as Perfil[]) ?? []);
    setCarregando(false);
  }

  useEffect(() => { carregarUsuarios(); }, [admin]);

  async function handleConvidar() {
    if (!supabase || !novoEmail.trim()) return;
    setConvidando(true);
    setMsgConvite(null);
    const { error } = await supabase.functions.invoke('convidar-usuario', {
      body: { email: novoEmail.trim(), telas: novasTelas },
    });
    if (error) {
      let msg = error.message;
      try {
        const body = typeof error.context?.json === 'function' ? await error.context.json() : null;
        if (body?.error) msg = body.error;
      } catch { /* ignora */ }
      setMsgConvite({ tipo: 'erro', texto: msg });
    } else {
      setMsgConvite({ tipo: 'ok', texto: `Convite enviado para ${novoEmail.trim()}.` });
      setNovoEmail('');
      setNovasTelas(TELAS_PADRAO);
      await carregarUsuarios();
    }
    setConvidando(false);
  }

  async function handleSalvarPermissoes(u: Perfil) {
    if (!supabase) return;
    setSalvando(u.id);
    await supabase.from('perfis').update({ telas: u.telas, admin: u.admin }).eq('id', u.id);
    setSalvando(null);
  }

  function toggleTela(perfil: Perfil, tela: string) {
    setUsuarios((prev) =>
      prev.map((p) =>
        p.id === perfil.id
          ? { ...p, telas: p.telas.includes(tela) ? p.telas.filter((t) => t !== tela) : [...p.telas, tela] }
          : p,
      ),
    );
  }

  return (
    <div>
      <div className="linha">
        <div>
          <h1>Configurações</h1>
        </div>
      </div>

      {/* Migração */}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Migrar dados do navegador para Supabase</h2>
        <p className="subtitulo" style={{ marginBottom: 20 }}>
          Transfere clientes, pratos, insumos, turmas e cardápios armazenados neste navegador para o banco de dados.
          Registros com o mesmo ID serão atualizados, não duplicados.
        </p>
        {estadoMig === 'ok' && resultMig && (
          <div className="login-aviso sucesso" style={{ marginBottom: 12 }}>
            ✓ {resultMig.migrados} registro(s) transferido(s) com sucesso.
          </div>
        )}
        {estadoMig === 'erro' && resultMig && (
          <div className="login-aviso erro" style={{ marginBottom: 12 }}>
            {resultMig.migrados > 0 && <div>{resultMig.migrados} migrado(s). </div>}
            Erros: {resultMig.erros.join(' | ')}
          </div>
        )}
        <button
          className="btn"
          onClick={handleMigrar}
          disabled={repo.modo !== 'supabase' || estadoMig === 'migrando'}
        >
          {estadoMig === 'migrando' ? 'Migrando…' : '☁️ Migrar dados locais para Supabase'}
        </button>
        {repo.modo !== 'supabase' && (
          <p className="subtitulo" style={{ marginTop: 8 }}>
            Indisponível — app em modo local (sem Supabase configurado).
          </p>
        )}
      </div>

      {/* Integração API externa */}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Integração com sistema externo (API)</h2>
        <p className="subtitulo" style={{ marginBottom: 16 }}>
          Conecte ao seu sistema de compras para importar produtos (mercado, açougue, varejão,
          naturais) com preços atualizados automaticamente. A sincronização cria ou atualiza
          os insumos sem apagar registros manuais.
        </p>

        <div className="grid cols-2" style={{ marginBottom: 12 }}>
          <div>
            <label>URL base da API</label>
            <input
              type="url"
              placeholder="https://meu-sistema.com/api"
              value={urlBase}
              onChange={(e) => setUrlBase(e.target.value)}
            />
            <p className="subtitulo" style={{ marginTop: 4, fontSize: '0.78rem' }}>
              O sistema irá chamar <code>{urlBase.replace(/\/$/, '') || 'URL'}/produtos</code>
            </p>
          </div>
          <div>
            <label>Chave de API (X-Api-Key)</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type={mostrarChave ? 'text' : 'password'}
                placeholder="sua-chave-secreta"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                className="btn pequeno secundario"
                onClick={() => setMostrarChave((v) => !v)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {mostrarChave ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn pequeno"
            onClick={handleSalvarApi}
            disabled={salvandoApi || !urlBase.trim() || !apiKey.trim()}
          >
            {salvandoApi ? 'Salvando…' : '💾 Salvar configuração'}
          </button>
          <button
            className="btn"
            onClick={handleSincronizar}
            disabled={sincronizando || !configuracaoSync?.urlBase}
          >
            {sincronizando ? '⟳ Sincronizando…' : '⟳ Sincronizar insumos agora'}
          </button>
          {configuracaoSync?.ultimaSincronizacao && (
            <span className="subtitulo" style={{ fontSize: '0.82rem' }}>
              Última sincronização:{' '}
              {new Date(configuracaoSync.ultimaSincronizacao).toLocaleString('pt-BR')}
            </span>
          )}
        </div>

        {resultSync && (
          <div
            className={`login-aviso ${resultSync.erros.length === 0 ? 'sucesso' : 'erro'}`}
            style={{ marginTop: 14 }}
          >
            {resultSync.erros.length === 0 ? (
              <>
                ✓ Sincronização concluída — {resultSync.importados} novo(s) importado(s),{' '}
                {resultSync.atualizados} atualizado(s).
              </>
            ) : (
              <>
                {(resultSync.importados + resultSync.atualizados) > 0 && (
                  <div style={{ marginBottom: 4 }}>
                    {resultSync.importados} importado(s), {resultSync.atualizados} atualizado(s).
                  </div>
                )}
                Erros: {resultSync.erros.join(' | ')}
              </>
            )}
          </div>
        )}

        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.88rem', color: 'var(--cinza)' }}>
            Especificação da API externa (o que seu sistema deve expor)
          </summary>
          <div style={{ background: 'var(--verde-claro)', borderRadius: 8, padding: 14, marginTop: 8, fontSize: '0.85rem' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>
              GET <code>/produtos</code> &nbsp;→&nbsp; header <code>X-Api-Key: sua-chave</code>
            </p>
            <p style={{ margin: '0 0 8px' }}>Resposta esperada (JSON array):</p>
            <pre style={{ margin: 0, fontSize: '0.8rem', overflowX: 'auto' }}>{`[
  {
    "id": "123",            // string ou number — ID único no seu sistema
    "nome": "Frango Peito", // obrigatório
    "categoria": "açougue", // mercado | açougue | varejão | naturais | outro
    "unidade": "kg",        // kg | g | l | ml | un | dz | pct
    "qtd_embalagem": 1,     // número
    "preco_embalagem": 15.50, // número (R$)
    "ativo": true           // boolean
  }
]`}</pre>
          </div>
        </details>
      </div>

      {/* Usuários — somente admin */}
      {admin && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Usuários</h2>

          {/* Convidar novo usuário */}
          <div style={{ background: 'var(--verde-claro)', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 12px' }}>Convidar novo usuário</h3>
            <div className="grid cols-2" style={{ marginBottom: 12 }}>
              <div>
                <label>E-mail</label>
                <input
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                />
              </div>
              <div>
                <label>Telas que pode acessar</label>
                <div className="chips" style={{ marginTop: 6 }}>
                  {TELAS_DISPONIVEIS.map((t) => (
                    <span
                      key={t.id}
                      className={`chip ${novasTelas.includes(t.id) ? 'on' : ''}`}
                      onClick={() =>
                        setNovasTelas((prev) =>
                          prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id],
                        )
                      }
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {msgConvite && (
              <div
                className={msgConvite.tipo === 'ok' ? 'login-aviso sucesso' : 'login-aviso erro'}
                style={{ marginBottom: 10 }}
              >
                {msgConvite.texto}
              </div>
            )}
            <button
              className="btn"
              onClick={handleConvidar}
              disabled={convidando || !novoEmail.trim()}
            >
              {convidando ? 'Enviando convite…' : '✉️ Enviar convite'}
            </button>
          </div>

          {/* Lista de usuários */}
          {carregando ? (
            <p className="subtitulo">Carregando…</p>
          ) : usuarios.length === 0 ? (
            <p className="subtitulo">Nenhum usuário cadastrado ainda.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Telas permitidas</th>
                  <th style={{ width: 80 }}>Admin</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontSize: 14 }}>{u.email}</td>
                    <td>
                      <div className="chips">
                        {TELAS_DISPONIVEIS.map((t) => (
                          <span
                            key={t.id}
                            className={`chip ${u.telas.includes(t.id) ? 'on' : ''}`}
                            style={{ fontSize: 11 }}
                            onClick={() => toggleTela(u, t.id)}
                          >
                            {t.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={u.admin}
                        onChange={(e) =>
                          setUsuarios((prev) =>
                            prev.map((p) => p.id === u.id ? { ...p, admin: e.target.checked } : p),
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="btn pequeno"
                        onClick={() => handleSalvarPermissoes(u)}
                        disabled={salvando === u.id}
                      >
                        {salvando === u.id ? '…' : 'Salvar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
