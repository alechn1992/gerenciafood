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

const NAV_ITENS = [
  { tela: 'clientes',     label: 'Clientes',        to: '/clientes' },
  { tela: 'cardapio',     label: 'Cardápio',         to: '/cardapio' },
  { tela: 'pratos',       label: 'Banco de pratos',  to: '/pratos' },
  { tela: 'insumos',      label: 'Insumos',          to: '/insumos' },
  { tela: 'relatorio',    label: 'Relatório',        to: '/relatorio' },
  { tela: 'sazonalidade', label: 'Sazonalidade',     to: '/sazonalidade' },
];

export function App() {
  const { user, session, carregando: carregandoAuth, sair } = useAuth();
  const { telas } = usePermissoes();
  const navigate = useNavigate();

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
                  {NAV_ITENS.filter((n) => telas.includes(n.tela)).map((n) => (
                    <NavLink key={n.tela} to={n.to} className={({ isActive }) => (isActive ? 'ativo' : '')}>
                      {n.label}
                    </NavLink>
                  ))}
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
                  <Route path="/clientes" element={<PaginaClientes />} />
                  <Route path="/clientes/novo" element={<PaginaClienteForm />} />
                  <Route path="/clientes/:id/editar" element={<PaginaClienteForm />} />
                  <Route path="/clientes/:id/cardapio" element={<PaginaCardapio />} />
                  <Route path="/cardapio" element={<PaginaMontagemCardapio />} />
                  <Route path="/clientes/:id/relatorio" element={<PaginaRelatorio />} />
                  <Route path="/relatorio" element={<PaginaRelatorioMenu />} />
                  <Route path="/pratos" element={<PaginaPratos />} />
                  <Route path="/pratos/:id/receita" element={<PaginaReceita />} />
                  <Route path="/insumos" element={<PaginaInsumos />} />
                  <Route path="/sazonalidade" element={<PaginaSazonalidade />} />
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
