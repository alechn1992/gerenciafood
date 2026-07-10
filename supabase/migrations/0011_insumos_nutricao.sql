-- Adiciona campos de nutrição e peso por unidade ao insumo.
alter table insumos
  add column if not exists nutricao    jsonb,
  add column if not exists peso_gramas numeric;
