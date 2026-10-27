// Menu lateral: seções por área de trabalho, ícones, usuário e versão no
// rodapé. Em telas estreitas vira uma gaveta aberta pelo botão do topo.

import { NavLink } from 'react-router-dom';
import { Icone } from './Icone';
import { rotuloVersao } from '../lib/versao';
import type { PreferenciaTema } from '../lib/tema';

const OPCOES_TEMA: { valor: PreferenciaTema; rotulo: string; dica: string }[] = [
  { valor: 'claro', rotulo: 'Claro', dica: 'Tema claro' },
  { valor: 'escuro', rotulo: 'Escuro', dica: 'Tema escuro' },
  { valor: 'automatico', rotulo: 'Auto', dica: 'Seguir o tema do celular ou computador' },
];

interface ItemMenu {
  /** Permissão (tela do perfil) exigida para ver o item. */
  tela: string;
  label: string;
  to: string;
  icone: string;
}

interface SecaoMenu {
  titulo: string;
  itens: ItemMenu[];
}

const SECOES: SecaoMenu[] = [
  {
    titulo: 'Visão geral',
    itens: [{ tela: 'relatorio', label: 'Painel', to: '/painel', icone: 'painel' }],
  },
  {
    titulo: 'Cardápios',
    itens: [
      { tela: 'cardapio', label: 'Montar cardápio', to: '/cardapio', icone: 'cardapio' },
      { tela: 'importar', label: 'Importar planilha', to: '/importar-cardapio', icone: 'importar' },
      { tela: 'pratos', label: 'Receituário', to: '/pratos', icone: 'receituario' },
      { tela: 'sazonalidade', label: 'Sazonalidade', to: '/sazonalidade', icone: 'sazonalidade' },
    ],
  },
  {
    titulo: 'Qualidade',
    itens: [
      { tela: 'relatorio', label: 'Checklist de boas práticas', to: '/relatorio', icone: 'checklist' },
      { tela: 'visitas', label: 'Visitas técnicas', to: '/visitas', icone: 'visitas' },
    ],
  },
  {
    titulo: 'Cadastros',
    itens: [
      { tela: 'clientes', label: 'Clientes', to: '/clientes', icone: 'clientes' },
      { tela: 'profissionais', label: 'Profissionais', to: '/profissionais', icone: 'profissionais' },
      { tela: 'insumos', label: 'Insumos', to: '/insumos', icone: 'insumos' },
      // Mesma permissão do Receituário, onde as categorias são usadas.
      { tela: 'pratos', label: 'Categorias de prato', to: '/categorias', icone: 'categorias' },
      // Mesma permissão de Clientes: quem edita turmas cadastra as preferências delas.
      { tela: 'clientes', label: 'Preferências alimentares', to: '/preferencias', icone: 'preferencias' },
    ],
  },
];

const classeLink = ({ isActive }: { isActive: boolean }) => `menu-link${isActive ? ' ativo' : ''}`;

export function Sidebar({
  telas,
  email,
  onSair,
  aberto,
  onFechar,
  tema,
  onTema,
}: {
  telas: string[];
  email?: string;
  onSair: () => void;
  /** Gaveta aberta (telas estreitas). */
  aberto: boolean;
  onFechar: () => void;
  tema: PreferenciaTema;
  onTema: (t: PreferenciaTema) => void;
}) {
  return (
    <>
      <div className={`menu-fundo no-print${aberto ? ' aberto' : ''}`} onClick={onFechar} aria-hidden />
      <aside className={`sidebar no-print${aberto ? ' aberto' : ''}`} aria-label="Menu principal">
        <div className="marca">
          <span className="marca-icone">
            <Icone nome="marca" tamanho={20} />
          </span>
          <span className="marca-texto">
            <strong>GerenciaFood</strong>
            <small>Gestão de alimentação</small>
          </span>
          <button className="menu-fechar" onClick={onFechar} aria-label="Fechar menu">
            <Icone nome="fechar" />
          </button>
        </div>

        <nav className="menu">
          {SECOES.map((secao) => {
            const itens = secao.itens.filter((i) => telas.includes(i.tela));
            if (itens.length === 0) return null;
            return (
              <div key={secao.titulo} className="menu-secao">
                <div className="menu-secao-titulo">{secao.titulo}</div>
                {itens.map((i) => (
                  <NavLink key={i.to} to={i.to} className={classeLink} onClick={onFechar}>
                    <Icone nome={i.icone} />
                    <span>{i.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-rodape">
          <NavLink to="/configuracoes" className={classeLink} onClick={onFechar}>
            <Icone nome="configuracoes" />
            <span>Configurações</span>
          </NavLink>
          {email && (
            <div className="sidebar-usuario">
              <span className="sidebar-avatar" aria-hidden>{email.slice(0, 1).toUpperCase()}</span>
              <span className="sidebar-email" title={email}>{email}</span>
              <button className="sidebar-sair" onClick={onSair} title="Sair" aria-label="Sair">
                <Icone nome="sair" tamanho={16} />
              </button>
            </div>
          )}
          <div className="tema-seletor" role="group" aria-label="Tema da tela">
            {OPCOES_TEMA.map((o) => (
              <button
                key={o.valor}
                type="button"
                aria-pressed={tema === o.valor}
                title={o.dica}
                onClick={() => onTema(o.valor)}
              >
                <Icone nome={o.valor} tamanho={14} />
                {o.rotulo}
              </button>
            ))}
          </div>
          <div className="sidebar-versao" title="Versão do sistema em uso nesta aba">
            Versão {rotuloVersao()}
          </div>
        </div>
      </aside>
    </>
  );
}
