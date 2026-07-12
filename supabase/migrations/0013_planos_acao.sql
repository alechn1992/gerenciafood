-- Tabela para armazenar o Plano de Ação por cliente
-- (ações corretivas geradas a partir das não conformidades do relatório RDC 216)

create table if not exists planos_acao (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references clientes(id) on delete cascade,
  relatorio_id  uuid,
  acoes         jsonb not null default '[]'::jsonb,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists planos_acao_cliente_id_idx on planos_acao (cliente_id);
