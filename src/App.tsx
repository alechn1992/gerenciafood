import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useData } from './state/DataContext';
import { useAuth } from './auth/AuthContext';
import { supabase } from './lib/supabase';
import { PaginaLogin } from './pages/PaginaLogin';
import { PaginaClientes } from './pages/PaginaClientes';
import { PaginaClienteForm } from './pages/PaginaClienteForm';
import { PaginaPratos } from './pages/PaginaPratos';
import { PaginaCardapio } from './pages/PaginaCardapio';
import { PaginaMontagemCardapio } from './pages/PaginaMontagemCardapio';
import { PaginaRelatorio } from './pages/PaginaRelatorio';
import { PaginaReceita } from './pages/PaginaReceita';
import { PaginaInsumos } from './pages/PaginaInsumos';

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { session, carregando } = useAuth();

  // Modo local (sem Supabase): sem autenticação necessária
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

export function App() {
  const { repo } = useData();
  const { user, session, carregando: carregandoAuth, sair } = useAuth();

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
                  <NavLink to="/clientes" className={({ isActive }) => (isActive ? 'ativo' : '')}>
                    Clientes
                  </NavLink>
                  <NavLink to="/cardapio" className={({ isActive }) => (isActive ? 'ativo' : '')}>
                    Cardápio
                  </NavLink>
                  <NavLink to="/pratos" className={({ isActive }) => (isActive ? 'ativo' : '')}>
                    Banco de pratos
                  </NavLink>
                  <NavLink to="/insumos" className={({ isActive }) => (isActive ? 'ativo' : '')}>
                    Insumos
                  </NavLink>
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
                  <div className="modo">
                    Armazenamento:{' '}
                    <strong>{repo.modo === 'supabase' ? 'Supabase' : 'Local (navegador)'}</strong>
                  </div>
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
                  <Route path="/pratos" element={<PaginaPratos />} />
                  <Route path="/pratos/:id/receita" element={<PaginaReceita />} />
                  <Route path="/insumos" element={<PaginaInsumos />} />
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
