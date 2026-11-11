-- Avaliação nutricional: crianças de cada cliente e as aferições de peso e
-- altura. Os escores-z e a classificação são calculados no sistema (curvas da
-- OMS), não guardados: assim uma correção na medida já corrige tudo.

create table if not exists criancas (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid not null references clientes(id) on delete cascade,
  turma_id         uuid references turmas(id) on delete set null,
  nome             text not null,
  data_nascimento  date not null,
  sexo             text not null check (sexo in ('M', 'F')),
  observacoes      text,
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now()
);

create index if not exists criancas_cliente_idx on criancas (cliente_id, nome);

create table if not exists medidas_antropometricas (
  id           uuid primary key default gen_random_uuid(),
  crianca_id   uuid not null references criancas(id) on delete cascade,
  data         date not null,
  peso_kg      numeric(6, 3) not null check (peso_kg > 0),
  altura_cm    numeric(5, 1) not null check (altura_cm > 0),
  forma        text not null default 'em_pe' check (forma in ('deitado', 'em_pe')),
  observacoes  text,
  criado_em    timestamptz not null default now()
);

create index if not exists medidas_antropometricas_crianca_idx on medidas_antropometricas (crianca_id, data);

alter table criancas enable row level security;
alter table medidas_antropometricas enable row level security;

drop policy if exists "criancas_autenticados" on criancas;
create policy "criancas_autenticados" on criancas
  for all to authenticated using (true) with check (true);

drop policy if exists "medidas_antropometricas_autenticados" on medidas_antropometricas;
create policy "medidas_antropometricas_autenticados" on medidas_antropometricas
  for all to authenticated using (true) with check (true);

grant all on table criancas to authenticated;
grant all on table medidas_antropometricas to authenticated;

notify pgrst, 'reload schema';
