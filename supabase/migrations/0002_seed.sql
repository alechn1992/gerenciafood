-- Seed: tipos de refeição e banco de pratos inicial.

insert into tipos_refeicao (id, nome, ordem) values
  ('cafe', 'Café da manhã', 1),
  ('almoco', 'Almoço', 2),
  ('lanche_tarde', 'Lanche da tarde', 3),
  ('jantar', 'Jantar', 4),
  ('ceia', 'Ceia', 5)
on conflict (id) do nothing;

insert into pratos (nome, categoria, restricoes) values
  ('Frango grelhado', 'proteina', '["sem_gluten","sem_lactose"]'),
  ('Frango ao molho', 'proteina', '[]'),
  ('Carne assada', 'proteina', '["sem_gluten"]'),
  ('Bife acebolado', 'proteina', '["sem_gluten","sem_lactose"]'),
  ('Carne moída refogada', 'proteina', '["sem_gluten"]'),
  ('Peixe ao forno', 'proteina', '["sem_gluten","sem_lactose"]'),
  ('Iscas de frango', 'proteina', '[]'),
  ('Omelete', 'proteina', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Ovo mexido', 'proteina', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Estrogonofe de frango', 'proteina', '[]'),
  ('Farofa', 'guarnicao', '["sem_lactose"]'),
  ('Batata sauté', 'guarnicao', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Legumes refogados', 'guarnicao', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Purê de batata', 'guarnicao', '["sem_gluten","vegetariano"]'),
  ('Macarrão ao alho e óleo', 'guarnicao', '["sem_lactose","vegetariano"]'),
  ('Arroz branco', 'acompanhamento', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Arroz integral', 'acompanhamento', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Feijão carioca', 'acompanhamento', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Feijão preto', 'acompanhamento', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Salada verde', 'salada', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Salada de tomate', 'salada', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Salada de repolho', 'salada', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Salada de beterraba', 'salada', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Salada de cenoura', 'salada', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Fruta da estação', 'sobremesa', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Gelatina', 'sobremesa', '["sem_gluten"]'),
  ('Doce de leite', 'sobremesa', '["sem_gluten"]'),
  ('Pudim', 'sobremesa', '["sem_gluten"]'),
  ('Suco de laranja', 'bebida', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Suco de uva', 'bebida', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Café', 'bebida', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Pão com manteiga', 'lanche', '["vegetariano"]'),
  ('Bolo simples', 'lanche', '["vegetariano"]'),
  ('Tapioca', 'lanche', '["sem_gluten","sem_lactose","vegetariano"]'),
  ('Sanduíche natural', 'lanche', '[]')
on conflict do nothing;
