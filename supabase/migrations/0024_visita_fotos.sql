-- Fotos dos itens da visita técnica. Ficam numa tabela própria (e não dentro
-- de visitas.secoes) para a lista de visitas e o painel não baixarem imagens:
-- elas só são lidas ao abrir o relatório da visita.

create table if not exists visita_fotos (
  id          uuid primary key default gen_random_uuid(),
  visita_id   uuid not null references visitas(id) on delete cascade,
  item_id     text not null,           -- id do item dentro de visitas.secoes
  imagem      text not null,           -- JPEG reduzido, em data URL
  criado_em   timestamptz not null default now()
);

create index if not exists visita_fotos_visita_idx on visita_fotos (visita_id);

alter table visita_fotos enable row level security;

drop policy if exists "visita_fotos_autenticados" on visita_fotos;
create policy "visita_fotos_autenticados" on visita_fotos
  for all to authenticated using (true) with check (true);

grant all on table visita_fotos to authenticated;

notify pgrst, 'reload schema';
