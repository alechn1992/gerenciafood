import { useState } from 'react';
import { useData } from '../state/DataContext';
import { migrarDadosLocais } from '../lib/migrarDadosLocais';

export function PaginaConfiguracoes() {
  const { repo } = useData();
  const [estado, setEstado] = useState<'idle' | 'migrando' | 'ok' | 'erro'>('idle');
  const [resultado, setResultado] = useState<{ migrados: number; erros: string[] } | null>(null);

  const podesMigrar = repo.modo === 'supabase';

  async function handleMigrar() {
    if (!podesMigrar) return;
    setEstado('migrando');
    setResultado(null);
    try {
      const r = await migrarDadosLocais(repo);
      setResultado(r);
      setEstado(r.erros.length === 0 ? 'ok' : 'erro');
    } catch (e: unknown) {
      setResultado({ migrados: 0, erros: [e instanceof Error ? e.message : String(e)] });
      setEstado('erro');
    }
  }

  return (
    <div>
      <div className="linha">
        <div>
          <h1>Configurações</h1>
          <p className="subtitulo">Ferramentas de administração do sistema.</p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Migrar dados do navegador para Supabase</h2>
        <p style={{ color: 'var(--cinza)', marginBottom: 20 }}>
          Se você cadastrou clientes, pratos ou insumos antes de conectar ao Supabase,
          use este botão para transferir esses dados do armazenamento local do navegador
          para o banco de dados. A operação é segura — dados já existentes no Supabase
          com o mesmo ID serão atualizados, não duplicados.
        </p>

        {!podesMigrar && (
          <div className="login-aviso erro" style={{ marginBottom: 16 }}>
            Migração disponível somente no modo Supabase. Verifique se as variáveis
            de ambiente <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> estão
            configuradas.
          </div>
        )}

        {estado === 'ok' && resultado && (
          <div className="login-aviso sucesso" style={{ marginBottom: 16 }}>
            ✓ Migração concluída — <strong>{resultado.migrados}</strong> registro(s) transferido(s) com sucesso.
          </div>
        )}

        {estado === 'erro' && resultado && (
          <div style={{ marginBottom: 16 }}>
            {resultado.migrados > 0 && (
              <div className="login-aviso sucesso" style={{ marginBottom: 8 }}>
                ✓ {resultado.migrados} registro(s) migrado(s).
              </div>
            )}
            <div className="login-aviso erro">
              <strong>Erros ({resultado.erros.length}):</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {resultado.erros.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          </div>
        )}

        <button
          className="btn"
          onClick={handleMigrar}
          disabled={!podesMigrar || estado === 'migrando'}
        >
          {estado === 'migrando' ? 'Migrando…' : '☁️ Migrar dados locais para Supabase'}
        </button>
      </div>
    </div>
  );
}
