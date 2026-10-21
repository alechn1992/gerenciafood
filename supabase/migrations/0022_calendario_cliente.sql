-- Calendário de funcionamento do cliente: períodos sem atendimento (feriado,
-- recesso, férias...). Nesses dias o cardápio não é gerado e a folha das
-- famílias mostra o motivo.

create table if not exists calendario_cliente (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references clientes(id) on delete cascade,
  inicio      date not null,
  fim         date not null,
  motivo      text not null,          -- vai para as famílias, ex.: 'FERIADO'
  descricao   text,                   -- detalhe interno, ex.: 'Tiradentes'
  criado_em   timestamptz not null default now(),
  check (fim >= inicio)
);

create index if not exists calendario_cliente_cliente_idx on calendario_cliente (cliente_id, inicio);

alter table calendario_cliente enable row level security;

drop policy if exists "calendario_cliente_autenticados" on calendario_cliente;
create policy "calendario_cliente_autenticados" on calendario_cliente
  for all to authenticated using (true) with check (true);

grant all on table calendario_cliente to authenticated;

notify pgrst, 'reload schema';
