// Seletor de mês da lista de semanas salvas: abre no mês atual e permite ver
// outro mês ou todos, para a lista não crescer sem fim.

import { useMemo, useState } from 'react';
import { mesDaSemana, mesesDasSemanas, mesInicialDaLista, rotuloMes } from '../domain/cozinhaMensal';

export const TODOS_OS_MESES = 'todos';

export function useFiltroMes(semanas: string[]) {
  const chave = semanas.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const meses = useMemo(() => mesesDasSemanas(semanas), [chave]);
  const [escolha, setEscolha] = useState<string | null>(null);
  const automatico = mesInicialDaLista(meses) ?? TODOS_OS_MESES;
  // Se o mês escolhido ficou sem semanas (ex.: excluídas), volta ao automático.
  const mes = escolha && (escolha === TODOS_OS_MESES || meses.includes(escolha)) ? escolha : automatico;
  const mostra = (semanaInicio: string) => mes === TODOS_OS_MESES || mesDaSemana(semanaInicio) === mes;
  return { meses, mes, setMes: setEscolha, mostra };
}

export function SeletorMesSemanas({
  meses,
  mes,
  onChange,
  semanas,
  rascunhoEm,
}: {
  meses: string[];
  mes: string;
  onChange: (mes: string) => void;
  /** Todas as semanas (segundas-feiras) da lista, para as contagens. */
  semanas: string[];
  /** Quantas semanas em rascunho há em um mês (opcional). */
  rascunhoEm?: (mes: string) => number;
}) {
  if (meses.length <= 1) return null;
  const quantas = (m: string) => semanas.filter((s) => mesDaSemana(s) === m).length;
  const visiveis = mes === TODOS_OS_MESES ? semanas.length : quantas(mes);
  return (
    <div className="seletor-mes-semanas">
      <label htmlFor="mes-semanas">Mês</label>
      <select id="mes-semanas" value={mes} onChange={(e) => onChange(e.target.value)}>
        {meses.map((m) => {
          const r = rascunhoEm?.(m) ?? 0;
          return (
            <option key={m} value={m}>
              {rotuloMes(m)} — {quantas(m)} semana(s){r > 0 ? `, ${r} em rascunho` : ''}
            </option>
          );
        })}
        <option value={TODOS_OS_MESES}>Todos os meses — {semanas.length} semana(s)</option>
      </select>
      <span className="seletor-mes-semanas-info">
        {visiveis} de {semanas.length}
      </span>
    </div>
  );
}
