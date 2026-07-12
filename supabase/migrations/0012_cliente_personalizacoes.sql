-- Adiciona colunas de personalização por cliente:
--   exclusoes   → palavras-chave que excluem pratos do cardápio
--   pratos_fixos → slots dia/refeição/categoria com prato pré-acordado

alter table clientes
  add column if not exists exclusoes   jsonb not null default '[]'::jsonb,
  add column if not exists pratos_fixos jsonb not null default '[]'::jsonb;
