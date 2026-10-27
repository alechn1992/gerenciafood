// Editor compacto de uma ação corretiva, usado ao lado do item não conforme
// no checklist e na visita.

import type { AcaoCorretiva, StatusAcao } from '../domain/types';
import { situacaoAcao } from '../domain/planoAcao';
import { formatarData } from '../lib/datas';
import { hojeISO } from '../state/usePlanoAcao';

export const ROTULO_SITUACAO: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluída',
  atrasada: 'Atrasada',
};

export function SeloSituacao({ acao }: { acao: AcaoCorretiva }) {
  const s = situacaoAcao(acao, hojeISO());
  return <span className={`selo-acao ${s}`}>{ROTULO_SITUACAO[s]}</span>;
}

export function AcaoInline({
  acao,
  onChange,
}: {
  /** Ausente: a ação ainda não foi criada (é criada ao preencher). */
  acao?: AcaoCorretiva;
  onChange: (campos: Partial<AcaoCorretiva>) => void;
}) {
  return (
    <div className="acao-inline no-print">
      <div className="acao-inline-titulo">
        <strong>Plano de ação</strong>
        {acao ? <SeloSituacao acao={acao} /> : <span className="selo-acao pendente">Pendente</span>}
        {acao?.resolvidoEm && (
          <span style={{ fontSize: 12, color: 'var(--cinza)' }}>
            Conforme em {formatarData(acao.resolvidoEm)}
          </span>
        )}
      </div>
      <div className="acao-inline-campos">
        <textarea
          rows={1}
          value={acao?.acao ?? ''}
          onChange={(e) => onChange({ acao: e.target.value })}
          placeholder="Ação corretiva: o que será feito para ficar conforme…"
          aria-label="Ação corretiva"
        />
        <input
          value={acao?.responsavel ?? ''}
          onChange={(e) => onChange({ responsavel: e.target.value })}
          placeholder="Responsável"
          aria-label="Responsável"
        />
        <input
          type="date"
          value={acao?.prazo ?? ''}
          onChange={(e) => onChange({ prazo: e.target.value })}
          aria-label="Prazo"
          title="Prazo"
        />
        <select
          value={acao?.status ?? 'pendente'}
          onChange={(e) => onChange({ status: e.target.value as StatusAcao })}
          aria-label="Status"
        >
          <option value="pendente">Pendente</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluido">Concluída</option>
        </select>
      </div>
    </div>
  );
}
