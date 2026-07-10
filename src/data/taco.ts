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
  // Cereais e derivados
  { id: 'taco-01', nome: 'Arroz branco cozido', kcal: 128, proteinas: 2.5, carboidratos: 28.1, gorduras: 0.2, fibras: 1.6, sodio: 1, fonte: 'taco' },
  { id: 'taco-02', nome: 'Arroz integral cozido', kcal: 124, proteinas: 2.6, carboidratos: 25.8, gorduras: 1.0, fibras: 2.7, sodio: 2, fonte: 'taco' },
  { id: 'taco-03', nome: 'Macarrão cozido', kcal: 110, proteinas: 3.8, carboidratos: 22.5, gorduras: 0.5, fibras: 1.5, sodio: 4, fonte: 'taco' },
  { id: 'taco-04', nome: 'Pão francês', kcal: 300, proteinas: 8.0, carboidratos: 58.6, gorduras: 3.1, fibras: 2.3, sodio: 504, fonte: 'taco' },
  { id: 'taco-05', nome: 'Farinha de trigo', kcal: 360, proteinas: 9.8, carboidratos: 75.1, gorduras: 1.4, fibras: 2.3, sodio: 2, fonte: 'taco' },
  { id: 'taco-06', nome: 'Farinha de mandioca torrada', kcal: 361, proteinas: 1.7, carboidratos: 87.9, gorduras: 0.3, fibras: 6.2, sodio: 9, fonte: 'taco' },
  { id: 'taco-07', nome: 'Fubá de milho', kcal: 354, proteinas: 7.8, carboidratos: 74.0, gorduras: 2.0, fibras: 6.4, sodio: 1, fonte: 'taco' },
  { id: 'taco-08', nome: 'Aveia em flocos', kcal: 394, proteinas: 13.9, carboidratos: 66.6, gorduras: 8.5, fibras: 9.1, sodio: 4, fonte: 'taco' },

  // Leguminosas
  { id: 'taco-09', nome: 'Feijão preto cozido', kcal: 77, proteinas: 4.5, carboidratos: 14.0, gorduras: 0.5, fibras: 8.4, sodio: 2, fonte: 'taco' },
  { id: 'taco-10', nome: 'Feijão carioca cozido', kcal: 76, proteinas: 4.8, carboidratos: 13.6, gorduras: 0.5, fibras: 8.5, sodio: 2, fonte: 'taco' },
  { id: 'taco-11', nome: 'Lentilha cozida', kcal: 93, proteinas: 6.3, carboidratos: 16.6, gorduras: 0.5, fibras: 3.7, sodio: 3, fonte: 'taco' },
  { id: 'taco-12', nome: 'Grão-de-bico cozido', kcal: 164, proteinas: 9.0, carboidratos: 27.4, gorduras: 2.7, fibras: 6.0, sodio: 7, fonte: 'taco' },
  { id: 'taco-13', nome: 'Ervilha cozida', kcal: 74, proteinas: 5.4, carboidratos: 12.4, gorduras: 0.4, fibras: 5.7, sodio: 3, fonte: 'taco' },
  { id: 'taco-14', nome: 'Soja cozida', kcal: 141, proteinas: 14.6, carboidratos: 10.7, gorduras: 6.3, fibras: 10.9, sodio: 4, fonte: 'taco' },

  // Carnes e ovos
  { id: 'taco-15', nome: 'Carne bovina patinho cozido', kcal: 219, proteinas: 32.9, carboidratos: 0.0, gorduras: 9.6, fibras: 0.0, sodio: 60, fonte: 'taco' },
  { id: 'taco-16', nome: 'Carne bovina acém cozido', kcal: 265, proteinas: 29.4, carboidratos: 0.0, gorduras: 16.2, fibras: 0.0, sodio: 59, fonte: 'taco' },
  { id: 'taco-17', nome: 'Frango peito grelhado', kcal: 159, proteinas: 32.0, carboidratos: 0.0, gorduras: 2.8, fibras: 0.0, sodio: 92, fonte: 'taco' },
  { id: 'taco-18', nome: 'Frango coxa assada', kcal: 232, proteinas: 26.1, carboidratos: 0.0, gorduras: 14.2, fibras: 0.0, sodio: 104, fonte: 'taco' },
  { id: 'taco-19', nome: 'Ovo de galinha cozido', kcal: 146, proteinas: 13.3, carboidratos: 0.6, gorduras: 9.5, fibras: 0.0, sodio: 144, fonte: 'taco' },
  { id: 'taco-20', nome: 'Peixe tilápia assada', kcal: 96, proteinas: 21.2, carboidratos: 0.0, gorduras: 1.0, fibras: 0.0, sodio: 60, fonte: 'taco' },
  { id: 'taco-21', nome: 'Peixe salmão grelhado', kcal: 185, proteinas: 27.3, carboidratos: 0.0, gorduras: 8.1, fibras: 0.0, sodio: 75, fonte: 'taco' },
  { id: 'taco-22', nome: 'Sardinha em lata', kcal: 208, proteinas: 23.5, carboidratos: 0.0, gorduras: 12.4, fibras: 0.0, sodio: 399, fonte: 'taco' },
  { id: 'taco-23', nome: 'Atum em lata', kcal: 132, proteinas: 26.7, carboidratos: 0.0, gorduras: 2.7, fibras: 0.0, sodio: 396, fonte: 'taco' },
  { id: 'taco-24', nome: 'Linguiça suína cozida', kcal: 272, proteinas: 17.5, carboidratos: 1.3, gorduras: 21.9, fibras: 0.0, sodio: 858, fonte: 'taco' },
  { id: 'taco-25', nome: 'Carne suína lombo assado', kcal: 197, proteinas: 27.3, carboidratos: 0.0, gorduras: 9.4, fibras: 0.0, sodio: 63, fonte: 'taco' },

  // Laticínios
  { id: 'taco-26', nome: 'Leite de vaca integral', kcal: 61, proteinas: 3.2, carboidratos: 4.7, gorduras: 3.2, fibras: 0.0, sodio: 45, fonte: 'taco' },
  { id: 'taco-27', nome: 'Leite de vaca desnatado', kcal: 35, proteinas: 3.5, carboidratos: 5.0, gorduras: 0.2, fibras: 0.0, sodio: 51, fonte: 'taco' },
  { id: 'taco-28', nome: 'Iogurte natural integral', kcal: 66, proteinas: 4.1, carboidratos: 7.2, gorduras: 2.4, fibras: 0.0, sodio: 53, fonte: 'taco' },
  { id: 'taco-29', nome: 'Queijo mussarela', kcal: 300, proteinas: 22.2, carboidratos: 2.1, gorduras: 22.8, fibras: 0.0, sodio: 510, fonte: 'taco' },
  { id: 'taco-30', nome: 'Queijo minas frescal', kcal: 264, proteinas: 17.4, carboidratos: 1.4, gorduras: 20.2, fibras: 0.0, sodio: 388, fonte: 'taco' },
  { id: 'taco-31', nome: 'Queijo parmesão', kcal: 455, proteinas: 35.6, carboidratos: 0.0, gorduras: 35.1, fibras: 0.0, sodio: 1376, fonte: 'taco' },
  { id: 'taco-32', nome: 'Manteiga sem sal', kcal: 726, proteinas: 0.4, carboidratos: 0.0, gorduras: 83.2, fibras: 0.0, sodio: 9, fonte: 'taco' },

  // Hortaliças
  { id: 'taco-33', nome: 'Alface crua', kcal: 11, proteinas: 1.3, carboidratos: 1.7, gorduras: 0.2, fibras: 1.8, sodio: 9, fonte: 'taco' },
  { id: 'taco-34', nome: 'Tomate cru', kcal: 15, proteinas: 1.1, carboidratos: 3.1, gorduras: 0.2, fibras: 1.2, sodio: 4, fonte: 'taco' },
  { id: 'taco-35', nome: 'Cenoura crua', kcal: 34, proteinas: 0.6, carboidratos: 8.2, gorduras: 0.1, fibras: 3.2, sodio: 47, fonte: 'taco' },
  { id: 'taco-36', nome: 'Beterraba crua', kcal: 31, proteinas: 1.3, carboidratos: 7.0, gorduras: 0.1, fibras: 2.0, sodio: 37, fonte: 'taco' },
  { id: 'taco-37', nome: 'Batata inglesa cozida', kcal: 52, proteinas: 1.2, carboidratos: 11.9, gorduras: 0.1, fibras: 1.8, sodio: 3, fonte: 'taco' },
  { id: 'taco-38', nome: 'Batata-doce cozida', kcal: 77, proteinas: 0.6, carboidratos: 18.4, gorduras: 0.1, fibras: 2.2, sodio: 34, fonte: 'taco' },
  { id: 'taco-39', nome: 'Mandioca cozida', kcal: 125, proteinas: 0.6, carboidratos: 30.1, gorduras: 0.3, fibras: 1.9, sodio: 10, fonte: 'taco' },
  { id: 'taco-40', nome: 'Chuchu cozido', kcal: 19, proteinas: 0.5, carboidratos: 4.5, gorduras: 0.1, fibras: 1.7, sodio: 4, fonte: 'taco' },
  { id: 'taco-41', nome: 'Abobrinha cozida', kcal: 16, proteinas: 1.2, carboidratos: 2.8, gorduras: 0.3, fibras: 1.4, sodio: 4, fonte: 'taco' },
  { id: 'taco-42', nome: 'Espinafre cru', kcal: 22, proteinas: 2.2, carboidratos: 3.4, gorduras: 0.4, fibras: 2.2, sodio: 79, fonte: 'taco' },
  { id: 'taco-43', nome: 'Brócolis cozido', kcal: 25, proteinas: 2.7, carboidratos: 3.6, gorduras: 0.3, fibras: 2.6, sodio: 21, fonte: 'taco' },
  { id: 'taco-44', nome: 'Couve refogada', kcal: 30, proteinas: 2.1, carboidratos: 4.2, gorduras: 0.6, fibras: 2.0, sodio: 7, fonte: 'taco' },
  { id: 'taco-45', nome: 'Cebola crua', kcal: 30, proteinas: 1.2, carboidratos: 6.8, gorduras: 0.1, fibras: 2.4, sodio: 2, fonte: 'taco' },
  { id: 'taco-46', nome: 'Alho cru', kcal: 98, proteinas: 4.4, carboidratos: 22.0, gorduras: 0.1, fibras: 4.3, sodio: 8, fonte: 'taco' },
  { id: 'taco-47', nome: 'Pimentão vermelho cru', kcal: 28, proteinas: 1.3, carboidratos: 6.3, gorduras: 0.3, fibras: 2.1, sodio: 3, fonte: 'taco' },
  { id: 'taco-48', nome: 'Milho verde cozido', kcal: 75, proteinas: 2.5, carboidratos: 17.0, gorduras: 0.6, fibras: 1.8, sodio: 256, fonte: 'taco' },

  // Frutas
  { id: 'taco-49', nome: 'Banana prata crua', kcal: 98, proteinas: 1.3, carboidratos: 26.0, gorduras: 0.1, fibras: 2.0, sodio: 1, fonte: 'taco' },
  { id: 'taco-50', nome: 'Maçã crua', kcal: 56, proteinas: 0.3, carboidratos: 15.2, gorduras: 0.1, fibras: 2.0, sodio: 1, fonte: 'taco' },
  { id: 'taco-51', nome: 'Laranja pera crua', kcal: 37, proteinas: 1.0, carboidratos: 8.9, gorduras: 0.1, fibras: 0.8, sodio: 1, fonte: 'taco' },
  { id: 'taco-52', nome: 'Mamão formosa cru', kcal: 45, proteinas: 0.5, carboidratos: 11.8, gorduras: 0.1, fibras: 1.8, sodio: 4, fonte: 'taco' },
  { id: 'taco-53', nome: 'Manga Tommy crua', kcal: 64, proteinas: 0.4, carboidratos: 17.0, gorduras: 0.3, fibras: 1.6, sodio: 2, fonte: 'taco' },
  { id: 'taco-54', nome: 'Abacaxi cru', kcal: 48, proteinas: 0.9, carboidratos: 12.3, gorduras: 0.1, fibras: 1.0, sodio: 1, fonte: 'taco' },
  { id: 'taco-55', nome: 'Uva comum crua', kcal: 68, proteinas: 1.0, carboidratos: 17.7, gorduras: 0.1, fibras: 0.9, sodio: 2, fonte: 'taco' },
  { id: 'taco-56', nome: 'Melancia crua', kcal: 33, proteinas: 0.9, carboidratos: 7.8, gorduras: 0.3, fibras: 0.5, sodio: 3, fonte: 'taco' },

  // Gorduras e óleos
  { id: 'taco-57', nome: 'Óleo de soja', kcal: 884, proteinas: 0.0, carboidratos: 0.0, gorduras: 100.0, fibras: 0.0, sodio: 0, fonte: 'taco' },
  { id: 'taco-58', nome: 'Azeite de oliva', kcal: 884, proteinas: 0.0, carboidratos: 0.0, gorduras: 100.0, fibras: 0.0, sodio: 2, fonte: 'taco' },
  { id: 'taco-59', nome: 'Margarina com sal', kcal: 530, proteinas: 0.1, carboidratos: 0.4, gorduras: 58.7, fibras: 0.0, sodio: 524, fonte: 'taco' },

  // Açúcares e doces
  { id: 'taco-60', nome: 'Açúcar refinado', kcal: 387, proteinas: 0.0, carboidratos: 99.5, gorduras: 0.0, fibras: 0.0, sodio: 1, fonte: 'taco' },
  { id: 'taco-61', nome: 'Mel de abelha', kcal: 309, proteinas: 0.4, carboidratos: 82.4, gorduras: 0.0, fibras: 0.2, sodio: 8, fonte: 'taco' },

  // Bebidas e outros
  { id: 'taco-62', nome: 'Café infusão', kcal: 2, proteinas: 0.3, carboidratos: 0.4, gorduras: 0.0, fibras: 0.0, sodio: 2, fonte: 'taco' },
  { id: 'taco-63', nome: 'Suco de laranja natural', kcal: 46, proteinas: 0.9, carboidratos: 11.4, gorduras: 0.1, fibras: 0.4, sodio: 1, fonte: 'taco' },
  { id: 'taco-64', nome: 'Chocolate em pó 50% cacau', kcal: 360, proteinas: 14.9, carboidratos: 51.3, gorduras: 14.8, fibras: 14.5, sodio: 27, fonte: 'taco' },
  { id: 'taco-65', nome: 'Amido de milho (maisena)', kcal: 363, proteinas: 0.3, carboidratos: 89.7, gorduras: 0.1, fibras: 0.3, sodio: 1, fonte: 'taco' },
];
