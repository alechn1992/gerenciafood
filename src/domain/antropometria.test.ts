import { describe, expect, it } from 'vitest';
import ate5 from '../data/oms/oms-0a5anos.json';
import de5a19 from '../data/oms/oms-5a19anos.json';
import {
  alturaPadronizada,
  avaliacaoEmTexto,
  avaliarMedida,
  calcularImc,
  classificarEstatura,
  classificarImc,
  classificarPeso,
  escoreNaIdade,
  faixaDoGrafico,
  idadeEmDias,
  idadePorExtenso,
  lmsNaIdade,
  valorNoEscore,
  type Sexo,
  type TabelasOms,
} from './antropometria';

const t = { ate5, de5a19 } as unknown as TabelasOms;
const DIAS_POR_MES = 30.4375;

// Casos do levantamento de referência que acompanha o pacote oficial da OMS
// (anthroplus, survey_who2007_z.csv), com os escores-z calculados pela OMS.
const REFERENCIA_OMS_5A19: { sexo: Sexo; meses: number; peso: number; altura: number; zImc: number; zEstatura: number; zPeso: number | null }[] = [{"sexo": "M", "meses": 166.59, "peso": 50.7, "altura": 153.7, "zImc": 0.94, "zEstatura": -1.13, "zPeso": null}, {"sexo": "M", "meses": 184.09, "peso": 84.6, "altura": 181.7, "zImc": 1.66, "zEstatura": 1.43, "zPeso": null}, {"sexo": "F", "meses": 133.88, "peso": 46.5, "altura": 144.3, "zImc": 1.65, "zEstatura": -0.25, "zPeso": null}, {"sexo": "M", "meses": 80.65, "peso": 18.8, "altura": 114.6, "zImc": -0.87, "zEstatura": -1.07, "zPeso": -1.26}, {"sexo": "F", "meses": 173.63, "peso": 61.8, "altura": 159.9, "zImc": 1.26, "zEstatura": -0.13, "zPeso": null}, {"sexo": "F", "meses": 167.82, "peso": 45.9, "altura": 159.8, "zImc": -0.65, "zEstatura": 0.01, "zPeso": null}, {"sexo": "F", "meses": 198.41, "peso": 53.1, "altura": 165.7, "zImc": -0.57, "zEstatura": 0.44, "zPeso": null}, {"sexo": "F", "meses": 216.31, "peso": 52.8, "altura": 160.1, "zImc": -0.22, "zEstatura": -0.45, "zPeso": null}, {"sexo": "F", "meses": 99.0, "peso": 33.7, "altura": 141.5, "zImc": 0.54, "zEstatura": 2.29, "zPeso": 1.52}, {"sexo": "F", "meses": 74.27, "peso": 29.7, "altura": 125.0, "zImc": 1.88, "zEstatura": 1.69, "zPeso": 2.23}, {"sexo": "M", "meses": 202.11, "peso": 90.5, "altura": 181.8, "zImc": 1.77, "zEstatura": 0.9, "zPeso": null}, {"sexo": "M", "meses": 115.09, "peso": 30.9, "altura": 145.0, "zImc": -1.07, "zEstatura": 1.5, "zPeso": 0.22}, {"sexo": "M", "meses": 222.16, "peso": 71.1, "altura": 177.0, "zImc": 0.25, "zEstatura": 0.08, "zPeso": null}, {"sexo": "M", "meses": 125.37, "peso": 37.1, "altura": 146.7, "zImc": 0.31, "zEstatura": 1.01, "zPeso": null}, {"sexo": "M", "meses": 64.51, "peso": 19.9, "altura": 115.4, "zImc": -0.25, "zEstatura": 0.7, "zPeso": 0.3}, {"sexo": "F", "meses": 67.61, "peso": 20.4, "altura": 114.8, "zImc": 0.15, "zEstatura": 0.37, "zPeso": 0.34}, {"sexo": "F", "meses": 120.35, "peso": 44.4, "altura": 153.7, "zImc": 0.91, "zEstatura": 2.32, "zPeso": 1.74}, {"sexo": "M", "meses": 120.61, "peso": 43.3, "altura": 141.8, "zImc": 2.02, "zEstatura": 0.59, "zPeso": 1.81}];

describe('escores-z 5 a 19 anos: iguais aos da OMS', () => {
  for (const r of REFERENCIA_OMS_5A19) {
    it(`${r.sexo} ${r.meses} meses`, () => {
      const dias = r.meses * DIAS_POR_MES;
      expect(escoreNaIdade(t, 'imc', r.sexo, dias, calcularImc(r.peso, r.altura))).toBeCloseTo(r.zImc, 2);
      expect(escoreNaIdade(t, 'estatura', r.sexo, dias, r.altura)).toBeCloseTo(r.zEstatura, 2);
      if (r.zPeso !== null) expect(escoreNaIdade(t, 'peso', r.sexo, dias, r.peso)).toBeCloseTo(r.zPeso, 2);
      else expect(escoreNaIdade(t, 'peso', r.sexo, dias, r.peso)).toBeUndefined();
    });
  }
});

describe('escores-z 0 a 5 anos', () => {
  it('na mediana da tabela o escore é 0; nos desvios, ±2', () => {
    for (const [sexo, dia] of [['M', 0], ['F', 200], ['M', 731], ['F', 1500]] as [Sexo, number][]) {
      const lms = lmsNaIdade(t, 'imc', sexo, dia)!;
      expect(escoreNaIdade(t, 'imc', sexo, dia, lms[1])).toBe(0);
      expect(escoreNaIdade(t, 'imc', sexo, dia, valorNoEscore(lms, 2))).toBeCloseTo(2, 2);
      expect(escoreNaIdade(t, 'imc', sexo, dia, valorNoEscore(lms, -2))).toBeCloseTo(-2, 2);
    }
  });
  it('mediana de peso dos meninos aos 12 meses ≈ 9,6 kg e de comprimento ≈ 75,7 cm (tabelas OMS)', () => {
    expect(lmsNaIdade(t, 'peso', 'M', 365)![1]).toBeCloseTo(9.6, 1);
    expect(lmsNaIdade(t, 'estatura', 'M', 365)![1]).toBeCloseTo(75.7, 1);
  });
  it('acima de +3 e abaixo de −3 usa o ajuste da OMS (peso e IMC)', () => {
    const lms = lmsNaIdade(t, 'peso', 'F', 400)!;
    const sd3 = valorNoEscore(lms, 3);
    const sd2 = valorNoEscore(lms, 2);
    expect(escoreNaIdade(t, 'peso', 'F', 400, sd3 + (sd3 - sd2))).toBeCloseTo(4, 2);
  });
  it('peso-para-idade só até 10 anos; IMC e estatura até 19', () => {
    expect(escoreNaIdade(t, 'peso', 'M', 130 * DIAS_POR_MES, 30)).toBeUndefined();
    expect(escoreNaIdade(t, 'imc', 'M', 130 * DIAS_POR_MES, 17)).toBeDefined();
    expect(escoreNaIdade(t, 'imc', 'M', 230 * DIAS_POR_MES, 17)).toBeUndefined();
  });
});

describe('medidas', () => {
  it('idade e padronização da altura aos 2 anos', () => {
    expect(idadeEmDias('2024-03-10', '2026-03-10')).toBe(730);
    expect(idadePorExtenso('2024-01-15', '2026-04-20')).toBe('2 anos e 3 meses');
    expect(idadePorExtenso('2026-03-01', '2026-03-16')).toBe('15 dias');
    expect(alturaPadronizada(80, 500, 'em_pe')).toBeCloseTo(80.7);
    expect(alturaPadronizada(90, 800, 'deitado')).toBeCloseTo(89.3);
    expect(alturaPadronizada(90, 800, 'em_pe')).toBe(90);
  });
  it('avaliarMedida usa a forma padrão pela idade e calcula o IMC com a altura padronizada', () => {
    const r = avaliarMedida(t, 'F', '2023-05-01', { data: '2026-05-01', pesoKg: 14, alturaCm: 95 });
    expect(r.alturaCm).toBe(95);
    expect(r.imc).toBeCloseTo(14 / 0.95 ** 2, 5);
    expect(r.zImc).toBeDefined();
    expect(r.zEstatura).toBeDefined();
    expect(r.zPeso).toBeDefined();
  });
});

describe('classificação (Ministério da Saúde)', () => {
  it('IMC-para-idade: nomes diferentes antes e depois dos 5 anos', () => {
    expect(classificarImc(-3.1, 30).rotulo).toBe('Magreza acentuada');
    expect(classificarImc(-2.5, 30).rotulo).toBe('Magreza');
    expect(classificarImc(0, 30).rotulo).toBe('Eutrofia');
    expect(classificarImc(1, 30).rotulo).toBe('Eutrofia');
    expect(classificarImc(1.5, 30).rotulo).toBe('Risco de sobrepeso');
    expect(classificarImc(1.5, 80).rotulo).toBe('Sobrepeso');
    expect(classificarImc(2.5, 30).rotulo).toBe('Sobrepeso');
    expect(classificarImc(2.5, 80).rotulo).toBe('Obesidade');
    expect(classificarImc(3.5, 30).rotulo).toBe('Obesidade');
    expect(classificarImc(3.5, 80).rotulo).toBe('Obesidade grave');
  });
  it('estatura e peso para a idade', () => {
    expect(classificarEstatura(-2.1).situacao).toBe('alerta');
    expect(classificarEstatura(-2).situacao).toBe('adequado');
    expect(classificarPeso(2.1).situacao).toBe('risco');
    expect(classificarPeso(-3.2).situacao).toBe('grave');
  });
  it('avaliação em texto com tendência e sugestão', () => {
    const anterior = avaliarMedida(t, 'M', '2022-01-10', { data: '2025-07-10', pesoKg: 15.5, alturaCm: 100 });
    const atual = avaliarMedida(t, 'M', '2022-01-10', { data: '2026-01-10', pesoKg: 14.8, alturaCm: 103 });
    const texto = avaliacaoEmTexto(atual, anterior).join(' ');
    expect(texto).toMatch(/IMC de/);
    expect(texto).toMatch(/medida anterior/);
    expect(texto).toMatch(/Sugestão/);
  });
  it('faixas do gráfico', () => {
    expect(faixaDoGrafico(10)).toEqual([0, 24]);
    expect(faixaDoGrafico(40)).toEqual([24, 60]);
    expect(faixaDoGrafico(70)).toEqual([60, 120]);
    expect(faixaDoGrafico(150)).toEqual([120, 228]);
  });
});
