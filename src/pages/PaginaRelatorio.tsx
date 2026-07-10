import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import type { Cliente, Relatorio } from '../domain/types';
import {
  CHECKLIST_BOAS_PRATICAS,
  CHECKLIST_CEI_SESA_162,
  POPS_OBRIGATORIOS,
  REFERENCIAS_NORMATIVAS,
} from '../domain/legislacao';
import { formatarData } from '../lib/datas';
import { supabase } from '../lib/supabase';

type Situacao = 'conforme' | 'nao_conforme' | 'na' | '';

function lerImagemComoDataURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export function RelatorioCliente({ cliente }: { cliente: Cliente }) {
  const { repo } = useData();
  const [respostas, setRespostas] = useState<Record<string, Situacao>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [avaliador, setAvaliador] = useState(cliente.responsavel ?? '');
  const [dataAval, setDataAval] = useState(new Date().toISOString().slice(0, 10));
  const [ehCei, setEhCei] = useState(false);
  const [logo, setLogo] = useState(cliente.logo ?? '');
  const [registroCRN, setRegistroCRN] = useState(cliente.registroProfissional ?? '');
  const relatorioIdRef = useRef<string>(crypto.randomUUID());

  // estado de UI
  const [salvando, setSalvando] = useState(false);
  const [msgSalvar, setMsgSalvar] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [modalEmail, setModalEmail] = useState(false);
  const [emailDest, setEmailDest] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [msgEmail, setMsgEmail] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  // Carrega o último relatório salvo para este cliente
  useEffect(() => {
    repo.carregarRelatorio(cliente.id).then((rel) => {
      if (!rel) return;
      relatorioIdRef.current = rel.id;
      setAvaliador(rel.avaliador);
      setRegistroCRN(rel.registroCRN);
      setEhCei(rel.ehCei);
      setDataAval(rel.dataAvaliacao);
      setRespostas(rel.respostas as Record<string, Situacao>);
      setObservacoes(rel.observacoes);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.id]);

  const blocosAtivos = ehCei
    ? [...CHECKLIST_BOAS_PRATICAS, ...CHECKLIST_CEI_SESA_162]
    : CHECKLIST_BOAS_PRATICAS;

  const itensTotais = blocosAtivos.flatMap((b) => b.itens);
  const respondidos = itensTotais.filter((i) => respostas[i.id] && respostas[i.id] !== '');
  const conformes = itensTotais.filter((i) => respostas[i.id] === 'conforme');
  const naoConformes = itensTotais.filter((i) => respostas[i.id] === 'nao_conforme');
  const aplicaveis = itensTotais.filter((i) => respostas[i.id] && respostas[i.id] !== 'na');
  const indice =
    aplicaveis.length > 0 ? Math.round((conformes.length / aplicaveis.length) * 100) : 0;

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setLogo(await lerImagemComoDataURL(file));
    e.target.value = '';
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>, itemId: string) {
    const file = e.target.files?.[0];
    if (file) {
      const url = await lerImagemComoDataURL(file);
      setFotos((p) => ({ ...p, [itemId]: url }));
    }
    e.target.value = '';
  }

  async function handleSalvar() {
    setSalvando(true);
    setMsgSalvar(null);
    try {
      const rel: Relatorio = {
        id: relatorioIdRef.current,
        clienteId: cliente.id,
        avaliador,
        registroCRN,
        ehCei,
        dataAvaliacao: dataAval,
        respostas,
        observacoes,
        geradoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      await repo.salvarRelatorio(rel);
      setMsgSalvar({ tipo: 'ok', texto: 'Relatório salvo com sucesso.' });
    } catch {
      setMsgSalvar({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setMsgSalvar(null), 4000);
    }
  }

  async function handleEnviarEmail() {
    if (!emailDest.trim()) return;
    if (!supabase) {
      setMsgEmail({ tipo: 'erro', texto: 'Envio por e-mail requer modo Supabase.' });
      return;
    }
    setEnviando(true);
    setMsgEmail(null);
    try {
      const itens = itensTotais.map((item) => ({
        texto: item.texto,
        referencia: item.referencia ?? '',
        situacao: respostas[item.id] ?? '',
        observacao: observacoes[item.id] ?? '',
      }));
      const { data, error } = await supabase.functions.invoke('enviar-relatorio', {
        body: {
          destinatario: emailDest.trim(),
          clienteNome: cliente.nome,
          avaliador,
          registroCRN,
          dataAvaliacao: formatarData(dataAval),
          indice,
          conformes: conformes.length,
          naoConformes: naoConformes.length,
          itens,
        },
      });
      if (error) {
        // Tenta extrair a mensagem real retornada pela Edge Function
        let msg = 'Falha ao enviar.';
        try {
          const body = typeof error.context?.json === 'function'
            ? await error.context.json()
            : null;
          if (body?.error) msg = body.error;
          else if (error.message) msg = error.message;
        } catch { /* ignora */ }
        setMsgEmail({ tipo: 'erro', texto: msg });
        return;
      }
      if (data?.error) {
        setMsgEmail({ tipo: 'erro', texto: data.error });
        return;
      }
      setMsgEmail({ tipo: 'ok', texto: `E-mail enviado para ${emailDest}.` });
      setEmailDest('');
      setTimeout(() => { setModalEmail(false); setMsgEmail(null); }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado.';
      setMsgEmail({ tipo: 'erro', texto: msg });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      {/* Barra de ações */}
      <div className="linha no-print" style={{ marginBottom: 16 }}>
        <div>
          {msgSalvar && (
            <span
              className={msgSalvar.tipo === 'ok' ? 'login-aviso sucesso' : 'login-aviso erro'}
              style={{ display: 'inline-block', margin: 0, padding: '6px 14px' }}
            >
              {msgSalvar.texto}
            </span>
          )}
        </div>
        <div className="acoes">
          <button className="btn secundario" onClick={handleSalvar} disabled={salvando}>
            {salvando ? 'Salvando…' : '💾 Salvar rascunho'}
          </button>
          <button className="btn secundario" onClick={() => { setModalEmail(true); setMsgEmail(null); }}>
            ✉️ Enviar por e-mail
          </button>
        </div>
      </div>

      {/* Modal de envio por e-mail */}
      {modalEmail && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalEmail(false); }}
        >
          <div className="card" style={{ width: 420, margin: 0 }}>
            <div className="linha" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Enviar relatório por e-mail</h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                onClick={() => setModalEmail(false)}
              >✕</button>
            </div>
            <label>E-mail do destinatário</label>
            <input
              type="email"
              placeholder="nutricionista@empresa.com"
              value={emailDest}
              onChange={(e) => setEmailDest(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnviarEmail()}
              style={{ marginBottom: 12 }}
            />
            {msgEmail && (
              <div
                className={msgEmail.tipo === 'ok' ? 'login-aviso sucesso' : 'login-aviso erro'}
                style={{ marginBottom: 12 }}
              >
                {msgEmail.texto}
              </div>
            )}
            <div className="acoes" style={{ justifyContent: 'flex-end' }}>
              <button className="btn secundario" onClick={() => setModalEmail(false)}>Cancelar</button>
              <button className="btn" onClick={handleEnviarEmail} disabled={enviando || !emailDest.trim()}>
                {enviando ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tipo de estabelecimento */}
      <div className="card no-print">
        <div className="linha">
          <div>
            <strong>Tipo de estabelecimento</strong>
            <p className="subtitulo" style={{ margin: '4px 0 0' }}>
              Ative para incluir o checklist da{' '}
              <strong>Resolução SESA-PR nº 0162/2005</strong> (norma sanitária
              específica para Centros de Educação Infantil — CEI).
            </p>
          </div>
          <span
            className={`chip ${ehCei ? 'on' : ''}`}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={() => setEhCei((v) => !v)}
          >
            {ehCei ? '✓ ' : ''}Centro de Educação Infantil (CEI)
          </span>
        </div>
      </div>

      {/* Cabeçalho do relatório */}
      <div className="card">
        <div className="relatorio-cabecalho">
          <div className="relatorio-logo-area">
            {logo ? (
              <>
                <img src={logo} className="relatorio-logo" alt="Logo da empresa" />
                <button
                  className="btn secundario pequeno no-print"
                  style={{ marginTop: 6 }}
                  onClick={() => setLogo('')}
                >
                  Remover
                </button>
              </>
            ) : (
              <label className="relatorio-logo-placeholder no-print">
                <span style={{ fontSize: '1.4rem' }}>🏢</span>
                <span>Adicionar logo</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleLogoUpload}
                />
              </label>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div className="grid cols-2">
              <div>
                <h2 style={{ margin: '0 0 4px' }}>{cliente.nome}</h2>
                <div style={{ color: 'var(--cinza)' }}>
                  {cliente.cnpj && <div>CNPJ: {cliente.cnpj}</div>}
                  {cliente.responsavel && <div>Responsável: {cliente.responsavel}</div>}
                  <div>
                    {cliente.cidade ? `${cliente.cidade}/` : ''}
                    {cliente.uf}
                  </div>
                </div>
              </div>
              <div className="grid cols-2">
                <div>
                  <label>Avaliador</label>
                  <input
                    className="no-print"
                    value={avaliador}
                    onChange={(e) => setAvaliador(e.target.value)}
                  />
                  {avaliador && (
                    <div className="somente-print" style={{ fontWeight: 500, paddingTop: 2 }}>
                      {avaliador}
                    </div>
                  )}
                </div>
                <div>
                  <label>Data da avaliação</label>
                  <input
                    type="date"
                    className="no-print"
                    value={dataAval}
                    onChange={(e) => setDataAval(e.target.value)}
                  />
                  <div className="somente-print" style={{ fontWeight: 500, paddingTop: 2 }}>
                    {formatarData(dataAval)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores */}
      <div className="card">
        <div className="grid cols-3">
          <Indicador titulo="Índice de conformidade" valor={`${indice}%`} destaque />
          <Indicador titulo="Conformes" valor={`${conformes.length}`} />
          <Indicador
            titulo="Não conformes"
            valor={`${naoConformes.length}`}
            alerta={naoConformes.length > 0}
          />
        </div>
        <p className="subtitulo" style={{ marginTop: 12, marginBottom: 0 }}>
          {respondidos.length} de {itensTotais.length} itens avaliados. Índice calculado
          sobre os itens aplicáveis (exclui "N/A").
        </p>
      </div>

      {/* Checklists */}
      {blocosAtivos.map((bloco) => (
        <div key={bloco.titulo} className="card">
          <h3 style={{ marginTop: 0 }}>{bloco.titulo}</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ width: 160 }}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {bloco.itens.map((item) => (
                <tr key={item.id} className="relatorio-item-linha">
                  <td>
                    <div>{item.texto}</div>
                    <div style={{ color: 'var(--cinza)', fontSize: '0.78rem', marginTop: 2 }}>
                      {item.referencia}
                    </div>
                    <div
                      className="no-print"
                      style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}
                    >
                      <input
                        placeholder="Observação (opcional)"
                        value={observacoes[item.id] ?? ''}
                        onChange={(e) =>
                          setObservacoes((p) => ({ ...p, [item.id]: e.target.value }))
                        }
                        style={{ flex: 1 }}
                      />
                      <label className="foto-btn" title="Adicionar foto">
                        📷
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFotoUpload(e, item.id)}
                        />
                      </label>
                      {fotos[item.id] && (
                        <button
                          className="btn perigo pequeno"
                          style={{ padding: '4px 8px' }}
                          onClick={() => setFotos((p) => { const n = { ...p }; delete n[item.id]; return n; })}
                          title="Remover foto"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {observacoes[item.id] && (
                      <div className="somente-print" style={{ fontSize: '0.82rem', marginTop: 4 }}>
                        Obs.: {observacoes[item.id]}
                      </div>
                    )}
                    {fotos[item.id] && (
                      <div style={{ marginTop: 6 }}>
                        <img
                          src={fotos[item.id]}
                          className="relatorio-foto-item"
                          alt="Foto evidência"
                        />
                      </div>
                    )}
                  </td>
                  <td style={{ verticalAlign: 'top', paddingTop: 12 }}>
                    <div className="no-print">
                      <SeletorSituacao
                        valor={respostas[item.id] ?? ''}
                        onChange={(v) => setRespostas((p) => ({ ...p, [item.id]: v }))}
                      />
                    </div>
                    <div className="somente-print">
                      <BadgeSituacao situacao={respostas[item.id] ?? ''} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* POPs */}
      <div className="card print-ocultar">
        <h3 style={{ marginTop: 0 }}>POPs obrigatórios (RDC 216/2004, item 4.11.2)</h3>
        <ul>
          {POPS_OBRIGATORIOS.map((pop) => (
            <li key={pop}>{pop}</li>
          ))}
        </ul>
      </div>

      {/* Assinatura */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Responsável técnico</h3>
        <div className="no-print grid cols-2" style={{ marginBottom: 20 }}>
          <div>
            <label>Nome completo</label>
            <input value={avaliador} onChange={(e) => setAvaliador(e.target.value)} />
          </div>
          <div>
            <label>Registro profissional (CRN / CFTA / CREF)</label>
            <input value={registroCRN} onChange={(e) => setRegistroCRN(e.target.value)} />
          </div>
        </div>
        <div className="assinatura-bloco">
          <div className="assinatura-campo">
            <div className="assinatura-linha">{avaliador}</div>
            <div className="assinatura-rotulo">Nome / Responsável Técnico</div>
          </div>
          <div className="assinatura-campo">
            <div className="assinatura-linha">{registroCRN}</div>
            <div className="assinatura-rotulo">Registro profissional</div>
          </div>
          <div className="assinatura-campo">
            <div className="assinatura-linha" />
            <div className="assinatura-rotulo">Assinatura</div>
          </div>
          <div className="assinatura-campo">
            <div className="assinatura-linha">{formatarData(dataAval)}</div>
            <div className="assinatura-rotulo">Data</div>
          </div>
        </div>
      </div>

      {/* Referências */}
      <div className="card print-ocultar">
        <h3 style={{ marginTop: 0 }}>Referências normativas</h3>
        <table>
          <thead>
            <tr>
              <th>Norma</th>
              <th>Âmbito</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {REFERENCIAS_NORMATIVAS.map((r) => (
              <tr key={r.sigla}>
                <td>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer">
                      {r.sigla}
                    </a>
                  ) : (
                    r.sigla
                  )}
                </td>
                <td>{r.ambito}</td>
                <td>{r.titulo}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="subtitulo" style={{ marginTop: 12, marginBottom: 0 }}>
          Material de apoio operacional; não substitui a íntegra das normas nem a fiscalização
          da vigilância sanitária.
        </p>
      </div>
    </>
  );
}

export function PaginaRelatorio() {
  const { id } = useParams();
  const { clientes } = useData();
  const cliente = clientes.find((c) => c.id === id);

  if (!cliente) {
    return (
      <div className="card vazio">
        Cliente não encontrado. <Link to="/clientes">Voltar</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="linha no-print">
        <div>
          <h1>Relatório de segurança dos alimentos</h1>
          <p className="subtitulo">
            Checklist de Boas Práticas — RDC ANVISA nº 216/2004 e normas do Paraná.
          </p>
        </div>
        <div className="acoes">
          <Link to="/clientes" className="btn secundario">← Voltar</Link>
          <button className="btn" onClick={() => window.print()}>🖨️ Imprimir / PDF</button>
        </div>
      </div>
      <RelatorioCliente cliente={cliente} />
    </div>
  );
}

function Indicador({
  titulo, valor, destaque, alerta,
}: {
  titulo: string; valor: string; destaque?: boolean; alerta?: boolean;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--borda)',
        borderRadius: 10,
        padding: 16,
        textAlign: 'center',
        background: destaque ? 'var(--verde-claro)' : alerta ? 'var(--alerta-bg)' : 'var(--branco)',
      }}
    >
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: alerta ? 'var(--alerta)' : 'var(--verde-escuro)' }}>
        {valor}
      </div>
      <div style={{ color: 'var(--cinza)', fontSize: '0.85rem' }}>{titulo}</div>
    </div>
  );
}

function SeletorSituacao({ valor, onChange }: { valor: Situacao; onChange: (v: Situacao) => void }) {
  const opcoes: { v: Situacao; label: string }[] = [
    { v: 'conforme', label: 'Conforme' },
    { v: 'nao_conforme', label: 'Não conf.' },
    { v: 'na', label: 'N/A' },
  ];
  return (
    <div className="chips">
      {opcoes.map((o) => (
        <span
          key={o.v}
          className={`chip ${valor === o.v ? 'on' : ''}`}
          onClick={() => onChange(valor === o.v ? '' : o.v)}
        >
          {o.label}
        </span>
      ))}
    </div>
  );
}

function BadgeSituacao({ situacao }: { situacao: Situacao }) {
  if (situacao === 'conforme')
    return <span className="badge-situacao badge-conforme">✓ Conforme</span>;
  if (situacao === 'nao_conforme')
    return <span className="badge-situacao badge-nao-conforme">✗ Não conforme</span>;
  if (situacao === 'na')
    return <span className="badge-situacao badge-na">◌ N/A</span>;
  return <span className="badge-situacao badge-vazio">—</span>;
}
