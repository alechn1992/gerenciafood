-- Insumos (matérias-primas) com preço, usados para custear receitas.

create table if not exists insumos (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  unidade        text not null check (unidade in ('kg','g','l','ml','un','dz','pct')),
  preco_unitario numeric(10,2) not null default 0,
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now()
);
