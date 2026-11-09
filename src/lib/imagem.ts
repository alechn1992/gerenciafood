// Fotos tiradas no celular passam de 3–5 MB. Antes de guardar, reduzimos para
// no máximo 1280 px no lado maior, em JPEG: fica com ~100–250 KB e continua
// nítida no relatório impresso.

const LADO_MAX = 1280;
const QUALIDADE = 0.72;

function lerComoDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function carregar(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível abrir a imagem.'));
    img.src = src;
  });
}

/** Imagem reduzida em JPEG (data URL). Se o navegador não abrir o formato, devolve o original. */
export async function comprimirImagem(file: File, ladoMax = LADO_MAX, qualidade = QUALIDADE): Promise<string> {
  const original = await lerComoDataURL(file);
  try {
    const img = await carregar(original);
    const escala = Math.min(1, ladoMax / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * escala));
    const h = Math.max(1, Math.round(img.naturalHeight * escala));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.fillStyle = '#fff'; // PNG com transparência não fica preto no JPEG
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const jpeg = canvas.toDataURL('image/jpeg', qualidade);
    return jpeg.length < original.length ? jpeg : original;
  } catch {
    return original;
  }
}
