import { useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { usePermissoes } from './auth/PermissoesContext';
import { supabase } from './lib/supabase';
import { PaginaLogin } from './pages/PaginaLogin';
import { PaginaClientes } from './pages/PaginaClientes';
import { PaginaClienteForm } from './pages/PaginaClienteForm';
import { PaginaPratos } from './pages/PaginaPratos';
import { PaginaCardapio } from './pages/PaginaCardapio';
import { PaginaMontagemCardapio } from './pages/PaginaMontagemCardapio';
import { PaginaRelatorio } from './pages/PaginaRelatorio';
import { PaginaRelatorioMenu } from './pages/PaginaRelatorioMenu';
import { PaginaReceita } from './pages/PaginaReceita';
import { PaginaInsumos } from './pages/PaginaInsumos';
import { PaginaConfiguracoes } from './pages/PaginaConfiguracoes';
import { PaginaSazonalidade } from './pages/PaginaSazonalidade';
import { PaginaPlanoAcao } from './pages/PaginaPlanoAcao';
import { PaginaVisitas } from './pages/PaginaVisitas';
import { PaginaVisitaDetalhe } from './pages/PaginaVisitaDetalhe';
import { PaginaProfissionais } from './pages/PaginaProfissionais';

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { session, carregando } = useAuth();

  if (!supabase) return <>{children}</>;

  if (carregando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--cinza)' }}>Verificando sessão…</p>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

type NavLink = { tipo: 'link'; tela: string; label: string; to: string };
type NavGrupo = { tipo: 'grupo'; id: string; label: string; filhos: { tela: string; label: string; to: string }[] };
type NavItem = NavLink | NavGrupo;

const NAV_ESTRUTURA: NavItem[] = [
  { tipo: 'link',  tela: 'cardapio',     label: 'Cardápio',      to: '/cardapio' },
  { tipo: 'link',  tela: 'pratos',       label: 'Receituário',   to: '/pratos' },
  { tipo: 'link',  tela: 'sazonalidade', label: 'Sazonalidade',  to: '/sazonalidade' },
  {
    tipo: 'grupo', id: 'cadastro', label: 'Cadastro',
    filhos: [
      { tela: 'profissionais', label: 'Profissionais', to: '/profissionais' },
      { tela: 'clientes',      label: 'Clientes',      to: '/clientes' },
      { tela: 'insumos',       label: 'Insumos',       to: '/insumos' },
    ],
  },
  {
    tipo: 'grupo', id: 'relatorios', label: 'Relatórios',
    filhos: [
      { tela: 'relatorio', label: 'Checklist de Boas Práticas', to: '/relatorio' },
      { tela: 'visitas',   label: 'Visitas',                    to: '/visitas' },
    ],
  },
];

export function App() {
  const { user, session, carregando: carregandoAuth, sair } = useAuth();
  const { telas } = usePermissoes();
  const navigate = useNavigate();
  const [gruposAbertos, setGruposAbertos] = useState<Set<string>>(new Set(['cadastro', 'relatorios']));

  function toggleGrupo(id: string) {
    setGruposAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          supabase && !carregandoAuth && session
            ? <Navigate to="/" replace />
            : <PaginaLogin />
        }
      />
      <Route
        path="/*"
        element={
          <RotaProtegida>
            <div className="app">
              <aside className="sidebar no-print">
                <div className="marca">🍽️ GerenciaFood</div>
                <nav>
                  {NAV_ESTRUTURA.map((item) => {
                    if (item.tipo === 'link') {
                      if (!telas.includes(item.tela)) return null;
                      return (
                        <NavLink key={item.tela} to={item.to} className={({ isActive }) => (isActive ? 'ativo' : '')}>
                          {item.label}
                        </NavLink>
                      );
                    }
                    const filhosVisiveis = item.filhos.filter((f) => telas.includes(f.tela));
                    if (filhosVisiveis.length === 0) return null;
                    const aberto = gruposAbertos.has(item.id);
                    return (
                      <div key={item.id} className="nav-grupo">
                        <button className="nav-grupo-header" onClick={() => toggleGrupo(item.id)}>
                          <span>{item.label}</span>
                          <span className="nav-grupo-seta">{aberto ? '▾' : '▸'}</span>
                        </button>
                        {aberto && (
                          <div className="nav-grupo-filhos">
                            {filhosVisiveis.map((f) => (
                              <NavLink key={f.tela} to={f.to} className={({ isActive }) => (isActive ? 'ativo' : '')}>
                                {f.label}
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>

                <div className="sidebar-rodape">
                  {user && (
                    <div className="sidebar-usuario">
                      <span className="sidebar-email">{user.email}</span>
                      <button className="sidebar-sair" onClick={sair}>
                        Sair
                      </button>
                    </div>
                  )}
                  <button
                    className="sidebar-config-btn"
                    title="Configurações"
                    onClick={() => navigate('/configuracoes')}
                  >
                    ⚙️
                  </button>
                </div>
              </aside>

              <main className="conteudo">
                <Routes>
                  <Route path="/" element={<Navigate to="/clientes" replace />} />
                  <Route path="/profissionais" element={<PaginaProfissionais />} />
                  <Route path="/clientes" element={<PaginaClientes />} />
                  <Route path="/clientes/novo" element={<PaginaClienteForm />} />
                  <Route path="/clientes/:id/editar" element={<PaginaClienteForm />} />
                  <Route path="/clientes/:id/cardapio" element={<PaginaCardapio />} />
                  <Route path="/cardapio" element={<PaginaMontagemCardapio />} />
                  <Route path="/clientes/:id/relatorio" element={<PaginaRelatorio />} />
                  <Route path="/clientes/:id/plano-acao" element={<PaginaPlanoAcao />} />
                  <Route path="/relatorio" element={<PaginaRelatorioMenu />} />
                  <Route path="/pratos" element={<PaginaPratos />} />
                  <Route path="/pratos/:id/receita" element={<PaginaReceita />} />
                  <Route path="/insumos" element={<PaginaInsumos />} />
                  <Route path="/sazonalidade" element={<PaginaSazonalidade />} />
                  <Route path="/visitas" element={<PaginaVisitas />} />
                  <Route path="/visitas/:id" element={<PaginaVisitaDetalhe />} />
                  <Route path="/configuracoes" element={<PaginaConfiguracoes />} />
                  <Route path="*" element={<Navigate to="/clientes" replace />} />
                </Routes>
              </main>
            </div>
          </RotaProtegida>
        }
      />
    </Routes>
  );
}
