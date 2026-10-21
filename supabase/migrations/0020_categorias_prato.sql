-- Categorias de prato cadastradas pela nutricionista, além das padrão
-- (proteína, guarnição, acompanhamento, salada, bebida, lanche, sobremesa,
-- outro).

create table if not exists categorias_prato (
  valor      text primary key,   -- identificador estável, ex.: 'fruta'
  nome       text not null,      -- rótulo exibido, ex.: 'Fruta'
  criado_em  timestamptz not null default now()
);

alter table categorias_prato enable row level security;

drop policy if exists "categorias_prato_autenticados" on categorias_prato;
create policy "categorias_prato_autenticados" on categorias_prato
  for all to authenticated using (true) with check (true);

grant all on table categorias_prato to authenticated;

-- A coluna aceitava só as 8 categorias fixas; agora aceita também as cadastradas.
alter table pratos drop constraint if exists pratos_categoria_check;

notify pgrst, 'reload schema';
