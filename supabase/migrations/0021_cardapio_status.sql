-- Status da semana de cardápio: 'rascunho' (ainda em montagem, não vai para as
-- famílias) ou 'concluido'. Os cardápios já salvos ficam como concluídos.

alter table cardapios
  add column if not exists status text not null default 'concluido'
  check (status in ('rascunho', 'concluido'));

notify pgrst, 'reload schema';
