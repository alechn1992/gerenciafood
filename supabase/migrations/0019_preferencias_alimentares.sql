-- Restrições/preferências alimentares cadastradas pela nutricionista, além das
-- padrão (sem glúten, sem lactose, vegetariano, vegano). Aparecem nas turmas,
-- no cadastro do cliente e no Receituário.

create table if not exists preferencias_alimentares (
  valor      text primary key,   -- identificador estável, ex.: 'sem_ovo'
  nome       text not null,      -- rótulo exibido, ex.: 'Sem ovo'
  criado_em  timestamptz not null default now()
);

alter table preferencias_alimentares enable row level security;

drop policy if exists "preferencias_alimentares_autenticados" on preferencias_alimentares;
create policy "preferencias_alimentares_autenticados" on preferencias_alimentares
  for all to authenticated using (true) with check (true);

grant all on table preferencias_alimentares to authenticated;

notify pgrst, 'reload schema';
