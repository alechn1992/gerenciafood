// Avaliação da turma inteira de uma vez: a nutricionista escolhe a turma e a
// data e digita peso e altura de cada criança numa tabela só. Quem ficar em
// branco (faltou, não pesou) simplesmente não é lançado.

import { useMemo, useState } from 'react';
import {
  avaliarMedida,
  classificarEstatura,
  classificarImc,
  idadeEmDias,
  idadePorExtenso,
  type TabelasOms,
} from '../../domain/antropometria';
import { GRUPOS_CRIANCA, SEM_GRUPO, type Avaliada } from '../../domain/relatorioNutricional';
import type { Crianca, MedidaAntropometrica } from '../../domain/types';
import { dataBr, hoje, lerDecimal, num, problemasDaMedida, Selo, ultimoDe } from './comum';

interface Linha {
  peso: string;
  altura: string;
  forma?: 'deitado' | 'em_pe';
}

export function AvaliarTurma({
  criancas,
  avaliadas,
  tabelas,
  grupoInicial,
  onSalvar,
}: {
  criancas: Crianca[];
  avaliadas: Map<string, Avaliada[]>;
  tabelas: TabelasOms;
  grupoInicial: string;
  onSalvar: (medidas: MedidaAntropometrica[]) => Promise<void>;
}) {
  const [grupo, setGrupo] = useState(grupoInicial || GRUPOS_CRIANCA[0]);
  const [data, setData] = useState(hoje());
  const [linhas, setLinhas] = useState<Record<string, Linha>>({});
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const daTurma = useMemo(
    () =>
      criancas
        .filter((c) => (grupo === SEM_GRUPO ? !c.grupo : c.grupo === grupo))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [criancas, grupo],
  );

  const contagemPorGrupo = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of criancas) m.set(c.grupo || SEM_GRUPO, (m.get(c.grupo || SEM_GRUPO) ?? 0) + 1);
    return m;
  }, [criancas]);

  const atualizar = (id: string, campos: Partial<Linha>) =>
    setLinhas((l) => ({ ...l, [id]: { ...(l[id] ?? { peso: '', altura: '' }), ...campos } }));

  const futuro = data > hoje();
  const calculo = daTurma.map((c) => {
    const l = linhas[c.id] ?? { peso: '', altura: '' };
    const pesoKg = lerDecimal(l.peso);
    const alturaCm = lerDecimal(l.altura);
    const dias = idadeEmDias(c.dataNascimento, data);
    const forma = l.forma ?? (dias < 731 ? 'deitado' : 'em_pe');
    const problemas = problemasDaMedida(pesoKg, alturaCm);
    if (dias < 0) problemas.push('Data anterior ao nascimento.');
    const preenchida = l.peso.trim() !== '' || l.altura.trim() !== '';
    const completa = !Number.isNaN(pesoKg) && !Number.isNaN(alturaCm);
    if (preenchida && !completa) problemas.push('Preencha peso e altura.');
    const ok = completa && problemas.length === 0;
    const r = ok ? avaliarMedida(tabelas, c.sexo, c.dataNascimento, { data, pesoKg, alturaCm, forma }) : undefined;
    return { c, l, pesoKg, alturaCm, forma, dias, problemas, preenchida, ok, r };
  });
  const prontas = calculo.filter((x) => x.ok);
  const comProblema = calculo.filter((x) => x.preenchida && !x.ok);

  const salvar = async () => {
    if (prontas.length === 0 || comProblema.length > 0 || futuro) return;
    setSalvando(true);
    setMsg(null);
    try {
      const agora = new Date().toISOString();
      await onSalvar(
        prontas.map((x) => ({
          id: crypto.randomUUID(),
          criancaId: x.c.id,
          data,
          pesoKg: x.pesoKg,
          alturaCm: x.alturaCm,
          forma: x.forma,
          criadoEm: agora,
        })),
      );
      setLinhas({});
      setMsg({ ok: true, texto: `${prontas.length} avaliação(ões) salva(s) em ${dataBr(data)}.` });
    } catch (e) {
      setMsg({ ok: false, texto: e instanceof Error ? e.message : 'Não foi possível salvar.' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Avaliar a turma</h3>
      <p className="subtitulo" style={{ marginTop: 0 }}>
        Lance peso e altura de todas as crianças da turma de uma vez. Quem ficar em branco não é lançado (faltou ou não
        foi medido). Cada lançamento entra no histórico da criança, então dá para reavaliar todo mês, trimestre ou
        semestre.
      </p>
      <div className="form-medida" style={{ marginBottom: 12 }}>
        <div>
          <label htmlFor="at-grupo">Turma</label>
          <select id="at-grupo" value={grupo} onChange={(e) => { setGrupo(e.target.value); setLinhas({}); setMsg(null); }}>
            {GRUPOS_CRIANCA.map((g) => (
              <option key={g} value={g}>
                {g} ({contagemPorGrupo.get(g) ?? 0})
              </option>
            ))}
            {(contagemPorGrupo.get(SEM_GRUPO) ?? 0) > 0 && (
              <option value={SEM_GRUPO}>Sem turma ({contagemPorGrupo.get(SEM_GRUPO)})</option>
            )}
          </select>
        </div>
        <div>
          <label htmlFor="at-data">Data da avaliação</label>
          <input id="at-data" type="date" max={hoje()} value={data} onChange={(e) => setData(e.target.value)} />
          {futuro && <small className="erro-campo">A data não pode ser no futuro.</small>}
        </div>
      </div>

      {daTurma.length === 0 ? (
        <p className="vazio">Nenhuma criança nesta turma. Cadastre em "Crianças" e escolha a turma no cadastro.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="tabela-avaliar-turma">
            <thead>
              <tr>
                <th>Criança</th>
                <th>Idade</th>
                <th>Última avaliação</th>
                <th>Peso (kg)</th>
                <th>Altura (cm)</th>
                <th>Medida</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {calculo.map(({ c, l, forma, dias, problemas, r }) => {
                const ult = ultimoDe(avaliadas.get(c.id));
                return (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.nome}</strong>
                    </td>
                    <td>{dias >= 0 ? idadePorExtenso(c.dataNascimento, data) : '—'}</td>
                    <td className="subtitulo">
                      {ult ? `${dataBr(ult.medida.data)} · ${num(ult.medida.pesoKg, 2)} kg · ${num(ult.medida.alturaCm)} cm` : '—'}
                    </td>
                    <td>
                      <input
                        aria-label={`Peso de ${c.nome}`}
                        inputMode="decimal"
                        className="campo-curto"
                        placeholder={ult ? num(ult.medida.pesoKg, 1) : 'kg'}
                        value={l.peso}
                        onChange={(e) => atualizar(c.id, { peso: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Altura de ${c.nome}`}
                        inputMode="decimal"
                        className="campo-curto"
                        placeholder={ult ? num(ult.medida.alturaCm, 1) : 'cm'}
                        value={l.altura}
                        onChange={(e) => atualizar(c.id, { altura: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        aria-label={`Como ${c.nome} foi medida`}
                        value={forma}
                        onChange={(e) => atualizar(c.id, { forma: e.target.value as 'deitado' | 'em_pe' })}
                      >
                        <option value="deitado">Deitada</option>
                        <option value="em_pe">Em pé</option>
                      </select>
                    </td>
                    <td>
                      {problemas.length > 0 ? (
                        <small className="erro-campo">{problemas.join(' ')}</small>
                      ) : r ? (
                        <span className="resultado-linha">
                          IMC {num(r.imc)}{' '}
                          {r.zImc !== undefined && <Selo c={classificarImc(r.zImc, r.meses)} />}{' '}
                          {r.zEstatura !== undefined && r.zEstatura < -2 && <Selo c={classificarEstatura(r.zEstatura)} />}
                        </span>
                      ) : (
                        <span className="subtitulo">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="acoes" style={{ marginTop: 12, alignItems: 'center' }}>
        <button
          className="btn"
          disabled={salvando || prontas.length === 0 || comProblema.length > 0 || futuro}
          onClick={salvar}
        >
          {salvando ? 'Salvando…' : `💾 Salvar ${prontas.length || ''} avaliação(ões)`}
        </button>
        {comProblema.length > 0 && (
          <span className="erro-campo">Corrija {comProblema.length} linha(s) antes de salvar.</span>
        )}
        {msg && (
          <span className={msg.ok ? 'login-aviso sucesso' : 'login-aviso erro'} style={{ margin: 0 }}>
            {msg.texto}
          </span>
        )}
      </div>
    </div>
  );
}
