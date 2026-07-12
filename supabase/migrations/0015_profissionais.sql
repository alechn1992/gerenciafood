-- Tabela de profissionais (nutricionistas, consultores)
create table if not exists profissionais (
  id            text primary key,
  nome          text not null,
  email         text,
  telefone      text,
  registro_crn  text,
  especialidade text,
  empresa       text,
  cargo         text,
  logo_empresa  text,   -- base64 data URL
  assinatura    text,   -- base64 data URL (PNG)
  criado_em     timestamptz not null default now()
);

alter table profissionais enable row level security;

create policy "profissionais_all" on profissionais
  for all using (true) with check (true);

grant all on table profissionais to anon, authenticated;

-- Relaciona visitas com profissionais
alter table visitas
  add column if not exists profissional_id text references profissionais(id) on delete set null;

-- Relaciona relatorios com profissionais
alter table relatorios
  add column if not exists profissional_id text references profissionais(id) on delete set null;

notify pgrst, 'reload schema';
