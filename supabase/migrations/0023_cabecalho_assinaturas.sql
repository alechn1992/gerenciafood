-- Cabeçalho completo do checklist (hora, tipo, e-mail, objetivo, próxima
-- avaliação) e assinaturas dos relatórios (padrão do profissional, desenhada
-- na tela ou em branco), no checklist e na visita.

alter table relatorios
  add column if not exists cabecalho jsonb not null default '{}'::jsonb;

alter table visitas
  add column if not exists assinaturas jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
