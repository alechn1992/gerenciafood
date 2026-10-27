// Tema da interface (claro / escuro). A escolha fica neste navegador; em
// "automático" segue a configuração do celular ou do computador. O index.html
// aplica o tema antes de a página aparecer, para não piscar branco.

export type PreferenciaTema = 'automatico' | 'claro' | 'escuro';
export type Tema = 'claro' | 'escuro';

const CHAVE = 'gerenciafood:tema';

export function lerPreferencia(): PreferenciaTema {
  try {
    const v = localStorage.getItem(CHAVE);
    if (v === 'claro' || v === 'escuro' || v === 'automatico') return v;
  } catch {
    // Navegação privada ou armazenamento bloqueado: usa o padrão.
  }
  return 'automatico';
}

function sistemaEscuro(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function resolverTema(pref: PreferenciaTema): Tema {
  if (pref === 'automatico') return sistemaEscuro() ? 'escuro' : 'claro';
  return pref;
}

export function aplicarTema(pref: PreferenciaTema): Tema {
  const tema = resolverTema(pref);
  document.documentElement.dataset.tema = tema;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', tema === 'escuro' ? '#111915' : '#f6f9f7');
  return tema;
}

export function salvarPreferencia(pref: PreferenciaTema) {
  try {
    localStorage.setItem(CHAVE, pref);
  } catch {
    // Sem armazenamento: o tema vale só até fechar a aba.
  }
}
