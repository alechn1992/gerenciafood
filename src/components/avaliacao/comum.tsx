// Pedaços comuns das telas de avaliação nutricional.

import type { Classificacao } from '../../domain/antropometria';

/** Hoje no fuso do aparelho (yyyy-mm-dd). */
export const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const dataBr = (iso: string) => iso.split('-').reverse().join('/');
export const num = (n: number, casas = 1) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
export const ultimoDe = <T,>(lista: T[] | undefined, deTras = 1): T | undefined =>
  lista ? lista[lista.length - deTras] : undefined;
/** "12,6" ou "12.6" → 12.6 (vazio → NaN). */
export const lerDecimal = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')));

export function Selo({ c, curto }: { c?: Classificacao; curto?: boolean }) {
  if (!c) return <span className="subtitulo">—</span>;
  const rotulo = curto ? c.rotulo.replace(/ para a idade$/, '').replace(/^Estatura adequada$/, 'Adequada') : c.rotulo;
  return (
    <span className={`selo-nutri ${c.situacao}`} title={c.rotulo}>
      {rotulo}
    </span>
  );
}

/** Idade curta para tabelas: "3a 7m", "11m". */
export function idadeCurta(nascimento: string, data: string): string {
  const [a1, m1, d1] = nascimento.split('-').map(Number);
  const [a2, m2, d2] = data.split('-').map(Number);
  let meses = (a2 - a1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
  if (meses < 0) meses = 0;
  const anos = Math.floor(meses / 12);
  return anos === 0 ? `${meses}m` : `${anos}a ${meses % 12}m`;
}

/** Conferência de peso e altura digitados (vazio não é erro). */
export function problemasDaMedida(pesoKg: number, alturaCm: number): string[] {
  const p: string[] = [];
  if (!Number.isNaN(pesoKg) && !(pesoKg >= 1 && pesoKg <= 150)) p.push('Peso fora do esperado (1 a 150 kg).');
  if (!Number.isNaN(alturaCm) && !(alturaCm >= 40 && alturaCm <= 200)) p.push('Altura fora do esperado (40 a 200 cm).');
  return p;
}
