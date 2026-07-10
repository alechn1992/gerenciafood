-- Perfis de usuário com controle de acesso por tela

create table perfis (
  id        uuid    primary key references auth.users(id) on delete cascade,
  email     text    not null,
  telas     text[]  not null default '{clientes,cardapio,pratos,insumos,relatorio}',
  admin     boolean not null default false,
  criado_em timestamptz not null default now()
);

alter table perfis enable row level security;

-- Função auxiliar (security definer quebra recursão de RLS)
create or replace function public.eh_admin()
returns boolean
language sql security definer stable
as $$
  select coalesce(
    (select admin from public.perfis where id = auth.uid()),
    false
  );
$$;

-- Cada usuário lê/edita somente o próprio perfil
create policy "usuario gerencia proprio perfil" on perfis
  for all
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- Administradores gerenciam todos os perfis
create policy "admin gerencia todos" on perfis
  for all
  using  (public.eh_admin())
  with check (public.eh_admin());

-- Trigger: cria perfil automaticamente ao registrar novo usuário
-- O primeiro usuário cadastrado vira admin.
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql security definer
as $$
declare
  n integer;
begin
  select count(*) into n from public.perfis;
  insert into public.perfis (id, email, admin)
  values (new.id, new.email, n = 0)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.criar_perfil_novo_usuario();
