-- Avisos por dia no cardápio (ex.: FERIADO, RECESSO), como vêm da planilha,
-- para a folha das famílias mostrar que naquele dia não haverá aula.
alter table cardapios add column if not exists avisos jsonb not null default '[]'::jsonb;
