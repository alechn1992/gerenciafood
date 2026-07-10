const formatador = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Formata um número como moeda brasileira (ex.: 12.5 → "R$ 12,50"). */
export function formatarMoeda(valor: number): string {
  return formatador.format(valor || 0);
}
