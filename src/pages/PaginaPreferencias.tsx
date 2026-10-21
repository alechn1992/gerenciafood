// Cadastro de restrições/preferências alimentares. As cadastradas aqui somam-se
// às padrão e aparecem nas turmas, no cadastro do cliente e no Receituário.

import { useData } from '../state/DataContext';
import { RESTRICOES_DISPONIVEIS } from '../data/seed';
import { CadastroDeOpcoes } from './CadastroDeOpcoes';

export function PaginaPreferencias() {
  const { preferencias, erroPreferencias, turmas, clientes, pratos, salvarPreferencia, removerPreferencia } =
    useData();

  /** Onde a preferência está marcada — para avisar antes de excluir. */
  const usos = (valor: string) =>
    [
      [turmas.filter((t) => t.restricoes.includes(valor)).length, 'turma(s)'],
      [clientes.filter((c) => c.restricoes.includes(valor)).length, 'cliente(s)'],
      [pratos.filter((p) => p.restricoes.includes(valor)).length, 'prato(s)'],
    ]
      .filter(([n]) => n)
      .map(([n, o]) => `${n} ${o}`);

  return (
    <CadastroDeOpcoes
      titulo="Preferências alimentares"
      descricao="Restrições e preferências disponíveis nas turmas, no cadastro do cliente e no Receituário (ex.: Sem ovo, Sem carne suína, APLV)."
      placeholder="Ex.: Sem ovo"
      rotulo="preferência"
      padrao={RESTRICOES_DISPONIVEIS}
      itens={preferencias}
      erroCarregar={erroPreferencias}
      migracao="0019_preferencias_alimentares.sql"
      usos={usos}
      salvar={salvarPreferencia}
      remover={removerPreferencia}
    />
  );
}
