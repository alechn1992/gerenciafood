// Destino dos links de convite e de recuperação de senha.
//
// Nos dois fluxos o Supabase redireciona para cá com a sessão já estabelecida
// (o cliente lê o token do hash da URL), mas o usuário ainda não tem senha
// utilizável: sem esta tela o convidado entraria uma vez e nunca mais
// conseguiria fazer login.

import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function PaginaDefinirSenha() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [pronto, setPronto] = useState(false);
  const [temSessao, setTemSessao] = useState<boolean | null>(null);

  // O Supabase processa o token do hash de forma assíncrona; esperamos o
  // evento em vez de ler a sessão imediatamente, senão haveria corrida.
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setTemSessao(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      setTemSessao(!!sessao);
    });

    // Sem sessão após um tempo razoável, o link expirou ou já foi usado.
    const t = setTimeout(() => setTemSessao((v) => (v === null ? false : v)), 3000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setErro('');

    if (senha.length < 6) {
      setErro('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      setErro('As senhas não conferem.');
      return;
    }

    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);

    if (error) {
      setErro(
        error.message.includes('Password should be at least')
          ? 'A senha deve ter ao menos 6 caracteres.'
          : error.message,
      );
      return;
    }

    setPronto(true);
    setTimeout(() => navigate('/', { replace: true }), 1500);
  };

  return (
    <div className="login-tela">
      <div className="login-card">
        <div className="login-marca">
          <span className="login-icone">🍽️</span>
          <span className="login-nome">GerenciaFood</span>
        </div>

        <h2 className="login-titulo">Definir senha</h2>

        {temSessao === false && (
          <>
            <div className="login-aviso erro">
              Este link expirou ou já foi utilizado. Peça um novo convite ao
              administrador, ou use "Esqueci minha senha" na tela de login.
            </div>
            <div className="login-links">
              <button className="link-btn" onClick={() => navigate('/login', { replace: true })}>
                Ir para o login
              </button>
            </div>
          </>
        )}

        {temSessao === null && <p className="login-aviso">Validando o link…</p>}

        {temSessao === true && pronto && (
          <div className="login-aviso sucesso">
            Senha definida! Redirecionando…
          </div>
        )}

        {temSessao === true && !pronto && (
          <>
            <p className="login-aviso">
              Escolha uma senha para acessar o sistema daqui em diante.
            </p>

            {erro && <div className="login-aviso erro">{erro}</div>}

            <form onSubmit={salvar} className="login-form">
              <div className="login-campo">
                <label htmlFor="ds-senha">Nova senha</label>
                <input
                  id="ds-senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>

              <div className="login-campo">
                <label htmlFor="ds-confirmacao">Confirmar senha</label>
                <input
                  id="ds-confirmacao"
                  type="password"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" className="btn login-btn" disabled={carregando}>
                {carregando ? 'Aguarde…' : 'Salvar senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
