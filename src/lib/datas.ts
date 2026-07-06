/** Retorna a segunda-feira (ISO yyyy-mm-dd) da semana que contém `base`. */
export function segundaFeiraDaSemana(base = new Date()): string {
  const d = new Date(base);
  const dia = d.getDay(); // 0=dom
  const diff = dia === 0 ? -6 : 1 - dia; // volta até segunda
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Formata uma data ISO (yyyy-mm-dd) como dd/mm/yyyy. */
export function formatarData(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}
