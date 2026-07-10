-- Adiciona campos de embalagem ao insumo para cálculo automático do preço unitário.

alter table insumos
  add column if not exists qtd_embalagem  numeric(10,3) not null default 1,
  add column if not exists preco_embalagem numeric(10,2) not null default 0;

-- Inicializa preco_embalagem com o valor unitário existente (qtd=1, logo unitário=embalagem).
update insumos
   set preco_embalagem = preco_unitario
 where preco_embalagem = 0 and preco_unitario > 0;
