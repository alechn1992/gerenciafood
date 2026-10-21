// Cadastro de categorias de prato. As cadastradas aqui somam-se às padrão e
// aparecem no Receituário, na composição das refeições e na grade do cardápio.

import { useData } from '../state/DataContext';
import { CATEGORIAS_PRATO, type RefeicaoConfig } from '../domain/types';
import { CadastroDeOpcoes } from './CadastroDeOpcoes';

const usaNaComposicao = (refeicoes: RefeicaoConfig[], valor: string) =>
  refeicoes.some((r) => r.composicao.some((c) => c.categoria === valor));

export function PaginaCategorias() {
  const { categorias, erroCategorias, pratos, turmas, clientes, salvarCategoria, removerCategoria } = useData();

  // Um prato ou uma composição com categoria excluída ficaria sem categoria
  // válida, por isso a exclusão é bloqueada enquanto houver uso.
  const usos = (valor: string) =>
    [
      [pratos.filter((p) => p.categoria === valor).length, 'prato(s)'],
      [turmas.filter((t) => usaNaComposicao(t.refeicoes, valor)).length, 'turma(s)'],
      [clientes.filter((c) => usaNaComposicao(c.refeicoes, valor)).length, 'cliente(s)'],
    ]
      .filter(([n]) => n)
      .map(([n, o]) => `${n} ${o}`);

  return (
    <CadastroDeOpcoes
      titulo="Categorias de prato"
      descricao="Categorias disponíveis no Receituário e na composição das refeições de clientes e turmas (ex.: Fruta, Papinha, Sopa)."
      placeholder="Ex.: Fruta"
      rotulo="categoria"
      padrao={CATEGORIAS_PRATO}
      itens={categorias}
      erroCarregar={erroCategorias}
      migracao="0020_categorias_prato.sql"
      usos={usos}
      bloquearExclusaoEmUso
      salvar={salvarCategoria}
      remover={removerCategoria}
    />
  );
}
