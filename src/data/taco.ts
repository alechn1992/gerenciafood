// Tabela Brasileira de Composição de Alimentos — TACO, 4ª edição, NEPA/UNICAMP
// Valores por 100 g ou 100 ml do alimento.

export type FonteNutricional = 'taco' | 'usda' | 'ibge';

export interface ItemTaco {
  id: string;
  nome: string;
  kcal: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  fibras: number;
  sodio: number;
  fonte: FonteNutricional;
}

export const TACO: ItemTaco[] = [

  // ── CEREAIS E DERIVADOS ──────────────────────────────────────────────────
  { id: 'taco-01', nome: 'Arroz branco cozido',            kcal: 128, proteinas: 2.5, carboidratos: 28.1, gorduras: 0.2, fibras: 1.6, sodio: 1,   fonte: 'taco' },
  { id: 'taco-02', nome: 'Arroz integral cozido',           kcal: 124, proteinas: 2.6, carboidratos: 25.8, gorduras: 1.0, fibras: 2.7, sodio: 2,   fonte: 'taco' },
  { id: 'taco-03', nome: 'Arroz parboilizado cozido',       kcal: 134, proteinas: 2.7, carboidratos: 28.6, gorduras: 0.4, fibras: 1.8, sodio: 2,   fonte: 'taco' },
  { id: 'taco-04', nome: 'Macarrão cozido',                 kcal: 110, proteinas: 3.8, carboidratos: 22.5, gorduras: 0.5, fibras: 1.5, sodio: 4,   fonte: 'taco' },
  { id: 'taco-05', nome: 'Macarrão integral cozido',        kcal: 124, proteinas: 5.3, carboidratos: 24.3, gorduras: 0.8, fibras: 4.5, sodio: 3,   fonte: 'taco' },
  { id: 'taco-06', nome: 'Pão francês',                     kcal: 300, proteinas: 8.0, carboidratos: 58.6, gorduras: 3.1, fibras: 2.3, sodio: 504, fonte: 'taco' },
  { id: 'taco-07', nome: 'Pão de forma',                    kcal: 253, proteinas: 7.6, carboidratos: 48.1, gorduras: 3.3, fibras: 2.3, sodio: 490, fonte: 'taco' },
  { id: 'taco-08', nome: 'Pão integral de forma',           kcal: 253, proteinas: 9.4, carboidratos: 45.8, gorduras: 3.8, fibras: 6.9, sodio: 441, fonte: 'taco' },
  { id: 'taco-09', nome: 'Farinha de trigo',                kcal: 360, proteinas: 9.8, carboidratos: 75.1, gorduras: 1.4, fibras: 2.3, sodio: 2,   fonte: 'taco' },
  { id: 'taco-10', nome: 'Farinha de mandioca torrada',     kcal: 361, proteinas: 1.7, carboidratos: 87.9, gorduras: 0.3, fibras: 6.2, sodio: 9,   fonte: 'taco' },
  { id: 'taco-11', nome: 'Fubá de milho',                   kcal: 354, proteinas: 7.8, carboidratos: 74.0, gorduras: 2.0, fibras: 6.4, sodio: 1,   fonte: 'taco' },
  { id: 'taco-12', nome: 'Aveia em flocos',                  kcal: 394, proteinas: 13.9, carboidratos: 66.6, gorduras: 8.5, fibras: 9.1, sodio: 4,  fonte: 'taco' },
  { id: 'taco-13', nome: 'Cuscuz de milho cozido',           kcal: 83,  proteinas: 2.0, carboidratos: 17.6, gorduras: 0.5, fibras: 1.3, sodio: 3,   fonte: 'taco' },
  { id: 'taco-14', nome: 'Tapioca (goma hidratada)',         kcal: 335, proteinas: 0.2, carboidratos: 83.9, gorduras: 0.2, fibras: 0.0, sodio: 1,   fonte: 'taco' },
  { id: 'taco-15', nome: 'Polenta cozida',                   kcal: 70,  proteinas: 1.5, carboidratos: 15.4, gorduras: 0.2, fibras: 0.8, sodio: 2,   fonte: 'taco' },
  { id: 'taco-16', nome: 'Biscoito cream cracker',           kcal: 434, proteinas: 9.7, carboidratos: 67.9, gorduras: 14.7, fibras: 2.2, sodio: 750, fonte: 'taco' },
  { id: 'taco-17', nome: 'Biscoito maisena',                 kcal: 440, proteinas: 6.8, carboidratos: 73.8, gorduras: 14.3, fibras: 1.3, sodio: 277, fonte: 'taco' },

  // ── LEGUMINOSAS ──────────────────────────────────────────────────────────
  { id: 'taco-18', nome: 'Feijão preto cozido',             kcal: 77,  proteinas: 4.5, carboidratos: 14.0, gorduras: 0.5, fibras: 8.4, sodio: 2,   fonte: 'taco' },
  { id: 'taco-19', nome: 'Feijão carioca cozido',           kcal: 76,  proteinas: 4.8, carboidratos: 13.6, gorduras: 0.5, fibras: 8.5, sodio: 2,   fonte: 'taco' },
  { id: 'taco-20', nome: 'Feijão fradinho cozido',          kcal: 99,  proteinas: 6.9, carboidratos: 17.4, gorduras: 0.7, fibras: 3.2, sodio: 4,   fonte: 'taco' },
  { id: 'taco-21', nome: 'Feijão de corda cozido',          kcal: 98,  proteinas: 6.9, carboidratos: 17.0, gorduras: 0.7, fibras: 3.5, sodio: 4,   fonte: 'taco' },
  { id: 'taco-22', nome: 'Lentilha cozida',                 kcal: 93,  proteinas: 6.3, carboidratos: 16.6, gorduras: 0.5, fibras: 3.7, sodio: 3,   fonte: 'taco' },
  { id: 'taco-23', nome: 'Grão-de-bico cozido',             kcal: 164, proteinas: 9.0, carboidratos: 27.4, gorduras: 2.7, fibras: 6.0, sodio: 7,   fonte: 'taco' },
  { id: 'taco-24', nome: 'Ervilha cozida',                  kcal: 74,  proteinas: 5.4, carboidratos: 12.4, gorduras: 0.4, fibras: 5.7, sodio: 3,   fonte: 'taco' },
  { id: 'taco-25', nome: 'Ervilha enlatada',                kcal: 59,  proteinas: 3.5, carboidratos: 10.8, gorduras: 0.2, fibras: 5.0, sodio: 260, fonte: 'taco' },
  { id: 'taco-26', nome: 'Soja cozida',                     kcal: 141, proteinas: 14.6, carboidratos: 10.7, gorduras: 6.3, fibras: 10.9, sodio: 4, fonte: 'taco' },

  // ── CARNES BOVINAS ───────────────────────────────────────────────────────
  { id: 'taco-27', nome: 'Carne bovina patinho cozido',     kcal: 219, proteinas: 32.9, carboidratos: 0.0, gorduras: 9.6,  fibras: 0.0, sodio: 60,  fonte: 'taco' },
  { id: 'taco-28', nome: 'Carne bovina acém cozido',        kcal: 265, proteinas: 29.4, carboidratos: 0.0, gorduras: 16.2, fibras: 0.0, sodio: 59,  fonte: 'taco' },
  { id: 'taco-29', nome: 'Carne bovina músculo cozido',     kcal: 219, proteinas: 32.2, carboidratos: 0.0, gorduras: 9.9,  fibras: 0.0, sodio: 55,  fonte: 'taco' },
  { id: 'taco-30', nome: 'Carne moída refogada',            kcal: 246, proteinas: 25.8, carboidratos: 0.0, gorduras: 15.9, fibras: 0.0, sodio: 62,  fonte: 'taco' },
  { id: 'taco-31', nome: 'Bife bovino grelhado',            kcal: 246, proteinas: 32.8, carboidratos: 0.0, gorduras: 12.9, fibras: 0.0, sodio: 57,  fonte: 'taco' },
  { id: 'taco-32', nome: 'Costela bovina assada',           kcal: 369, proteinas: 21.8, carboidratos: 0.0, gorduras: 31.7, fibras: 0.0, sodio: 68,  fonte: 'taco' },
  { id: 'taco-33', nome: 'Fígado bovino cozido',            kcal: 155, proteinas: 26.6, carboidratos: 2.5, gorduras: 4.0,  fibras: 0.0, sodio: 73,  fonte: 'taco' },
  { id: 'taco-34', nome: 'Coração bovino cozido',           kcal: 167, proteinas: 28.1, carboidratos: 0.0, gorduras: 5.9,  fibras: 0.0, sodio: 85,  fonte: 'taco' },

  // ── AVES ─────────────────────────────────────────────────────────────────
  { id: 'taco-35', nome: 'Frango peito grelhado',           kcal: 159, proteinas: 32.0, carboidratos: 0.0, gorduras: 2.8,  fibras: 0.0, sodio: 92,  fonte: 'taco' },
  { id: 'taco-36', nome: 'Frango peito cozido',             kcal: 153, proteinas: 32.0, carboidratos: 0.0, gorduras: 1.9,  fibras: 0.0, sodio: 82,  fonte: 'taco' },
  { id: 'taco-37', nome: 'Frango peito assado',             kcal: 163, proteinas: 32.9, carboidratos: 0.0, gorduras: 3.0,  fibras: 0.0, sodio: 85,  fonte: 'taco' },
  { id: 'taco-38', nome: 'Frango peito frito',              kcal: 226, proteinas: 28.9, carboidratos: 0.0, gorduras: 12.3, fibras: 0.0, sodio: 95,  fonte: 'taco' },
  { id: 'taco-39', nome: 'Frango coxa assada',              kcal: 232, proteinas: 26.1, carboidratos: 0.0, gorduras: 14.2, fibras: 0.0, sodio: 104, fonte: 'taco' },
  { id: 'taco-40', nome: 'Frango coxa cozida',              kcal: 212, proteinas: 27.6, carboidratos: 0.0, gorduras: 11.1, fibras: 0.0, sodio: 90,  fonte: 'taco' },
  { id: 'taco-41', nome: 'Frango coxa/sobrecoxa grelhada',  kcal: 219, proteinas: 27.0, carboidratos: 0.0, gorduras: 12.0, fibras: 0.0, sodio: 98,  fonte: 'taco' },
  { id: 'taco-42', nome: 'Frango inteiro assado',           kcal: 239, proteinas: 28.0, carboidratos: 0.0, gorduras: 13.9, fibras: 0.0, sodio: 81,  fonte: 'taco' },
  { id: 'taco-43', nome: 'Frango desfiado cozido',          kcal: 153, proteinas: 32.0, carboidratos: 0.0, gorduras: 1.9,  fibras: 0.0, sodio: 82,  fonte: 'taco' },
  { id: 'taco-44', nome: 'Fígado de frango cozido',         kcal: 148, proteinas: 22.5, carboidratos: 2.1, gorduras: 5.1,  fibras: 0.0, sodio: 79,  fonte: 'taco' },
  { id: 'taco-45', nome: 'Peru peito assado',               kcal: 159, proteinas: 30.1, carboidratos: 0.0, gorduras: 3.7,  fibras: 0.0, sodio: 68,  fonte: 'taco' },

  // ── SUÍNOS E EMBUTIDOS ───────────────────────────────────────────────────
  { id: 'taco-46', nome: 'Carne suína lombo assado',        kcal: 197, proteinas: 27.3, carboidratos: 0.0, gorduras: 9.4,  fibras: 0.0, sodio: 63,  fonte: 'taco' },
  { id: 'taco-47', nome: 'Carne suína costela assada',      kcal: 399, proteinas: 20.1, carboidratos: 0.0, gorduras: 35.2, fibras: 0.0, sodio: 71,  fonte: 'taco' },
  { id: 'taco-48', nome: 'Linguiça suína cozida',           kcal: 272, proteinas: 17.5, carboidratos: 1.3, gorduras: 21.9, fibras: 0.0, sodio: 858, fonte: 'taco' },
  { id: 'taco-49', nome: 'Linguiça de frango cozida',       kcal: 185, proteinas: 18.0, carboidratos: 1.0, gorduras: 11.9, fibras: 0.0, sodio: 610, fonte: 'taco' },
  { id: 'taco-50', nome: 'Presunto cozido',                 kcal: 137, proteinas: 15.1, carboidratos: 0.4, gorduras: 8.3,  fibras: 0.0, sodio: 944, fonte: 'taco' },
  { id: 'taco-51', nome: 'Mortadela',                       kcal: 295, proteinas: 14.3, carboidratos: 1.8, gorduras: 25.8, fibras: 0.0, sodio: 1020,fonte: 'taco' },
  { id: 'taco-52', nome: 'Salsicha bovina cozida',          kcal: 264, proteinas: 13.6, carboidratos: 3.0, gorduras: 22.1, fibras: 0.0, sodio: 794, fonte: 'taco' },
  { id: 'taco-53', nome: 'Bacon grelhado',                  kcal: 541, proteinas: 24.0, carboidratos: 0.0, gorduras: 49.0, fibras: 0.0, sodio: 862, fonte: 'taco' },

  // ── OVOS ─────────────────────────────────────────────────────────────────
  { id: 'taco-54', nome: 'Ovo de galinha cozido',           kcal: 146, proteinas: 13.3, carboidratos: 0.6, gorduras: 9.5,  fibras: 0.0, sodio: 144, fonte: 'taco' },
  { id: 'taco-55', nome: 'Ovo de galinha frito',            kcal: 196, proteinas: 13.3, carboidratos: 0.3, gorduras: 15.6, fibras: 0.0, sodio: 217, fonte: 'taco' },
  { id: 'taco-56', nome: 'Ovo de galinha mexido',           kcal: 176, proteinas: 12.2, carboidratos: 0.8, gorduras: 13.4, fibras: 0.0, sodio: 176, fonte: 'taco' },
  { id: 'taco-57', nome: 'Omelete simples',                 kcal: 154, proteinas: 11.0, carboidratos: 1.0, gorduras: 11.6, fibras: 0.0, sodio: 200, fonte: 'taco' },
  { id: 'taco-58', nome: 'Ovo de galinha pochê',            kcal: 142, proteinas: 12.5, carboidratos: 0.6, gorduras: 9.7,  fibras: 0.0, sodio: 130, fonte: 'taco' },

  // ── PEIXES E FRUTOS DO MAR ───────────────────────────────────────────────
  { id: 'taco-59', nome: 'Peixe tilápia assada',            kcal: 96,  proteinas: 21.2, carboidratos: 0.0, gorduras: 1.0,  fibras: 0.0, sodio: 60,  fonte: 'taco' },
  { id: 'taco-60', nome: 'Peixe tilápia cozida',            kcal: 92,  proteinas: 20.1, carboidratos: 0.0, gorduras: 1.0,  fibras: 0.0, sodio: 58,  fonte: 'taco' },
  { id: 'taco-61', nome: 'Peixe tilápia frita',             kcal: 148, proteinas: 20.5, carboidratos: 0.0, gorduras: 7.0,  fibras: 0.0, sodio: 72,  fonte: 'taco' },
  { id: 'taco-62', nome: 'Peixe salmão grelhado',           kcal: 185, proteinas: 27.3, carboidratos: 0.0, gorduras: 8.1,  fibras: 0.0, sodio: 75,  fonte: 'taco' },
  { id: 'taco-63', nome: 'Peixe pescada cozida',            kcal: 82,  proteinas: 18.1, carboidratos: 0.0, gorduras: 0.7,  fibras: 0.0, sodio: 50,  fonte: 'taco' },
  { id: 'taco-64', nome: 'Bacalhau cozido dessalgado',      kcal: 104, proteinas: 22.7, carboidratos: 0.0, gorduras: 1.3,  fibras: 0.0, sodio: 260, fonte: 'taco' },
  { id: 'taco-65', nome: 'Sardinha em lata',                kcal: 208, proteinas: 23.5, carboidratos: 0.0, gorduras: 12.4, fibras: 0.0, sodio: 399, fonte: 'taco' },
  { id: 'taco-66', nome: 'Atum em lata',                    kcal: 132, proteinas: 26.7, carboidratos: 0.0, gorduras: 2.7,  fibras: 0.0, sodio: 396, fonte: 'taco' },
  { id: 'taco-67', nome: 'Camarão cozido',                  kcal: 90,  proteinas: 19.0, carboidratos: 0.0, gorduras: 1.4,  fibras: 0.0, sodio: 190, fonte: 'taco' },

  // ── LATICÍNIOS ───────────────────────────────────────────────────────────
  { id: 'taco-68', nome: 'Leite de vaca integral',          kcal: 61,  proteinas: 3.2, carboidratos: 4.7,  gorduras: 3.2,  fibras: 0.0, sodio: 45,  fonte: 'taco' },
  { id: 'taco-69', nome: 'Leite de vaca desnatado',         kcal: 35,  proteinas: 3.5, carboidratos: 5.0,  gorduras: 0.2,  fibras: 0.0, sodio: 51,  fonte: 'taco' },
  { id: 'taco-70', nome: 'Leite de vaca semidesnatado',     kcal: 48,  proteinas: 3.3, carboidratos: 4.8,  gorduras: 1.6,  fibras: 0.0, sodio: 48,  fonte: 'taco' },
  { id: 'taco-71', nome: 'Iogurte natural integral',        kcal: 66,  proteinas: 4.1, carboidratos: 7.2,  gorduras: 2.4,  fibras: 0.0, sodio: 53,  fonte: 'taco' },
  { id: 'taco-72', nome: 'Iogurte natural desnatado',       kcal: 43,  proteinas: 4.3, carboidratos: 6.4,  gorduras: 0.1,  fibras: 0.0, sodio: 56,  fonte: 'taco' },
  { id: 'taco-73', nome: 'Queijo mussarela',                kcal: 300, proteinas: 22.2, carboidratos: 2.1, gorduras: 22.8, fibras: 0.0, sodio: 510, fonte: 'taco' },
  { id: 'taco-74', nome: 'Queijo minas frescal',            kcal: 264, proteinas: 17.4, carboidratos: 1.4, gorduras: 20.2, fibras: 0.0, sodio: 388, fonte: 'taco' },
  { id: 'taco-75', nome: 'Queijo minas padrão',             kcal: 336, proteinas: 23.5, carboidratos: 1.5, gorduras: 26.2, fibras: 0.0, sodio: 454, fonte: 'taco' },
  { id: 'taco-76', nome: 'Queijo prato',                    kcal: 358, proteinas: 25.1, carboidratos: 1.1, gorduras: 28.0, fibras: 0.0, sodio: 603, fonte: 'taco' },
  { id: 'taco-77', nome: 'Queijo parmesão',                 kcal: 455, proteinas: 35.6, carboidratos: 0.0, gorduras: 35.1, fibras: 0.0, sodio: 1376,fonte: 'taco' },
  { id: 'taco-78', nome: 'Requeijão cremoso',               kcal: 271, proteinas: 9.5,  carboidratos: 3.4, gorduras: 24.7, fibras: 0.0, sodio: 680, fonte: 'taco' },
  { id: 'taco-79', nome: 'Creme de leite',                  kcal: 336, proteinas: 2.6,  carboidratos: 3.2, gorduras: 34.9, fibras: 0.0, sodio: 30,  fonte: 'taco' },
  { id: 'taco-80', nome: 'Leite condensado',                kcal: 328, proteinas: 7.4,  carboidratos: 55.3,gorduras: 8.8,  fibras: 0.0, sodio: 126, fonte: 'taco' },
  { id: 'taco-81', nome: 'Manteiga sem sal',                kcal: 726, proteinas: 0.4,  carboidratos: 0.0, gorduras: 83.2, fibras: 0.0, sodio: 9,   fonte: 'taco' },
  { id: 'taco-82', nome: 'Manteiga com sal',                kcal: 726, proteinas: 0.4,  carboidratos: 0.0, gorduras: 83.2, fibras: 0.0, sodio: 520, fonte: 'taco' },

  // ── HORTALIÇAS ───────────────────────────────────────────────────────────
  { id: 'taco-83', nome: 'Alface crua',                     kcal: 11,  proteinas: 1.3, carboidratos: 1.7,  gorduras: 0.2, fibras: 1.8, sodio: 9,   fonte: 'taco' },
  { id: 'taco-84', nome: 'Tomate cru',                      kcal: 15,  proteinas: 1.1, carboidratos: 3.1,  gorduras: 0.2, fibras: 1.2, sodio: 4,   fonte: 'taco' },
  { id: 'taco-85', nome: 'Tomate cozido',                   kcal: 22,  proteinas: 0.9, carboidratos: 4.7,  gorduras: 0.2, fibras: 1.5, sodio: 3,   fonte: 'taco' },
  { id: 'taco-86', nome: 'Cenoura crua',                    kcal: 34,  proteinas: 0.6, carboidratos: 8.2,  gorduras: 0.1, fibras: 3.2, sodio: 47,  fonte: 'taco' },
  { id: 'taco-87', nome: 'Cenoura cozida',                  kcal: 25,  proteinas: 0.8, carboidratos: 5.5,  gorduras: 0.3, fibras: 2.6, sodio: 45,  fonte: 'taco' },
  { id: 'taco-88', nome: 'Beterraba crua',                  kcal: 31,  proteinas: 1.3, carboidratos: 7.0,  gorduras: 0.1, fibras: 2.0, sodio: 37,  fonte: 'taco' },
  { id: 'taco-89', nome: 'Beterraba cozida',                kcal: 39,  proteinas: 1.0, carboidratos: 9.0,  gorduras: 0.1, fibras: 2.9, sodio: 55,  fonte: 'taco' },
  { id: 'taco-90', nome: 'Batata inglesa cozida',           kcal: 52,  proteinas: 1.2, carboidratos: 11.9, gorduras: 0.1, fibras: 1.8, sodio: 3,   fonte: 'taco' },
  { id: 'taco-91', nome: 'Batata inglesa frita',            kcal: 271, proteinas: 3.4, carboidratos: 35.7, gorduras: 13.7,fibras: 3.1, sodio: 193, fonte: 'taco' },
  { id: 'taco-92', nome: 'Purê de batata',                  kcal: 83,  proteinas: 2.3, carboidratos: 14.1, gorduras: 2.1, fibras: 1.3, sodio: 210, fonte: 'taco' },
  { id: 'taco-93', nome: 'Batata-doce cozida',              kcal: 77,  proteinas: 0.6, carboidratos: 18.4, gorduras: 0.1, fibras: 2.2, sodio: 34,  fonte: 'taco' },
  { id: 'taco-94', nome: 'Mandioca cozida',                 kcal: 125, proteinas: 0.6, carboidratos: 30.1, gorduras: 0.3, fibras: 1.9, sodio: 10,  fonte: 'taco' },
  { id: 'taco-95', nome: 'Chuchu cozido',                   kcal: 19,  proteinas: 0.5, carboidratos: 4.5,  gorduras: 0.1, fibras: 1.7, sodio: 4,   fonte: 'taco' },
  { id: 'taco-96', nome: 'Abobrinha cozida',                kcal: 16,  proteinas: 1.2, carboidratos: 2.8,  gorduras: 0.3, fibras: 1.4, sodio: 4,   fonte: 'taco' },
  { id: 'taco-97', nome: 'Abóbora cozida',                  kcal: 23,  proteinas: 0.7, carboidratos: 5.4,  gorduras: 0.1, fibras: 1.0, sodio: 2,   fonte: 'taco' },
  { id: 'taco-98', nome: 'Abóbora moranga cozida',          kcal: 26,  proteinas: 0.9, carboidratos: 6.0,  gorduras: 0.1, fibras: 1.4, sodio: 2,   fonte: 'taco' },
  { id: 'taco-99', nome: 'Berinjela cozida',                kcal: 24,  proteinas: 0.6, carboidratos: 5.5,  gorduras: 0.2, fibras: 2.5, sodio: 3,   fonte: 'taco' },
  { id: 'taco-100', nome: 'Vagem cozida',                   kcal: 27,  proteinas: 1.8, carboidratos: 5.1,  gorduras: 0.2, fibras: 2.7, sodio: 3,   fonte: 'taco' },
  { id: 'taco-101', nome: 'Quiabo cozido',                  kcal: 22,  proteinas: 1.6, carboidratos: 4.2,  gorduras: 0.2, fibras: 2.5, sodio: 3,   fonte: 'taco' },
  { id: 'taco-102', nome: 'Jiló cozido',                    kcal: 18,  proteinas: 1.0, carboidratos: 3.5,  gorduras: 0.2, fibras: 2.1, sodio: 3,   fonte: 'taco' },
  { id: 'taco-103', nome: 'Repolho cru',                    kcal: 15,  proteinas: 1.3, carboidratos: 2.5,  gorduras: 0.1, fibras: 2.0, sodio: 5,   fonte: 'taco' },
  { id: 'taco-104', nome: 'Repolho cozido',                 kcal: 16,  proteinas: 1.0, carboidratos: 3.2,  gorduras: 0.2, fibras: 2.2, sodio: 7,   fonte: 'taco' },
  { id: 'taco-105', nome: 'Couve-flor cozida',              kcal: 21,  proteinas: 2.1, carboidratos: 3.2,  gorduras: 0.2, fibras: 2.5, sodio: 17,  fonte: 'taco' },
  { id: 'taco-106', nome: 'Brócolis cozido',                kcal: 25,  proteinas: 2.7, carboidratos: 3.6,  gorduras: 0.3, fibras: 2.6, sodio: 21,  fonte: 'taco' },
  { id: 'taco-107', nome: 'Espinafre cru',                  kcal: 22,  proteinas: 2.2, carboidratos: 3.4,  gorduras: 0.4, fibras: 2.2, sodio: 79,  fonte: 'taco' },
  { id: 'taco-108', nome: 'Espinafre cozido',               kcal: 23,  proteinas: 3.0, carboidratos: 2.9,  gorduras: 0.4, fibras: 2.5, sodio: 109, fonte: 'taco' },
  { id: 'taco-109', nome: 'Couve refogada',                 kcal: 30,  proteinas: 2.1, carboidratos: 4.2,  gorduras: 0.6, fibras: 2.0, sodio: 7,   fonte: 'taco' },
  { id: 'taco-110', nome: 'Cebola crua',                    kcal: 30,  proteinas: 1.2, carboidratos: 6.8,  gorduras: 0.1, fibras: 2.4, sodio: 2,   fonte: 'taco' },
  { id: 'taco-111', nome: 'Alho cru',                       kcal: 98,  proteinas: 4.4, carboidratos: 22.0, gorduras: 0.1, fibras: 4.3, sodio: 8,   fonte: 'taco' },
  { id: 'taco-112', nome: 'Pimentão vermelho cru',          kcal: 28,  proteinas: 1.3, carboidratos: 6.3,  gorduras: 0.3, fibras: 2.1, sodio: 3,   fonte: 'taco' },
  { id: 'taco-113', nome: 'Pimentão verde cru',             kcal: 20,  proteinas: 0.9, carboidratos: 4.5,  gorduras: 0.2, fibras: 1.5, sodio: 2,   fonte: 'taco' },
  { id: 'taco-114', nome: 'Milho verde cozido',             kcal: 75,  proteinas: 2.5, carboidratos: 17.0, gorduras: 0.6, fibras: 1.8, sodio: 256, fonte: 'taco' },
  { id: 'taco-115', nome: 'Pepino cru',                     kcal: 10,  proteinas: 0.7, carboidratos: 2.1,  gorduras: 0.1, fibras: 0.8, sodio: 2,   fonte: 'taco' },
  { id: 'taco-116', nome: 'Chucrute',                       kcal: 19,  proteinas: 0.9, carboidratos: 4.3,  gorduras: 0.1, fibras: 2.9, sodio: 661, fonte: 'taco' },
  { id: 'taco-117', nome: 'Extrato de tomate',              kcal: 29,  proteinas: 1.5, carboidratos: 6.0,  gorduras: 0.2, fibras: 1.9, sodio: 507, fonte: 'taco' },
  { id: 'taco-118', nome: 'Molho de tomate pronto',         kcal: 47,  proteinas: 1.6, carboidratos: 9.3,  gorduras: 0.5, fibras: 1.5, sodio: 540, fonte: 'taco' },

  // ── FRUTAS ───────────────────────────────────────────────────────────────
  { id: 'taco-119', nome: 'Banana prata crua',              kcal: 98,  proteinas: 1.3, carboidratos: 26.0, gorduras: 0.1, fibras: 2.0, sodio: 1,   fonte: 'taco' },
  { id: 'taco-120', nome: 'Banana nanica crua',             kcal: 92,  proteinas: 1.4, carboidratos: 23.8, gorduras: 0.1, fibras: 1.9, sodio: 1,   fonte: 'taco' },
  { id: 'taco-121', nome: 'Maçã crua',                      kcal: 56,  proteinas: 0.3, carboidratos: 15.2, gorduras: 0.1, fibras: 2.0, sodio: 1,   fonte: 'taco' },
  { id: 'taco-122', nome: 'Pera crua',                      kcal: 55,  proteinas: 0.4, carboidratos: 14.8, gorduras: 0.1, fibras: 3.1, sodio: 1,   fonte: 'taco' },
  { id: 'taco-123', nome: 'Laranja pera crua',              kcal: 37,  proteinas: 1.0, carboidratos: 8.9,  gorduras: 0.1, fibras: 0.8, sodio: 1,   fonte: 'taco' },
  { id: 'taco-124', nome: 'Laranja lima crua',              kcal: 39,  proteinas: 0.9, carboidratos: 9.5,  gorduras: 0.1, fibras: 0.9, sodio: 1,   fonte: 'taco' },
  { id: 'taco-125', nome: 'Mamão formosa cru',              kcal: 45,  proteinas: 0.5, carboidratos: 11.8, gorduras: 0.1, fibras: 1.8, sodio: 4,   fonte: 'taco' },
  { id: 'taco-126', nome: 'Manga Tommy crua',               kcal: 64,  proteinas: 0.4, carboidratos: 17.0, gorduras: 0.3, fibras: 1.6, sodio: 2,   fonte: 'taco' },
  { id: 'taco-127', nome: 'Abacaxi cru',                    kcal: 48,  proteinas: 0.9, carboidratos: 12.3, gorduras: 0.1, fibras: 1.0, sodio: 1,   fonte: 'taco' },
  { id: 'taco-128', nome: 'Uva comum crua',                 kcal: 68,  proteinas: 1.0, carboidratos: 17.7, gorduras: 0.1, fibras: 0.9, sodio: 2,   fonte: 'taco' },
  { id: 'taco-129', nome: 'Melancia crua',                  kcal: 33,  proteinas: 0.9, carboidratos: 7.8,  gorduras: 0.3, fibras: 0.5, sodio: 3,   fonte: 'taco' },
  { id: 'taco-130', nome: 'Melão cru',                      kcal: 29,  proteinas: 0.7, carboidratos: 7.1,  gorduras: 0.2, fibras: 0.3, sodio: 9,   fonte: 'taco' },
  { id: 'taco-131', nome: 'Goiaba crua',                    kcal: 54,  proteinas: 2.6, carboidratos: 11.2, gorduras: 0.6, fibras: 6.2, sodio: 4,   fonte: 'taco' },
  { id: 'taco-132', nome: 'Abacate cru',                    kcal: 96,  proteinas: 1.2, carboidratos: 6.0,  gorduras: 8.4, fibras: 6.3, sodio: 5,   fonte: 'taco' },
  { id: 'taco-133', nome: 'Morango cru',                    kcal: 34,  proteinas: 0.8, carboidratos: 7.7,  gorduras: 0.4, fibras: 2.0, sodio: 1,   fonte: 'taco' },
  { id: 'taco-134', nome: 'Caju cru',                       kcal: 43,  proteinas: 1.3, carboidratos: 9.8,  gorduras: 0.4, fibras: 1.5, sodio: 4,   fonte: 'taco' },
  { id: 'taco-135', nome: 'Acerola crua',                   kcal: 32,  proteinas: 0.9, carboidratos: 7.2,  gorduras: 0.2, fibras: 1.5, sodio: 7,   fonte: 'taco' },
  { id: 'taco-136', nome: 'Maracujá cru (polpa)',           kcal: 68,  proteinas: 2.0, carboidratos: 15.9, gorduras: 0.6, fibras: 0.4, sodio: 28,  fonte: 'taco' },
  { id: 'taco-137', nome: 'Pêssego cru',                    kcal: 43,  proteinas: 1.1, carboidratos: 10.3, gorduras: 0.1, fibras: 1.3, sodio: 1,   fonte: 'taco' },
  { id: 'taco-138', nome: 'Coco fresco ralado',             kcal: 354, proteinas: 2.9, carboidratos: 15.2, gorduras: 33.5,fibras: 8.9, sodio: 25,  fonte: 'taco' },

  // ── GORDURAS E ÓLEOS ─────────────────────────────────────────────────────
  { id: 'taco-139', nome: 'Óleo de soja',                   kcal: 884, proteinas: 0.0, carboidratos: 0.0, gorduras: 100.0,fibras: 0.0, sodio: 0,   fonte: 'taco' },
  { id: 'taco-140', nome: 'Óleo de canola',                 kcal: 884, proteinas: 0.0, carboidratos: 0.0, gorduras: 100.0,fibras: 0.0, sodio: 0,   fonte: 'taco' },
  { id: 'taco-141', nome: 'Azeite de oliva',                kcal: 884, proteinas: 0.0, carboidratos: 0.0, gorduras: 100.0,fibras: 0.0, sodio: 2,   fonte: 'taco' },
  { id: 'taco-142', nome: 'Margarina com sal',              kcal: 530, proteinas: 0.1, carboidratos: 0.4, gorduras: 58.7, fibras: 0.0, sodio: 524, fonte: 'taco' },
  { id: 'taco-143', nome: 'Maionese',                       kcal: 658, proteinas: 1.2, carboidratos: 3.8, gorduras: 70.8, fibras: 0.0, sodio: 570, fonte: 'taco' },

  // ── AÇÚCARES E DOCES ─────────────────────────────────────────────────────
  { id: 'taco-144', nome: 'Açúcar refinado',                kcal: 387, proteinas: 0.0, carboidratos: 99.5, gorduras: 0.0, fibras: 0.0, sodio: 1,   fonte: 'taco' },
  { id: 'taco-145', nome: 'Açúcar mascavo',                 kcal: 376, proteinas: 0.3, carboidratos: 96.8, gorduras: 0.1, fibras: 0.0, sodio: 9,   fonte: 'taco' },
  { id: 'taco-146', nome: 'Mel de abelha',                  kcal: 309, proteinas: 0.4, carboidratos: 82.4, gorduras: 0.0, fibras: 0.2, sodio: 8,   fonte: 'taco' },
  { id: 'taco-147', nome: 'Geleia de frutas',               kcal: 249, proteinas: 0.4, carboidratos: 63.6, gorduras: 0.0, fibras: 0.6, sodio: 40,  fonte: 'taco' },

  // ── BEBIDAS ───────────────────────────────────────────────────────────────
  { id: 'taco-148', nome: 'Café infusão',                   kcal: 2,   proteinas: 0.3, carboidratos: 0.4,  gorduras: 0.0, fibras: 0.0, sodio: 2,   fonte: 'taco' },
  { id: 'taco-149', nome: 'Suco de laranja natural',        kcal: 46,  proteinas: 0.9, carboidratos: 11.4, gorduras: 0.1, fibras: 0.4, sodio: 1,   fonte: 'taco' },
  { id: 'taco-150', nome: 'Suco de maracujá natural',       kcal: 44,  proteinas: 1.1, carboidratos: 9.8,  gorduras: 0.2, fibras: 0.3, sodio: 6,   fonte: 'taco' },
  { id: 'taco-151', nome: 'Suco de abacaxi natural',        kcal: 51,  proteinas: 0.4, carboidratos: 12.7, gorduras: 0.1, fibras: 0.2, sodio: 1,   fonte: 'taco' },
  { id: 'taco-152', nome: 'Refrigerante cola',              kcal: 41,  proteinas: 0.0, carboidratos: 10.5, gorduras: 0.0, fibras: 0.0, sodio: 4,   fonte: 'taco' },

  // ── OUTROS / CONDIMENTOS ─────────────────────────────────────────────────
  { id: 'taco-153', nome: 'Amido de milho (maisena)',       kcal: 363, proteinas: 0.3, carboidratos: 89.7, gorduras: 0.1, fibras: 0.3, sodio: 1,   fonte: 'taco' },
  { id: 'taco-154', nome: 'Chocolate em pó 50% cacau',      kcal: 360, proteinas: 14.9, carboidratos: 51.3, gorduras: 14.8,fibras: 14.5,sodio: 27,  fonte: 'taco' },
  { id: 'taco-155', nome: 'Farinha de aveia',               kcal: 394, proteinas: 13.9, carboidratos: 66.6, gorduras: 8.5, fibras: 9.1, sodio: 4,   fonte: 'taco' },
  { id: 'taco-156', nome: 'Linhaça',                        kcal: 495, proteinas: 18.3, carboidratos: 28.9, gorduras: 34.4,fibras: 27.3,sodio: 6,   fonte: 'taco' },
  { id: 'taco-157', nome: 'Gergelim',                       kcal: 596, proteinas: 17.5, carboidratos: 21.6, gorduras: 51.5,fibras: 11.8,sodio: 5,   fonte: 'taco' },
  { id: 'taco-158', nome: 'Castanha-do-pará',               kcal: 643, proteinas: 14.3, carboidratos: 12.3, gorduras: 61.5,fibras: 7.9, sodio: 1,   fonte: 'taco' },
  { id: 'taco-159', nome: 'Amendoim torrado com sal',       kcal: 604, proteinas: 26.0, carboidratos: 22.0, gorduras: 48.0,fibras: 7.5, sodio: 391, fonte: 'taco' },
  { id: 'taco-160', nome: 'Sal de cozinha',                 kcal: 0,   proteinas: 0.0, carboidratos: 0.0,  gorduras: 0.0, fibras: 0.0, sodio: 39300,fonte: 'taco' },

  // ── CEREAIS EXTRAS ───────────────────────────────────────────────────────
  { id: 'taco-161', nome: 'Quinoa cozida',                 kcal: 120, proteinas: 4.4, carboidratos: 21.3, gorduras: 1.9, fibras: 2.8, sodio: 7,   fonte: 'taco' },
  { id: 'taco-162', nome: 'Granola',                       kcal: 415, proteinas: 9.8, carboidratos: 65.7, gorduras: 13.5,fibras: 5.9, sodio: 58,  fonte: 'taco' },
  { id: 'taco-163', nome: 'Pão de queijo',                 kcal: 279, proteinas: 4.7, carboidratos: 42.7, gorduras: 10.1,fibras: 1.3, sodio: 186, fonte: 'taco' },
  { id: 'taco-164', nome: 'Farinha de rosca',              kcal: 380, proteinas: 10.5,carboidratos: 76.1, gorduras: 3.5, fibras: 2.5, sodio: 480, fonte: 'taco' },
  { id: 'taco-165', nome: 'Farinha de milho seca',         kcal: 349, proteinas: 7.8, carboidratos: 74.4, gorduras: 2.0, fibras: 7.3, sodio: 1,   fonte: 'taco' },
  { id: 'taco-166', nome: 'Polvilho azedo',                kcal: 345, proteinas: 0.2, carboidratos: 85.5, gorduras: 0.2, fibras: 0.0, sodio: 1,   fonte: 'taco' },
  { id: 'taco-167', nome: 'Polvilho doce',                 kcal: 347, proteinas: 0.2, carboidratos: 86.5, gorduras: 0.2, fibras: 0.0, sodio: 1,   fonte: 'taco' },

  // ── LEGUMINOSAS EXTRAS ───────────────────────────────────────────────────
  { id: 'taco-168', nome: 'Feijão branco cozido',          kcal: 139, proteinas: 9.1, carboidratos: 25.3, gorduras: 0.5, fibras: 7.0, sodio: 4,   fonte: 'taco' },
  { id: 'taco-169', nome: 'Feijão azuki cozido',           kcal: 128, proteinas: 7.5, carboidratos: 24.8, gorduras: 0.1, fibras: 7.3, sodio: 3,   fonte: 'taco' },
  { id: 'taco-170', nome: 'Feijão moyashi cozido',         kcal: 30,  proteinas: 3.2, carboidratos: 5.9,  gorduras: 0.2, fibras: 1.5, sodio: 6,   fonte: 'taco' },

  // ── CARNES BOVINAS EXTRAS ────────────────────────────────────────────────
  { id: 'taco-171', nome: 'Contrafilé grelhado',           kcal: 279, proteinas: 30.5,carboidratos: 0.0,  gorduras: 17.2,fibras: 0.0, sodio: 65,  fonte: 'taco' },
  { id: 'taco-172', nome: 'Picanha assada',                kcal: 373, proteinas: 26.5,carboidratos: 0.0,  gorduras: 29.5,fibras: 0.0, sodio: 70,  fonte: 'taco' },
  { id: 'taco-173', nome: 'Filé mignon grelhado',          kcal: 219, proteinas: 32.8,carboidratos: 0.0,  gorduras: 9.7, fibras: 0.0, sodio: 58,  fonte: 'taco' },
  { id: 'taco-174', nome: 'Fraldinha bovina grelhada',     kcal: 255, proteinas: 30.1,carboidratos: 0.0,  gorduras: 14.8,fibras: 0.0, sodio: 60,  fonte: 'taco' },
  { id: 'taco-175', nome: 'Carne seca cozida dessalgada',  kcal: 247, proteinas: 40.3,carboidratos: 0.0,  gorduras: 9.3, fibras: 0.0, sodio: 1420,fonte: 'taco' },
  { id: 'taco-176', nome: 'Charque bovino cozido',         kcal: 231, proteinas: 38.5,carboidratos: 0.0,  gorduras: 8.2, fibras: 0.0, sodio: 1350,fonte: 'taco' },
  { id: 'taco-177', nome: 'Buchada de bode cozida',        kcal: 143, proteinas: 18.6,carboidratos: 0.0,  gorduras: 7.5, fibras: 0.0, sodio: 88,  fonte: 'taco' },

  // ── SUÍNOS EXTRAS ────────────────────────────────────────────────────────
  { id: 'taco-178', nome: 'Pernil suíno assado',           kcal: 265, proteinas: 28.7,carboidratos: 0.0,  gorduras: 16.5,fibras: 0.0, sodio: 71,  fonte: 'taco' },
  { id: 'taco-179', nome: 'Carne suína paleta cozida',     kcal: 236, proteinas: 28.2,carboidratos: 0.0,  gorduras: 13.5,fibras: 0.0, sodio: 64,  fonte: 'taco' },
  { id: 'taco-180', nome: 'Lombo suíno defumado',          kcal: 190, proteinas: 22.8,carboidratos: 0.0,  gorduras: 10.7,fibras: 0.0, sodio: 940, fonte: 'taco' },

  // ── PEIXES E FRUTOS DO MAR EXTRAS ───────────────────────────────────────
  { id: 'taco-181', nome: 'Peixe cação cozido',            kcal: 115, proteinas: 24.1,carboidratos: 0.0,  gorduras: 1.8, fibras: 0.0, sodio: 68,  fonte: 'taco' },
  { id: 'taco-182', nome: 'Peixe dourado grelhado',        kcal: 112, proteinas: 23.5,carboidratos: 0.0,  gorduras: 1.8, fibras: 0.0, sodio: 55,  fonte: 'taco' },
  { id: 'taco-183', nome: 'Peixe robalo cozido',           kcal: 99,  proteinas: 22.0,carboidratos: 0.0,  gorduras: 1.2, fibras: 0.0, sodio: 54,  fonte: 'taco' },
  { id: 'taco-184', nome: 'Polvo cozido',                  kcal: 82,  proteinas: 17.0,carboidratos: 0.0,  gorduras: 1.2, fibras: 0.0, sodio: 160, fonte: 'taco' },
  { id: 'taco-185', nome: 'Lula cozida',                   kcal: 92,  proteinas: 18.2,carboidratos: 1.3,  gorduras: 1.5, fibras: 0.0, sodio: 210, fonte: 'taco' },
  { id: 'taco-186', nome: 'Caranguejo cozido',             kcal: 89,  proteinas: 17.9,carboidratos: 0.0,  gorduras: 1.8, fibras: 0.0, sodio: 395, fonte: 'taco' },
  { id: 'taco-187', nome: 'Lagostim cozido',               kcal: 90,  proteinas: 19.2,carboidratos: 0.0,  gorduras: 1.0, fibras: 0.0, sodio: 340, fonte: 'taco' },
  { id: 'taco-188', nome: 'Mariscos cozidos',              kcal: 86,  proteinas: 14.9,carboidratos: 3.7,  gorduras: 1.6, fibras: 0.0, sodio: 286, fonte: 'taco' },

  // ── OVOS EXTRAS ──────────────────────────────────────────────────────────
  { id: 'taco-189', nome: 'Clara de ovo cozida',           kcal: 48,  proteinas: 10.8,carboidratos: 0.7,  gorduras: 0.0, fibras: 0.0, sodio: 166, fonte: 'taco' },
  { id: 'taco-190', nome: 'Gema de ovo cozida',            kcal: 328, proteinas: 15.9,carboidratos: 0.4,  gorduras: 28.3,fibras: 0.0, sodio: 48,  fonte: 'taco' },

  // ── LATICÍNIOS EXTRAS ────────────────────────────────────────────────────
  { id: 'taco-191', nome: 'Queijo coalho assado',          kcal: 289, proteinas: 21.2,carboidratos: 0.4,  gorduras: 22.2,fibras: 0.0, sodio: 548, fonte: 'taco' },
  { id: 'taco-192', nome: 'Queijo ricota',                 kcal: 134, proteinas: 9.7, carboidratos: 3.0,  gorduras: 9.5, fibras: 0.0, sodio: 100, fonte: 'taco' },
  { id: 'taco-193', nome: 'Cream cheese',                  kcal: 271, proteinas: 7.5, carboidratos: 4.1,  gorduras: 24.9,fibras: 0.0, sodio: 430, fonte: 'taco' },
  { id: 'taco-194', nome: 'Leite de coco',                 kcal: 197, proteinas: 2.0, carboidratos: 3.0,  gorduras: 20.0,fibras: 0.0, sodio: 15,  fonte: 'taco' },
  { id: 'taco-195', nome: 'Queijo gouda',                  kcal: 356, proteinas: 24.9,carboidratos: 2.2,  gorduras: 27.4,fibras: 0.0, sodio: 819, fonte: 'taco' },
  { id: 'taco-196', nome: 'Tofu firme',                    kcal: 76,  proteinas: 8.1, carboidratos: 1.9,  gorduras: 4.2, fibras: 0.3, sodio: 7,   fonte: 'taco' },
  { id: 'taco-197', nome: 'Bebida vegetal de soja',        kcal: 40,  proteinas: 3.3, carboidratos: 3.2,  gorduras: 1.8, fibras: 0.0, sodio: 34,  fonte: 'taco' },

  // ── HORTALIÇAS EXTRAS ────────────────────────────────────────────────────
  { id: 'taco-198', nome: 'Rúcula crua',                   kcal: 17,  proteinas: 1.6, carboidratos: 2.9,  gorduras: 0.3, fibras: 1.6, sodio: 27,  fonte: 'taco' },
  { id: 'taco-199', nome: 'Agrião cru',                    kcal: 18,  proteinas: 2.1, carboidratos: 2.1,  gorduras: 0.2, fibras: 1.5, sodio: 34,  fonte: 'taco' },
  { id: 'taco-200', nome: 'Almeirão cru',                  kcal: 13,  proteinas: 1.3, carboidratos: 1.7,  gorduras: 0.2, fibras: 2.0, sodio: 18,  fonte: 'taco' },
  { id: 'taco-201', nome: 'Cogumelo champignon cru',       kcal: 16,  proteinas: 2.5, carboidratos: 2.8,  gorduras: 0.3, fibras: 1.6, sodio: 3,   fonte: 'taco' },
  { id: 'taco-202', nome: 'Cogumelo champignon cozido',    kcal: 28,  proteinas: 2.1, carboidratos: 5.3,  gorduras: 0.3, fibras: 2.0, sodio: 10,  fonte: 'taco' },
  { id: 'taco-203', nome: 'Cogumelo shitake cozido',       kcal: 56,  proteinas: 1.6, carboidratos: 14.4, gorduras: 0.2, fibras: 2.5, sodio: 5,   fonte: 'taco' },
  { id: 'taco-204', nome: 'Aspargo cozido',                kcal: 20,  proteinas: 2.2, carboidratos: 3.2,  gorduras: 0.2, fibras: 2.1, sodio: 8,   fonte: 'taco' },
  { id: 'taco-205', nome: 'Palmito cozido',                kcal: 28,  proteinas: 2.7, carboidratos: 4.3,  gorduras: 0.5, fibras: 2.8, sodio: 210, fonte: 'taco' },
  { id: 'taco-206', nome: 'Alho-poró cozido',              kcal: 27,  proteinas: 0.9, carboidratos: 6.0,  gorduras: 0.2, fibras: 1.5, sodio: 8,   fonte: 'taco' },
  { id: 'taco-207', nome: 'Maxixe cozido',                 kcal: 15,  proteinas: 0.8, carboidratos: 3.1,  gorduras: 0.2, fibras: 1.2, sodio: 5,   fonte: 'taco' },
  { id: 'taco-208', nome: 'Nabo cozido',                   kcal: 22,  proteinas: 0.9, carboidratos: 4.7,  gorduras: 0.1, fibras: 2.2, sodio: 20,  fonte: 'taco' },
  { id: 'taco-209', nome: 'Rabanete cru',                  kcal: 15,  proteinas: 0.8, carboidratos: 3.3,  gorduras: 0.1, fibras: 1.6, sodio: 29,  fonte: 'taco' },
  { id: 'taco-210', nome: 'Cebolinha crua',                kcal: 30,  proteinas: 1.8, carboidratos: 6.6,  gorduras: 0.2, fibras: 2.6, sodio: 16,  fonte: 'taco' },
  { id: 'taco-211', nome: 'Salsinha crua',                 kcal: 36,  proteinas: 3.0, carboidratos: 6.3,  gorduras: 0.5, fibras: 3.3, sodio: 56,  fonte: 'taco' },
  { id: 'taco-212', nome: 'Acelga crua',                   kcal: 17,  proteinas: 1.7, carboidratos: 2.6,  gorduras: 0.2, fibras: 1.6, sodio: 213, fonte: 'taco' },
  { id: 'taco-213', nome: 'Ervilha fresca crua',           kcal: 78,  proteinas: 5.4, carboidratos: 14.2, gorduras: 0.4, fibras: 5.7, sodio: 3,   fonte: 'taco' },
  { id: 'taco-214', nome: 'Ervilha torta crua',            kcal: 42,  proteinas: 2.8, carboidratos: 7.6,  gorduras: 0.2, fibras: 2.6, sodio: 4,   fonte: 'taco' },
  { id: 'taco-215', nome: 'Mandioquinha cozida',           kcal: 78,  proteinas: 1.4, carboidratos: 18.5, gorduras: 0.1, fibras: 2.8, sodio: 13,  fonte: 'taco' },
  { id: 'taco-216', nome: 'Inhame cozido',                 kcal: 116, proteinas: 1.5, carboidratos: 27.5, gorduras: 0.1, fibras: 4.1, sodio: 9,   fonte: 'taco' },
  { id: 'taco-217', nome: 'Bardana cozida',                kcal: 88,  proteinas: 1.7, carboidratos: 21.1, gorduras: 0.1, fibras: 3.9, sodio: 5,   fonte: 'taco' },

  // ── FRUTAS EXTRAS ────────────────────────────────────────────────────────
  { id: 'taco-218', nome: 'Tangerina crua',                kcal: 38,  proteinas: 0.7, carboidratos: 9.8,  gorduras: 0.2, fibras: 1.3, sodio: 2,   fonte: 'taco' },
  { id: 'taco-219', nome: 'Limão tahiti cru',              kcal: 30,  proteinas: 1.0, carboidratos: 7.3,  gorduras: 0.2, fibras: 2.3, sodio: 2,   fonte: 'taco' },
  { id: 'taco-220', nome: 'Caqui cru',                     kcal: 67,  proteinas: 0.6, carboidratos: 18.6, gorduras: 0.2, fibras: 2.5, sodio: 1,   fonte: 'taco' },
  { id: 'taco-221', nome: 'Carambola crua',                kcal: 37,  proteinas: 0.6, carboidratos: 9.4,  gorduras: 0.1, fibras: 2.8, sodio: 2,   fonte: 'taco' },
  { id: 'taco-222', nome: 'Kiwi cru',                      kcal: 60,  proteinas: 1.1, carboidratos: 14.7, gorduras: 0.6, fibras: 3.0, sodio: 5,   fonte: 'taco' },
  { id: 'taco-223', nome: 'Amora crua',                    kcal: 43,  proteinas: 1.4, carboidratos: 9.6,  gorduras: 0.3, fibras: 4.9, sodio: 1,   fonte: 'taco' },
  { id: 'taco-224', nome: 'Figo cru',                      kcal: 74,  proteinas: 0.7, carboidratos: 19.2, gorduras: 0.2, fibras: 2.9, sodio: 1,   fonte: 'taco' },
  { id: 'taco-225', nome: 'Pitaya crua',                   kcal: 50,  proteinas: 1.2, carboidratos: 11.2, gorduras: 0.4, fibras: 3.0, sodio: 2,   fonte: 'taco' },
  { id: 'taco-226', nome: 'Graviola crua',                 kcal: 62,  proteinas: 1.0, carboidratos: 14.9, gorduras: 0.3, fibras: 3.3, sodio: 14,  fonte: 'taco' },
  { id: 'taco-227', nome: 'Ameixa fresca crua',            kcal: 46,  proteinas: 0.7, carboidratos: 11.2, gorduras: 0.1, fibras: 1.4, sodio: 1,   fonte: 'taco' },
  { id: 'taco-228', nome: 'Framboesa crua',                kcal: 52,  proteinas: 1.2, carboidratos: 11.9, gorduras: 0.7, fibras: 6.5, sodio: 1,   fonte: 'taco' },
  { id: 'taco-229', nome: 'Mirtilo cru',                   kcal: 57,  proteinas: 0.7, carboidratos: 14.5, gorduras: 0.3, fibras: 2.4, sodio: 1,   fonte: 'taco' },
  { id: 'taco-230', nome: 'Jabuticaba crua',               kcal: 58,  proteinas: 0.6, carboidratos: 14.2, gorduras: 0.1, fibras: 2.2, sodio: 1,   fonte: 'taco' },
  { id: 'taco-231', nome: 'Uva Thompson crua',             kcal: 70,  proteinas: 0.6, carboidratos: 18.1, gorduras: 0.2, fibras: 0.9, sodio: 1,   fonte: 'taco' },
  { id: 'taco-232', nome: 'Manga Palmer crua',             kcal: 61,  proteinas: 0.4, carboidratos: 16.1, gorduras: 0.2, fibras: 1.5, sodio: 1,   fonte: 'taco' },
  { id: 'taco-233', nome: 'Cupuaçu polpa crua',            kcal: 49,  proteinas: 1.5, carboidratos: 10.9, gorduras: 0.5, fibras: 2.3, sodio: 3,   fonte: 'taco' },
  { id: 'taco-234', nome: 'Açaí polpa congelada',          kcal: 70,  proteinas: 1.5, carboidratos: 4.0,  gorduras: 5.0, fibras: 2.6, sodio: 0,   fonte: 'taco' },

  // ── OLEAGINOSAS E SEMENTES ───────────────────────────────────────────────
  { id: 'taco-235', nome: 'Castanha de caju torrada s/sal',kcal: 570, proteinas: 18.5,carboidratos: 32.7, gorduras: 44.0,fibras: 3.7, sodio: 12,  fonte: 'taco' },
  { id: 'taco-236', nome: 'Nozes',                         kcal: 620, proteinas: 14.3,carboidratos: 13.7, gorduras: 58.8,fibras: 4.6, sodio: 1,   fonte: 'taco' },
  { id: 'taco-237', nome: 'Amêndoas',                      kcal: 626, proteinas: 21.2,carboidratos: 19.7, gorduras: 52.5,fibras: 11.6,sodio: 6,   fonte: 'taco' },
  { id: 'taco-238', nome: 'Sementes de chia',              kcal: 490, proteinas: 15.6,carboidratos: 42.1, gorduras: 30.7,fibras: 34.4,sodio: 16,  fonte: 'taco' },
  { id: 'taco-239', nome: 'Sementes de abóbora',           kcal: 541, proteinas: 28.8,carboidratos: 17.8, gorduras: 44.6,fibras: 3.9, sodio: 5,   fonte: 'taco' },
  { id: 'taco-240', nome: 'Pistache torrado s/sal',        kcal: 569, proteinas: 20.2,carboidratos: 27.5, gorduras: 45.0,fibras: 10.3,sodio: 0,   fonte: 'taco' },
  { id: 'taco-241', nome: 'Avelã',                         kcal: 628, proteinas: 12.9,carboidratos: 17.0, gorduras: 60.8,fibras: 9.7, sodio: 0,   fonte: 'taco' },
  { id: 'taco-242', nome: 'Macadâmia',                     kcal: 718, proteinas: 7.9, carboidratos: 13.8, gorduras: 75.8,fibras: 8.6, sodio: 5,   fonte: 'taco' },

  // ── GORDURAS EXTRAS ──────────────────────────────────────────────────────
  { id: 'taco-243', nome: 'Óleo de coco',                  kcal: 884, proteinas: 0.0, carboidratos: 0.0,  gorduras: 100.0,fibras: 0.0, sodio: 0,  fonte: 'taco' },
  { id: 'taco-244', nome: 'Banha de porco',                kcal: 897, proteinas: 0.0, carboidratos: 0.0,  gorduras: 99.7, fibras: 0.0, sodio: 0,  fonte: 'taco' },
  { id: 'taco-245', nome: 'Creme vegetal light',           kcal: 258, proteinas: 0.1, carboidratos: 0.2,  gorduras: 28.5, fibras: 0.0, sodio: 360,fonte: 'taco' },

  // ── BEBIDAS EXTRAS ───────────────────────────────────────────────────────
  { id: 'taco-246', nome: 'Suco de acerola natural',       kcal: 39,  proteinas: 0.5, carboidratos: 9.6,  gorduras: 0.1, fibras: 0.2, sodio: 3,   fonte: 'taco' },
  { id: 'taco-247', nome: 'Suco de caju natural',          kcal: 42,  proteinas: 0.8, carboidratos: 9.2,  gorduras: 0.4, fibras: 0.2, sodio: 2,   fonte: 'taco' },
  { id: 'taco-248', nome: 'Suco de goiaba natural',        kcal: 57,  proteinas: 1.0, carboidratos: 14.0, gorduras: 0.2, fibras: 0.9, sodio: 2,   fonte: 'taco' },
  { id: 'taco-249', nome: 'Suco de uva natural',           kcal: 70,  proteinas: 0.5, carboidratos: 17.5, gorduras: 0.1, fibras: 0.2, sodio: 3,   fonte: 'taco' },
  { id: 'taco-250', nome: 'Chá-mate infusão',              kcal: 4,   proteinas: 0.2, carboidratos: 0.8,  gorduras: 0.0, fibras: 0.0, sodio: 1,   fonte: 'taco' },

  // ── CONDIMENTOS EXTRAS ───────────────────────────────────────────────────
  { id: 'taco-251', nome: 'Molho shoyu',                   kcal: 60,  proteinas: 5.3, carboidratos: 8.2,  gorduras: 0.1, fibras: 0.0, sodio: 5350,fonte: 'taco' },
  { id: 'taco-252', nome: 'Ketchup',                       kcal: 89,  proteinas: 1.5, carboidratos: 21.4, gorduras: 0.3, fibras: 0.8, sodio: 991, fonte: 'taco' },
  { id: 'taco-253', nome: 'Mostarda preparada',            kcal: 67,  proteinas: 3.9, carboidratos: 6.1,  gorduras: 3.7, fibras: 3.2, sodio: 987, fonte: 'taco' },
  { id: 'taco-254', nome: 'Vinagre',                       kcal: 14,  proteinas: 0.1, carboidratos: 3.5,  gorduras: 0.0, fibras: 0.0, sodio: 4,   fonte: 'taco' },
  { id: 'taco-255', nome: 'Molho inglês (Worcestershire)', kcal: 78,  proteinas: 0.0, carboidratos: 19.4, gorduras: 0.0, fibras: 0.0, sodio: 980, fonte: 'taco' },
  { id: 'taco-256', nome: 'Tabasco / Molho de pimenta',   kcal: 11,  proteinas: 0.4, carboidratos: 1.7,  gorduras: 0.0, fibras: 0.4, sodio: 2110,fonte: 'taco' },
  { id: 'taco-257', nome: 'Caldo de galinha tablete',      kcal: 230, proteinas: 5.2, carboidratos: 27.8, gorduras: 11.3,fibras: 0.0, sodio: 9290,fonte: 'taco' },
  { id: 'taco-258', nome: 'Caldo de carne tablete',        kcal: 226, proteinas: 5.0, carboidratos: 27.0, gorduras: 10.9,fibras: 0.0, sodio: 9100,fonte: 'taco' },
];
