-- Turmas/faixas etárias por cliente (ex.: CEI com "Baby 1", "Baby 2"..."Infantis"),
-- cada uma com suas próprias refeições e restrições.

create table if not exists turmas (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  nome       text not null,
  ordem      int not null default 0,
  refeicoes  jsonb not null default '[]'::jsonb,
  restricoes jsonb not null default '[]'::jsonb,
  criado_em  timestamptz not null default now()
);

create index if not exists idx_turmas_cliente on turmas(cliente_id);

alter table cardapios add column if not exists turma_id uuid references turmas(id) on delete cascade;
create index if not exists idx_cardapios_turma on cardapios(turma_id);
