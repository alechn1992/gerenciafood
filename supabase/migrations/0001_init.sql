-- GerenciaFood — schema inicial
-- Serviços de alimentação: clientes, banco de pratos, tipos de refeição e cardápios.

create extension if not exists "pgcrypto";

create table if not exists tipos_refeicao (
  id    text primary key,
  nome  text not null,
  ordem int  not null default 0
);

create table if not exists pratos (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  categoria  text not null check (categoria in
             ('proteina','guarnicao','acompanhamento','salada','sobremesa','bebida','lanche','outro')),
  restricoes jsonb not null default '[]'::jsonb,
  tags       jsonb not null default '[]'::jsonb,
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

create table if not exists clientes (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  cnpj          text,
  responsavel   text,
  cidade        text,
  uf            text not null default 'PR',
  dias_operacao jsonb not null default '[]'::jsonb, -- ex.: [1,2,3,4,5]
  refeicoes     jsonb not null default '[]'::jsonb, -- RefeicaoConfig[]
  restricoes    jsonb not null default '[]'::jsonb,
  observacoes   text,
  criado_em     timestamptz not null default now()
);

create table if not exists cardapios (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references clientes(id) on delete cascade,
  semana_inicio date not null,
  itens         jsonb not null default '[]'::jsonb, -- ItemCardapio[]
  gerado_em     timestamptz not null default now()
);

create index if not exists idx_cardapios_cliente on cardapios(cliente_id);
create index if not exists idx_pratos_categoria on pratos(categoria);

-- Observação sobre RLS:
-- Habilite Row Level Security e políticas conforme o modelo de autenticação
-- escolhido antes de expor o projeto em produção. Ex.:
--   alter table clientes enable row level security;
--   create policy "acesso autenticado" on clientes
--     for all to authenticated using (true) with check (true);
