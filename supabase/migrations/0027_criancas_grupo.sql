-- Turma real de cada criança na avaliação nutricional (Berçário, Infantil 1 ...
-- Infantil 5). As turmas de cardápio continuam só para montar o cardápio.

alter table criancas add column if not exists grupo text;

create index if not exists criancas_grupo_idx on criancas (cliente_id, grupo);

notify pgrst, 'reload schema';
