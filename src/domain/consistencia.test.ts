import { describe, it, expect } from 'vitest';
import { aceitaConsistencia, aplicarConsistencia, consistenciaDe, consistenciaSugerida, nomeBase } from './consistencia';
import type { ItemCardapio } from './types';

const item = (pratoNome: string, categoria = 'sobremesa'): ItemCardapio => ({
  dia: 1, tipoRefeicaoId: 'cafe', categoria, pratoId: 'x', pratoNome,
});

describe('consistência das frutas', () => {
  it('acrescenta a consistência com a concordância certa', () => {
    expect(aplicarConsistencia('Banana', 'amassada')).toBe('Banana amassada');
    expect(aplicarConsistencia('Mamão', 'amassada')).toBe('Mamão amassado');
    expect(aplicarConsistencia('Maçã', 'raspada')).toBe('Maçã raspada');
    expect(aplicarConsistencia('Melão', 'raspada')).toBe('Melão raspado');
    expect(aplicarConsistencia('Uva verde sem semente', 'amassada')).toBe('Uva verde sem semente amassada');
  });

  it('troca ou tira a consistência que já vem no nome (pratos importados)', () => {
    expect(aplicarConsistencia('Melancia amassada', 'raspada')).toBe('Melancia raspada');
    expect(aplicarConsistencia('Abacaxi amassado', null)).toBe('Abacaxi');
    expect(nomeBase('Melão raspado')).toBe('Melão');
    expect(consistenciaDe('Melão raspado')).toBe('raspada');
    expect(consistenciaDe('Mamão amassado')).toBe('amassada');
    expect(consistenciaDe('Banana')).toBeNull();
  });

  it('sugere raspada para fruta firme e amassada para macia', () => {
    expect(consistenciaSugerida('Maçã')).toBe('raspada');
    expect(consistenciaSugerida('Pera')).toBe('raspada');
    expect(consistenciaSugerida('Banana amassada')).toBe('amassada');
    expect(consistenciaSugerida('Mamão')).toBe('amassada');
    expect(consistenciaSugerida('Laranja')).toBeNull();
  });

  it('só oferece para fruta simples', () => {
    expect(aceitaConsistencia(item('Banana'))).toBe(true);
    expect(aceitaConsistencia(item('Kiwi', 'fruta'))).toBe(true);
    expect(aceitaConsistencia(item('Bolo + Maçã raspada'))).toBe(false);
    expect(aceitaConsistencia(item('Leite materno/Fórmula Infantil'))).toBe(false);
    expect(aceitaConsistencia(item('Frango grelhado', 'proteina'))).toBe(false);
  });
});
