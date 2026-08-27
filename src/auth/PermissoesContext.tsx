import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export const TELAS_DISPONIVEIS = [
  { id: 'profissionais', label: 'Profissionais' },
  { id: 'clientes',      label: 'Clientes' },
  { id: 'insumos',       label: 'Insumos' },
  { id: 'cardapio',      label: 'Cardápio' },
  { id: 'pratos',        label: 'Receituário' },
  { id: 'sazonalidade',  label: 'Sazonalidade' },
  { id: 'importar',      label: 'Importar Excel' },
  { id: 'relatorio',     label: 'Checklist de Boas Práticas' },
  { id: 'visitas',       label: 'Visitas' },
] as const;

export const TELAS_PADRAO = TELAS_DISPONIVEIS.map((t) => t.id);

interface Permissoes {
  telas: string[];
  admin: boolean;
  carregando: boolean;
}

const ACESSO_TOTAL: Permissoes = { telas: TELAS_PADRAO, admin: true, carregando: false };
const SEM_ACESSO: Permissoes = { telas: [], admin: false, carregando: false };

const Ctx = createContext<Permissoes>(ACESSO_TOTAL);

export function PermissoesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [perm, setPerm] = useState<Permissoes>({
    ...ACESSO_TOTAL,
    carregando: !!(supabase && user),
  });

  useEffect(() => {
    if (!supabase || !user) {
      setPerm(ACESSO_TOTAL);
      return;
    }

    setPerm((p) => ({ ...p, carregando: true }));

    supabase
      .from('perfis')
      .select('telas, admin')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPerm({ telas: data.telas ?? TELAS_PADRAO, admin: data.admin ?? false, carregando: false });
        } else {
          // Sem perfil: nega em vez de liberar. O perfil é criado pelo convite
          // (função convidar-usuario) ou pelo trigger on_auth_user_created —
          // conceder acesso aqui permitiria a qualquer conta virar admin.
          setPerm(SEM_ACESSO);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return <Ctx.Provider value={perm}>{children}</Ctx.Provider>;
}

export function usePermissoes() {
  return useContext(Ctx);
}
