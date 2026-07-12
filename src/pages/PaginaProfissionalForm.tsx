import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../state/DataContext';
import type { Profissional } from '../domain/types';

function lerImagem(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

const vazio = (): Profissional => ({
  id: crypto.randomUUID(),
  nome: '',
  email: '',
  telefone: '',
  registroCRN: '',
  especialidade: '',
  empresa: '',
  cargo: '',
  logoEmpresa: undefined,
  assinatura: undefined,
  criadoEm: new Date().toISOString(),
});

export function PaginaProfissionalForm() {
  const { id } = useParams<{ id: string }>();
  const { profissionais, salvarProfissional } = useData();
  const navigate = useNavigate();
  const [form, setForm] = useState<Profissional>(vazio());
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const inputAssinatura = useRef<HTMLInputElement>(null);
  const inputLogo = useRef<HTMLInputElement>(null);

  const editando = !!id;

  useEffect(() => {
    if (editando) {
      const p = profissionais.find((x) => x.id === id);
      if (p) setForm(p);
    }
  }, [id, profissionais, editando]);

  const set = (campo: keyof Profissional) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function handleAssinatura(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setForm((f) => ({ ...f, assinatura: undefined }));
    if (file) {
      const url = await lerImagem(file);
      setForm((f) => ({ ...f, assinatura: url }));
    }
    e.target.value = '';
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = await lerImagem(file);
      setForm((f) => ({ ...f, logoEmpresa: url }));
    }
    e.target.value = '';
  }

  async function salvar() {
    if (!form.nome.trim()) {
      setMsg({ tipo: 'erro', texto: 'O nome é obrigatório.' });
      return;
    }
    setSalvando(true);
    try {
      await salvarProfissional({
        ...form,
        nome: form.nome.trim(),
        email: form.email?.trim() || undefined,
        telefone: form.telefone?.trim() || undefined,
        registroCRN: form.registroCRN?.trim() || undefined,
        especialidade: form.especialidade?.trim() || undefined,
        empresa: form.empresa?.trim() || undefined,
        cargo: form.cargo?.trim() || undefined,
      });
      setMsg({ tipo: 'ok', texto: 'Profissional salvo.' });
      setTimeout(() => navigate('/profissionais'), 1200);
    } catch (err: unknown) {
      const detalhe = err instanceof Error ? err.message : JSON.stringify(err);
      setMsg({ tipo: 'erro', texto: `Erro: ${detalhe}` });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <div className="linha" style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>{editando ? 'Editar profissional' : 'Novo profissional'}</h2>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--cinza)' }}>
          Dados pessoais
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Nome completo *</label>
            <input value={form.nome} onChange={set('nome')} placeholder="Ex: Dra. Ana Lima" />
          </div>
          <div>
            <label>Registro CRN / CFTA</label>
            <input value={form.registroCRN ?? ''} onChange={set('registroCRN')} placeholder="Ex: CRN-8 12345" />
          </div>
          <div>
            <label>Especialidade</label>
            <input value={form.especialidade ?? ''} onChange={set('especialidade')} placeholder="Ex: Nutrição clínica" />
          </div>
          <div>
            <label>E-mail</label>
            <input type="email" value={form.email ?? ''} onChange={set('email')} placeholder="email@exemplo.com" />
          </div>
          <div>
            <label>Telefone / WhatsApp</label>
            <input value={form.telefone ?? ''} onChange={set('telefone')} placeholder="(41) 9 9999-9999" />
          </div>
        </div>

        <h3 style={{ marginTop: 24, marginBottom: 16, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--cinza)' }}>
          Empresa (para terceirizados)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label>Nome da empresa</label>
            <input value={form.empresa ?? ''} onChange={set('empresa')} placeholder="Ex: NutriConsult Ltda." />
          </div>
          <div>
            <label>Cargo</label>
            <input value={form.cargo ?? ''} onChange={set('cargo')} placeholder="Ex: Nutricionista responsável" />
          </div>
        </div>

        {/* Logo da empresa */}
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Logo da empresa</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {form.logoEmpresa ? (
              <img
                src={form.logoEmpresa}
                alt="Logo"
                style={{ maxHeight: 64, maxWidth: 180, objectFit: 'contain', border: '1px solid var(--borda)', borderRadius: 4, padding: 4 }}
              />
            ) : (
              <div style={{ width: 120, height: 60, border: '1px dashed var(--borda)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--cinza)' }}>
                Sem logo
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn pequeno secundario" onClick={() => inputLogo.current?.click()}>
                {form.logoEmpresa ? '🔄 Alterar logo' : '📷 Enviar logo'}
              </button>
              {form.logoEmpresa && (
                <button type="button" className="btn pequeno perigo" onClick={() => setForm((f) => ({ ...f, logoEmpresa: undefined }))}>
                  Remover
                </button>
              )}
            </div>
            <input ref={inputLogo} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--cinza)', margin: '4px 0 0' }}>
            PNG, JPG ou SVG. Aparece no cabeçalho dos relatórios.
          </p>
        </div>

        <h3 style={{ marginTop: 24, marginBottom: 16, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--cinza)' }}>
          Assinatura digital
        </h3>

        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {form.assinatura ? (
              <img
                src={form.assinatura}
                alt="Assinatura"
                style={{ maxHeight: 80, maxWidth: 240, objectFit: 'contain', border: '1px solid var(--borda)', borderRadius: 4, padding: 4, background: 'white' }}
              />
            ) : (
              <div style={{ width: 200, height: 70, border: '1px dashed var(--borda)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--cinza)' }}>
                Sem assinatura
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn pequeno secundario" onClick={() => inputAssinatura.current?.click()}>
                {form.assinatura ? '🔄 Alterar assinatura' : '✍️ Enviar assinatura'}
              </button>
              {form.assinatura && (
                <button type="button" className="btn pequeno perigo" onClick={() => setForm((f) => ({ ...f, assinatura: undefined }))}>
                  Remover
                </button>
              )}
            </div>
            <input ref={inputAssinatura} type="file" accept="image/png,image/jpeg,image/gif" style={{ display: 'none' }} onChange={handleAssinatura} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--cinza)', margin: '4px 0 0' }}>
            PNG com fundo transparente recomendado. Aparece no rodapé dos relatórios.
          </p>
        </div>

        <div className="acoes" style={{ marginTop: 24 }}>
          <button className="btn secundario" onClick={() => navigate('/profissionais')}>Cancelar</button>
          <button className="btn" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : '💾 Salvar'}
          </button>
          {msg && (
            <span className={msg.tipo === 'ok' ? 'login-aviso sucesso' : 'login-aviso erro'} style={{ alignSelf: 'center' }}>
              {msg.texto}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
