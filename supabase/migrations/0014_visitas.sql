-- Tabela para registrar visitas de consultoria aos clientes

create table if not exists visitas (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references clientes(id) on delete cascade,
  data           date not null,
  consultor      text not null default '',
  tipo           text not null default 'auditoria',
  observacoes    text not null default '',
  proxima_visita date,
  relatorio_id   uuid references relatorios(id) on delete set null,
  criado_em      timestamptz not null default now()
);

create index if not exists visitas_cliente_id_idx on visitas (cliente_id);
create index if not exists visitas_data_idx on visitas (data desc);
