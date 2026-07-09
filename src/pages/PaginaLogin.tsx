import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

type Modo = 'login' | 'cadastro' | 'recuperar';

export function PaginaLogin() {
  const [modo, setModo] = useState<Modo>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  const limpar = () => { setErro(''); setMensagem(''); };

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    limpar();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) setErro(traduzirErro(error.message));
  };

  const cadastrar = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    limpar();
    if (senha.length < 6) { setErro('A senha deve ter ao menos 6 caracteres.'); return; }
    setCarregando(true);
    const { error } = await supabase.auth.signUp({ email, password: senha });
    setCarregando(false);
    if (error) { setErro(traduzirErro(error.message)); return; }
    setMensagem('Conta criada! Verifique seu e-mail para confirmar o cadastro, depois faça login.');
    setModo('login');
  };

  const recuperar = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    limpar();
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    setCarregando(false);
    if (error) { setErro(traduzirErro(error.message)); return; }
    setMensagem('E-mail de recuperação enviado. Verifique sua caixa de entrada.');
  };

  const titulo = { login: 'Entrar', cadastro: 'Criar conta', recuperar: 'Recuperar senha' }[modo];
  const submit = { login: entrar, cadastro: cadastrar, recuperar: recuperar }[modo];

  return (
    <div className="login-tela">
      <div className="login-card">
        <div className="login-marca">
          <span className="login-icone">🍽️</span>
          <span className="login-nome">GerenciaFood</span>
        </div>

        <h2 className="login-titulo">{titulo}</h2>

        {mensagem && <div className="login-aviso sucesso">{mensagem}</div>}
        {erro && <div className="login-aviso erro">{erro}</div>}

        <form onSubmit={submit} className="login-form">
          <div className="login-campo">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoFocus
            />
          </div>

          {modo !== 'recuperar' && (
            <div className="login-campo">
              <label htmlFor="login-senha">Senha</label>
              <input
                id="login-senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={modo === 'cadastro' ? 'Mínimo 6 caracteres' : '••••••••'}
                required
                minLength={modo === 'cadastro' ? 6 : undefined}
              />
            </div>
          )}

          <button type="submit" className="btn login-btn" disabled={carregando}>
            {carregando ? 'Aguarde…' : titulo}
          </button>
        </form>

        <div className="login-links">
          {modo === 'login' && (
            <>
              <button className="link-btn" onClick={() => { limpar(); setModo('recuperar'); }}>
                Esqueci minha senha
              </button>
              <button className="link-btn" onClick={() => { limpar(); setModo('cadastro'); }}>
                Criar conta
              </button>
            </>
          )}
          {modo !== 'login' && (
            <button className="link-btn" onClick={() => { limpar(); setModo('login'); }}>
              Voltar para o login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function traduzirErro(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.';
  if (msg.includes('Password should be at least')) return 'A senha deve ter ao menos 6 caracteres.';
  if (msg.includes('Unable to validate email address')) return 'E-mail inválido.';
  if (msg.includes('Email rate limit exceeded')) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (msg.includes('Signups not allowed')) return 'Cadastro de novos usuários está desativado.';
  return msg;
}
