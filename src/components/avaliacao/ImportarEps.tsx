// Importa as crianças do GerenciaEPS (FinanceDesk): busca os alunos pela API,
// mostra o que é novo, o que mudou de turma e a quantidade de alunos por turma,
// e só grava o que a nutricionista marcar.

import { useMemo, useState } from 'react';
import {
  criancaDaLinha,
  lerAlunosEps,
  planejarImportacao,
  type LinhaImportacao,
  type PlanoImportacao,
  type SituacaoImportacao,
} from '../../domain/importacaoEps';
import { GRUPOS_CRIANCA } from '../../domain/relatorioNutricional';
import type { Crianca } from '../../domain/types';
import { dataBr } from './comum';

const ROTULO_SITUACAO: Record<SituacaoImportacao, string> = {
  nova: 'Nova',
  'mudou-turma': 'Mudou de turma',
  'ja-cadastrada': 'Já cadastrada',
  'sem-nascimento': 'Sem data de nascimento',
};

interface Edicao {
  marcada: boolean;
  grupo?: string;
  sexo: 'M' | 'F';
}

export function ImportarEps({
  clienteId,
  criancas,
  buscar,
  onImportar,
  onFechar,
}: {
  clienteId: string;
  criancas: Crianca[];
  /** Busca a lista crua de alunos (função do Supabase). */
  buscar: () => Promise<unknown[]>;
  onImportar: (novas: Crianca[]) => Promise<void>;
  onFechar: () => void;
}) {
  const [plano, setPlano] = useState<PlanoImportacao | null>(null);
  const [edicao, setEdicao] = useState<Edicao[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [verTodas, setVerTodas] = useState(false);

  const carregar = async () => {
    setBuscando(true);
    setMsg(null);
    try {
      const p = planejarImportacao(lerAlunosEps(await buscar()), criancas);
      setPlano(p);
      setEdicao(
        p.linhas.map((l) => ({
          marcada: (l.situacao === 'nova' && !!l.grupo) || l.situacao === 'mudou-turma',
          grupo: l.grupo,
          sexo: l.sexo,
        })),
      );
    } catch (e) {
      setMsg({ ok: false, texto: e instanceof Error ? e.message : 'Não foi possível buscar os alunos.' });
    } finally {
      setBuscando(false);
    }
  };

  const contagem = useMemo(() => {
    const c: Record<SituacaoImportacao, number> = { nova: 0, 'mudou-turma': 0, 'ja-cadastrada': 0, 'sem-nascimento': 0 };
    plano?.linhas.forEach((l) => c[l.situacao]++);
    return c;
  }, [plano]);

  const editar = (i: number, campos: Partial<Edicao>) =>
    setEdicao((lista) => lista.map((e, j) => (j === i ? { ...e, ...campos } : e)));

  const importaveis = (l: LinhaImportacao) => l.situacao === 'nova' || l.situacao === 'mudou-turma';
  const marcadas = plano ? plano.linhas.filter((l, i) => importaveis(l) && edicao[i]?.marcada) : [];

  const importar = async () => {
    if (!plano || marcadas.length === 0) return;
    setSalvando(true);
    setMsg(null);
    try {
      const agora = new Date().toISOString();
      const lista = plano.linhas
        .map((l, i) =>
          importaveis(l) && edicao[i].marcada
            ? criancaDaLinha({ ...l, grupo: edicao[i].grupo, sexo: edicao[i].sexo }, clienteId, agora, () => crypto.randomUUID())
            : null,
        )
        .filter((c): c is Crianca => !!c);
      await onImportar(lista);
      const novas = lista.filter((c) => !criancas.some((x) => x.id === c.id)).length;
      const trocas = lista.length - novas;
      setMsg({
        ok: true,
        texto: [novas ? `${novas} criança(s) importada(s)` : '', trocas ? `${trocas} turma(s) atualizada(s)` : '']
          .filter(Boolean)
          .join(' · '),
      });
      setPlano(null);
      setEdicao([]);
    } catch (e) {
      setMsg({ ok: false, texto: e instanceof Error ? e.message : 'Não foi possível importar.' });
    } finally {
      setSalvando(false);
    }
  };

  const visiveis = plano
    ? plano.linhas.map((l, i) => ({ l, i })).filter(({ l }) => verTodas || l.situacao !== 'ja-cadastrada')
    : [];
  const temPalpite = plano?.linhas.some((l, i) => l.sexoPalpite && edicao[i]?.marcada);

  return (
    <div className="card no-print importar-eps">
      <div className="linha" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0 }}>📥 Importar do GerenciaEPS</h3>
          <p className="subtitulo" style={{ margin: '4px 0 0' }}>
            Busca os alunos ativos no GerenciaEPS com nome, data de nascimento e turma. Você confere antes de importar;
            nada é apagado aqui.
          </p>
        </div>
        <button className="btn secundario" onClick={onFechar}>
          Fechar
        </button>
      </div>

      <div className="acoes" style={{ marginTop: 12, alignItems: 'center' }}>
        <button className="btn" onClick={carregar} disabled={buscando || salvando}>
          {buscando ? 'Buscando…' : plano ? '🔄 Buscar de novo' : '🔎 Buscar alunos no GerenciaEPS'}
        </button>
        {msg && (
          <span className={msg.ok ? 'login-aviso sucesso' : 'login-aviso erro'} style={{ margin: 0 }}>
            {msg.texto}
          </span>
        )}
      </div>

      {plano && (
        <>
          <div className="resumo-nutri" style={{ marginTop: 14 }}>
            <span className="agenda-nutri nunca">Novas: {contagem.nova}</span>
            <span className="agenda-nutri vence">Mudaram de turma: {contagem['mudou-turma']}</span>
            <span className="agenda-nutri em-dia">Já cadastradas: {contagem['ja-cadastrada']}</span>
            {contagem['sem-nascimento'] > 0 && (
              <span className="agenda-nutri atrasada">Sem data de nascimento: {contagem['sem-nascimento']}</span>
            )}
            {plano.inativos > 0 && <span className="resumo-nutri-texto">Inativos ignorados: {plano.inativos}</span>}
          </div>

          <h4 style={{ margin: '6px 0' }}>Turmas e quantidade de alunos no GerenciaEPS</h4>
          <ul className="turmas-eps">
            {plano.porTurmaEps.map((t) => (
              <li key={t.turma}>
                <strong>{t.turma}</strong>
                <span>{t.n} aluno(s)</span>
                <small className={t.grupo ? 'subtitulo' : 'erro-campo'}>
                  {t.grupo ? `→ ${t.grupo}` : '→ escolha a turma em cada criança'}
                </small>
              </li>
            ))}
          </ul>

          {plano.linhas.length === 0 ? (
            <p className="vazio">Nenhum aluno ativo veio do GerenciaEPS.</p>
          ) : (
            <>
              <label className="opcao-inline" style={{ margin: '10px 0' }}>
                <input type="checkbox" checked={verTodas} onChange={(e) => setVerTodas(e.target.checked)} />
                Mostrar também as já cadastradas
              </label>
              <div style={{ overflowX: 'auto' }}>
                <table className="tabela-importar">
                  <thead>
                    <tr>
                      <th>
                        <span className="sr-only">Importar</span>
                      </th>
                      <th>Criança</th>
                      <th>Nascimento</th>
                      <th>Turma no EPS</th>
                      <th>Turma aqui</th>
                      <th>Sexo</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map(({ l, i }) => {
                      const e = edicao[i];
                      const pode = importaveis(l);
                      return (
                        <tr key={`${l.aluno.nome}-${l.aluno.dataNascimento}-${i}`} className={pode ? '' : 'linha-apagada'}>
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Importar ${l.aluno.nome}`}
                              disabled={!pode}
                              checked={pode && e.marcada}
                              onChange={(ev) => editar(i, { marcada: ev.target.checked })}
                            />
                          </td>
                          <td>{l.aluno.nome}</td>
                          <td>{l.aluno.dataNascimento ? dataBr(l.aluno.dataNascimento) : '—'}</td>
                          <td>{l.aluno.turmaEps || '—'}</td>
                          <td>
                            {pode ? (
                              <select
                                aria-label={`Turma de ${l.aluno.nome}`}
                                value={e.grupo ?? ''}
                                onChange={(ev) => editar(i, { grupo: ev.target.value || undefined })}
                              >
                                <option value="">Sem turma</option>
                                {GRUPOS_CRIANCA.map((g) => (
                                  <option key={g} value={g}>
                                    {g}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              l.existente?.grupo ?? '—'
                            )}
                            {l.situacao === 'mudou-turma' && (
                              <small className="subtitulo"> (era {l.existente?.grupo ?? 'sem turma'})</small>
                            )}
                          </td>
                          <td>
                            {l.situacao === 'nova' ? (
                              <select
                                aria-label={`Sexo de ${l.aluno.nome}`}
                                className={l.sexoPalpite ? 'campo-conferir' : ''}
                                value={e.sexo}
                                onChange={(ev) => editar(i, { sexo: ev.target.value as 'M' | 'F' })}
                              >
                                <option value="F">Feminino</option>
                                <option value="M">Masculino</option>
                              </select>
                            ) : l.sexo === 'F' ? (
                              'Feminino'
                            ) : (
                              'Masculino'
                            )}
                          </td>
                          <td>
                            <span className={`situacao-importar ${l.situacao}`}>{ROTULO_SITUACAO[l.situacao]}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {temPalpite && (
                <p className="aviso" style={{ marginTop: 10 }}>
                  O GerenciaEPS não informa o sexo: ele foi sugerido pelo primeiro nome (campos em amarelo). Confira,
                  porque as curvas de crescimento são diferentes para meninos e meninas.
                </p>
              )}
              {contagem['sem-nascimento'] > 0 && (
                <p className="subtitulo">
                  Crianças sem data de nascimento no GerenciaEPS não podem ser importadas: cadastre a data lá e busque de
                  novo, ou cadastre aqui em "+ Nova criança".
                </p>
              )}
              <div className="acoes" style={{ marginTop: 12 }}>
                <button className="btn" onClick={importar} disabled={salvando || marcadas.length === 0}>
                  {salvando ? 'Importando…' : `📥 Importar ${marcadas.length} criança(s)`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
