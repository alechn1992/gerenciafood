import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { usePermissoes } from './auth/PermissoesContext';
import { supabase } from './lib/supabase';
import { useNovaVersaoDisponivel } from './lib/versao';
import { Sidebar } from './components/Sidebar';
import { useTema } from './state/useTema';
import { useData } from './state/DataContext';
import { Icone } from './components/Icone';
import { PaginaLogin } from './pages/PaginaLogin';
import { PaginaDefinirSenha } from './pages/PaginaDefinirSenha';
import { PaginaClientes } from './pages/PaginaClientes';
import { PaginaClienteForm } from './pages/PaginaClienteForm';
import { PaginaPratos } from './pages/PaginaPratos';
import { PaginaCardapio } from './pages/PaginaCardapio';
import { PaginaMontagemCardapio } from './pages/PaginaMontagemCardapio';
import { PaginaRelatorio } from './pages/PaginaRelatorio';
import { PaginaRelatorioMenu } from './pages/PaginaRelatorioMenu';
import { PaginaReceita } from './pages/PaginaReceita';
import { PaginaPreferencias } from './pages/PaginaPreferencias';
import { PaginaCategorias } from './pages/PaginaCategorias';
import { PaginaCalendario } from './pages/PaginaCalendario';
import { PaginaPainel } from './pages/PaginaPainel';
import { PaginaInsumos } from './pages/PaginaInsumos';
import { PaginaConfiguracoes } from './pages/PaginaConfiguracoes';
import { PaginaSazonalidade } from './pages/PaginaSazonalidade';
import { PaginaPlanoAcao } from './pages/PaginaPlanoAcao';
import { PaginaVisitas } from './pages/PaginaVisitas';
import { PaginaVisitaDetalhe } from './pages/PaginaVisitaDetalhe';
import { PaginaProfissionais } from './pages/PaginaProfissionais';
import { PaginaProfissionalForm } from './pages/PaginaProfissionalForm';
import { PaginaImportarCardapio } from './pages/PaginaImportarCardapio';

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

/** Falha ao buscar os dados: avisa em vez de mostrar listas vazias. */
function AvisoErroCarregamento() {
  const { errosCarregamento } = useData();
  if (errosCarregamento.length === 0) return null;
  return (
    <div className="aviso no-print" role="alert">
      <strong>Não foi possível carregar todos os dados.</strong> Listas vazias aqui não querem
      dizer que os cadastros foram apagados. Verifique a internet e tente de novo.
      <ul style={{ margin: '6px 0 8px', paddingLeft: 18, fontSize: '0.85em' }}>
        {errosCarregamento.map((e) => <li key={e}>{e}</li>)}
      </ul>
      <button className="btn pequeno" onClick={() => window.location.reload()}>Tentar de novo</button>
    </div>
  );
}

export function App() {
  const { user, session, carregando: carregandoAuth, sair } = useAuth();
  const { telas } = usePermissoes();
  const novaVersao = useNovaVersaoDisponivel();
  const [menuAberto, setMenuAberto] = useState(false);
  const tema = useTema();

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
      {/* Fora da rota protegida: o convidado chega aqui sem perfil ainda */}
      <Route path="/definir-senha" element={<PaginaDefinirSenha />} />
      <Route
        path="/*"
        element={
          <RotaProtegida>
            <div className="app">
              <Sidebar
                telas={telas}
                email={user?.email ?? undefined}
                onSair={sair}
                aberto={menuAberto}
                onFechar={() => setMenuAberto(false)}
                tema={tema.preferencia}
                onTema={tema.escolher}
              />

              <main className="conteudo">
                <div className="topo-mobile no-print">
                  <button className="menu-abrir" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
                    <Icone nome="menu" tamanho={22} />
                  </button>
                  <strong>GerenciaFood</strong>
                </div>
                {novaVersao && (
                  <div className="aviso-versao no-print" role="status">
                    <span>
                      Há uma versão nova do GerenciaFood. Atualize para usar as últimas correções.
                    </span>
                    <button className="btn pequeno" onClick={() => window.location.reload()}>
                      Atualizar agora
                    </button>
                  </div>
                )}
                <AvisoErroCarregamento />
                <Routes>
                  <Route path="/" element={<Navigate to="/clientes" replace />} />
                  <Route path="/profissionais" element={<PaginaProfissionais />} />
                  <Route path="/profissionais/novo" element={<PaginaProfissionalForm />} />
                  <Route path="/profissionais/:id/editar" element={<PaginaProfissionalForm />} />
                  <Route path="/clientes" element={<PaginaClientes />} />
                  <Route path="/clientes/novo" element={<PaginaClienteForm />} />
                  <Route path="/clientes/:id/editar" element={<PaginaClienteForm />} />
                  <Route path="/clientes/:id/cardapio" element={<PaginaCardapio />} />
                  <Route path="/clientes/:id/calendario" element={<PaginaCalendario />} />
                  <Route path="/cardapio" element={<PaginaMontagemCardapio />} />
                  <Route path="/clientes/:id/relatorio" element={<PaginaRelatorio />} />
                  <Route path="/clientes/:id/plano-acao" element={<PaginaPlanoAcao />} />
                  <Route path="/relatorio" element={<PaginaRelatorioMenu />} />
                  <Route path="/painel" element={<PaginaPainel />} />
                  <Route path="/pratos" element={<PaginaPratos />} />
                  <Route path="/pratos/:id/receita" element={<PaginaReceita />} />
                  <Route path="/insumos" element={<PaginaInsumos />} />
                  <Route path="/preferencias" element={<PaginaPreferencias />} />
                  <Route path="/categorias" element={<PaginaCategorias />} />
                  <Route path="/sazonalidade" element={<PaginaSazonalidade />} />
                  <Route path="/visitas" element={<PaginaVisitas />} />
                  <Route path="/visitas/:id" element={<PaginaVisitaDetalhe />} />
                  <Route path="/importar-cardapio" element={<PaginaImportarCardapio />} />
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
