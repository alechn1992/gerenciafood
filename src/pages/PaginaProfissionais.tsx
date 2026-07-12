import { useNavigate } from 'react-router-dom';
import { useData } from '../state/DataContext';

export function PaginaProfissionais() {
  const { profissionais, removerProfissional } = useData();
  const navigate = useNavigate();

  async function remover(id: string, nome: string) {
    if (!confirm(`Remover o profissional "${nome}"? Esta ação não pode ser desfeita.`)) return;
    await removerProfissional(id);
  }

  return (
    <div>
      <div className="linha" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Profissionais</h2>
          <p className="subtitulo">Nutricionistas e consultores vinculados aos relatórios.</p>
        </div>
        <button className="btn" onClick={() => navigate('/profissionais/novo')}>+ Novo profissional</button>
      </div>

      {profissionais.length === 0 ? (
        <div className="card vazio">
          Nenhum profissional cadastrado.{' '}
          <button className="btn-link" onClick={() => navigate('/profissionais/novo')}>
            Cadastrar agora
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {profissionais.map((p) => (
            <div
              key={p.id}
              className="card"
              style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 16px' }}
            >
              {/* Logo / avatar */}
              <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--borda)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--fundo)' }}>
                {p.logoEmpresa ? (
                  <img src={p.logoEmpresa} alt={p.empresa ?? p.nome} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                ) : (
                  <span style={{ fontSize: 24 }}>👤</span>
                )}
              </div>

              {/* Dados */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{p.nome}</div>
                <div style={{ fontSize: 13, color: 'var(--cinza)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {p.registroCRN && <span>🆔 {p.registroCRN}</span>}
                  {p.especialidade && <span>🎓 {p.especialidade}</span>}
                  {p.empresa && <span>🏢 {p.empresa}{p.cargo ? ` — ${p.cargo}` : ''}</span>}
                  {p.email && <span>✉️ {p.email}</span>}
                  {p.telefone && <span>📞 {p.telefone}</span>}
                </div>
              </div>

              {/* Indicadores */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                {p.assinatura && (
                  <span title="Assinatura cadastrada" style={{ fontSize: 18 }}>✍️</span>
                )}
              </div>

              {/* Ações */}
              <div className="acoes" style={{ flexShrink: 0 }}>
                <button
                  className="btn pequeno secundario"
                  onClick={() => navigate(`/profissionais/${p.id}/editar`)}
                >
                  Editar
                </button>
                <button
                  className="btn pequeno perigo"
                  onClick={() => remover(p.id, p.nome)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
