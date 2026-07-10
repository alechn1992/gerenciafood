-- Persiste o estado de um relatório de segurança por cliente.
-- Fotos (data URLs) não são salvas — ficam apenas em memória no browser.

create table if not exists relatorios (
  id             uuid        primary key default gen_random_uuid(),
  cliente_id     uuid        not null references clientes(id) on delete cascade,
  avaliador      text        not null default '',
  registro_crn   text        not null default '',
  eh_cei         boolean     not null default false,
  data_avaliacao date        not null,
  respostas      jsonb       not null default '{}',
  observacoes    jsonb       not null default '{}',
  gerado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

alter table relatorios enable row level security;

create policy "acesso autenticado" on relatorios
  for all
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);
