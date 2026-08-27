-- Fecha escalonamento de privilégio em perfis.
--
-- A política original de 0010_perfis.sql era "for all using (auth.uid() = id)",
-- o que incluía UPDATE: qualquer usuário podia rodar
--   update perfis set admin = true where id = auth.uid()
-- e virar administrador. O WITH CHECK só restringia a coluna id, não admin.
--
-- Agora o usuário apenas LÊ o próprio perfil. Escrita fica com admins
-- (política "admin gerencia todos") e com a service role, usada pela
-- função convidar-usuario.

drop policy if exists "usuario gerencia proprio perfil" on public.perfis;

create policy "usuario le proprio perfil" on public.perfis
  for select
  using (auth.uid() = id);

-- search_path fixo nas funções security definer (aviso do linter do Supabase)
create or replace function public.eh_admin()
returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (select admin from public.perfis where id = auth.uid()),
    false
  );
$$;

create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
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

-- Nenhuma das duas é endpoint: não devem ser chamadas via /rest/v1/rpc
revoke execute on function public.eh_admin() from anon, authenticated;
revoke execute on function public.criar_perfil_novo_usuario() from anon, authenticated;
