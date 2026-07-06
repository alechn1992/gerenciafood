import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useData } from './state/DataContext';
import { PaginaClientes } from './pages/PaginaClientes';
import { PaginaClienteForm } from './pages/PaginaClienteForm';
import { PaginaPratos } from './pages/PaginaPratos';
import { PaginaCardapio } from './pages/PaginaCardapio';
import { PaginaRelatorio } from './pages/PaginaRelatorio';

export function App() {
  const { repo } = useData();
  return (
    <div className="app">
      <aside className="sidebar no-print">
        <div className="marca">🍽️ GerenciaFood</div>
        <nav>
          <NavLink to="/clientes" className={({ isActive }) => (isActive ? 'ativo' : '')}>
            Clientes
          </NavLink>
          <NavLink to="/pratos" className={({ isActive }) => (isActive ? 'ativo' : '')}>
            Banco de pratos
          </NavLink>
        </nav>
        <div className="modo">
          Armazenamento:{' '}
          <strong>{repo.modo === 'supabase' ? 'Supabase' : 'Local (navegador)'}</strong>
        </div>
      </aside>
      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Navigate to="/clientes" replace />} />
          <Route path="/clientes" element={<PaginaClientes />} />
          <Route path="/clientes/novo" element={<PaginaClienteForm />} />
          <Route path="/clientes/:id/editar" element={<PaginaClienteForm />} />
          <Route path="/clientes/:id/cardapio" element={<PaginaCardapio />} />
          <Route path="/clientes/:id/relatorio" element={<PaginaRelatorio />} />
          <Route path="/pratos" element={<PaginaPratos />} />
          <Route path="*" element={<Navigate to="/clientes" replace />} />
        </Routes>
      </main>
    </div>
  );
}
