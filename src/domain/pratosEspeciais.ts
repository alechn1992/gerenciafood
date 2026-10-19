// Reconhecimento de itens que não são "pratos" comuns no cardápio.

/** Leite materno, fórmula infantil, fórmula especial APLV, mamadas. */
export function ehFormula(nome: string): boolean {
  return /leite\s+materno|f[óo]rmula|mamada|mamadeira/i.test(nome);
}

/**
 * Itens de ocasião (aniversariantes do mês, dia da culinária, festas): fazem
 * sentido na semana em que aconteceram, não num cardápio gerado depois.
 */
export function ehItemDeEvento(nome: string): boolean {
  return /aniversariante|dia\s+d[aoe]\s+culin[áa]ria|festa|confraterniza|p[áa]scoa|natal(ino)?\b|junin/i.test(nome);
}
