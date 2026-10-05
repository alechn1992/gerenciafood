import { execSync } from 'node:child_process';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Commit do build: o Vercel informa por variável; localmente, pelo git. */
function commitAtual(): string {
  const doVercel = process.env.VERCEL_GIT_COMMIT_SHA;
  if (doVercel) return doVercel.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'local';
  }
}

const versao = {
  commit: commitAtual(),
  geradaEm: new Date().toISOString(),
};
const idVersao = `${versao.commit}-${versao.geradaEm}`;

/**
 * Publica /version.json com a mesma identificação embutida no app. O app
 * aberto no navegador compara as duas para saber que saiu uma versão nova.
 */
function arquivoDeVersao(): Plugin {
  return {
    name: 'gerenciafood-versao',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ id: idVersao, ...versao }),
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), arquivoDeVersao()],
  define: {
    __APP_VERSION__: JSON.stringify({ id: idVersao, ...versao }),
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
