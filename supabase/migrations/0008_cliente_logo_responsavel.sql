-- Adiciona logo e registro profissional ao cliente para uso automático no relatório.

alter table clientes
  add column if not exists logo               text,
  add column if not exists registro_profissional text;
