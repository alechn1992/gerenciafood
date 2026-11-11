-- Fotos dos itens do checklist de boas práticas. Mesmo modelo de
-- visita_fotos: tabela própria, lida só ao abrir o checklist.

create table if not exists relatorio_fotos (
  id            uuid primary key default gen_random_uuid(),
  relatorio_id  uuid not null references relatorios(id) on delete cascade,
  item_id       text not null,           -- id do item do checklist
  imagem        text not null,           -- JPEG reduzido, em data URL
  criado_em     timestamptz not null default now()
);

create index if not exists relatorio_fotos_relatorio_idx on relatorio_fotos (relatorio_id);

alter table relatorio_fotos enable row level security;

drop policy if exists "relatorio_fotos_autenticados" on relatorio_fotos;
create policy "relatorio_fotos_autenticados" on relatorio_fotos
  for all to authenticated using (true) with check (true);

grant all on table relatorio_fotos to authenticated;

notify pgrst, 'reload schema';
