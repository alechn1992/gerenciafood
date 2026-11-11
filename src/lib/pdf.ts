// Gera, no navegador, o PDF de um trecho da tela no mesmo formato da impressão
// (A4, sempre claro, sem botões). Usado para mandar o relatório por e-mail como
// anexo e para baixar o arquivo. A biblioteca só é carregada quando usada.

/**
 * Regras de impressão aplicadas à cópia que a biblioteca monta para o PDF (ela
 * não usa @media print). Ficam presas ao contêiner dela, para valerem já no
 * cálculo das quebras de página e sem mexer na tela. As cores são as do tema
 * claro, mesmo com o modo escuro ligado.
 */
const CSS_COMO_IMPRESSAO = `
  .html2pdf__container {
    color-scheme: light;
    --verde: #1f7a4d; --verde-claro: #e8f5ee; --verde-escuro: #145636;
    --verde-texto: #1f7a4d; --verde-hover: #145636; --texto: #1c2b24;
    --cinza: #6b7d74; --borda: #d8e3dc; --fundo: #f6f9f7; --branco: #ffffff;
    --alerta: #b4531a; --alerta-bg: #fdf1e7; --sombra: none;
    --tom-sup: initial; --tom-sup-verde: initial; --tom-borda: initial;
    --tom-neutro-texto: initial; --tom-amarelo-bg: initial; --tom-amarelo-borda: initial;
    --tom-amarelo-texto: initial; --tom-laranja-borda: initial; --tom-laranja-bg: initial;
    --tom-laranja-texto: initial; --tom-rosa-bg: initial; --tom-rosa-texto: initial;
    --tom-vermelho-bg: initial; --tom-vermelho-borda: initial; --tom-vermelho-texto: initial;
    --tom-verde-bg: initial; --tom-verde-texto: initial; --tom-azul-bg: initial; --tom-azul-texto: initial;
    background: #fff;
    color: #1c2b24;
  }
  .html2pdf__container .no-print, .html2pdf__container .print-ocultar { display: none !important; }
  .html2pdf__container .somente-print, .html2pdf__container .print-only { display: block !important; }
  .html2pdf__container .fotos-item-foto img { width: 58mm; height: 44mm; }
`;

function garantirEstilo() {
  if (document.getElementById('estilo-pdf')) return;
  const estilo = document.createElement('style');
  estilo.id = 'estilo-pdf';
  estilo.textContent = CSS_COMO_IMPRESSAO;
  document.head.appendChild(estilo);
}

export interface ArquivoPdf {
  nome: string;
  blob: Blob;
  /** Conteúdo em base64 (sem o prefixo data:), para anexar no e-mail. */
  base64: string;
}

export async function gerarPdf(elemento: HTMLElement, nome: string): Promise<ArquivoPdf> {
  const { default: html2pdf } = await import('html2pdf.js');
  garantirEstilo();
  const opcoes = {
    margin: [8, 8, 10, 8],
    filename: nome,
    image: { type: 'jpeg', quality: 0.9 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      onclone: (doc: Document) => {
        // Na cópia que vira imagem, o tema também é o claro.
        doc.documentElement.dataset.tema = 'claro';
      },
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
    // Não corta um item, uma foto ou a assinatura no meio da página.
    pagebreak: {
      mode: ['css', 'legacy'],
      avoid: [
        '.relatorio-visita-item',
        '.relatorio-visita-secao-header',
        '.relatorio-visita-cabecalho tr',
        '.relatorio-visita-obs',
        '.relatorio-visita-proxima',
        '.assinatura-bloco',
        '.relatorio-visita-rodape',
      ],
    },
  };
  // As opções de quebra de página não estão no tipo da biblioteca.
  const worker = html2pdf();
  const blob: Blob = await worker
    .set(opcoes as unknown as Parameters<typeof worker.set>[0])
    .from(elemento)
    .outputPdf('blob');
  const base64 = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
  return { nome, blob, base64 };
}

/** Baixa o PDF no aparelho. */
export function baixarPdf(arquivo: ArquivoPdf) {
  const url = URL.createObjectURL(arquivo.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = arquivo.nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Nome de arquivo sem acentos nem símbolos: "Relatorio-visita-Escola-Ponte-do-Saber-2026-11-09.pdf". */
export function nomeArquivo(...partes: string[]): string {
  const limpo = partes
    .join('-')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${limpo}.pdf`;
}
