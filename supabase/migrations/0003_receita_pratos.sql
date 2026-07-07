-- Ficha técnica (receita) por prato: ingredientes, modo de preparo, rendimento e tempo.
alter table pratos add column if not exists receita jsonb;
