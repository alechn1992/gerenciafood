// USDA FoodData Central — valores por 100 g ou 100 ml.
// Fonte: U.S. Department of Agriculture, Agricultural Research Service.

import type { ItemTaco } from './taco';

export const USDA: ItemTaco[] = [
  // Sementes e oleaginosas
  { id: 'usda-01', nome: 'Semente de chia', kcal: 486, proteinas: 16.5, carboidratos: 42.1, gorduras: 30.7, fibras: 34.4, sodio: 16, fonte: 'usda' },
  { id: 'usda-02', nome: 'Semente de linhaça', kcal: 534, proteinas: 18.3, carboidratos: 28.9, gorduras: 42.2, fibras: 27.3, sodio: 30, fonte: 'usda' },
  { id: 'usda-03', nome: 'Gergelim torrado', kcal: 565, proteinas: 17.0, carboidratos: 25.7, gorduras: 48.0, fibras: 11.8, sodio: 11, fonte: 'usda' },
  { id: 'usda-04', nome: 'Amendoim torrado sem sal', kcal: 567, proteinas: 25.8, carboidratos: 21.5, gorduras: 49.2, fibras: 8.5, sodio: 6, fonte: 'usda' },
  { id: 'usda-05', nome: 'Pasta de amendoim', kcal: 588, proteinas: 25.1, carboidratos: 20.1, gorduras: 50.4, fibras: 6.0, sodio: 459, fonte: 'usda' },
  { id: 'usda-06', nome: 'Castanha-do-pará', kcal: 656, proteinas: 14.3, carboidratos: 11.7, gorduras: 66.4, fibras: 7.5, sodio: 3, fonte: 'usda' },
  { id: 'usda-07', nome: 'Castanha de caju torrada sem sal', kcal: 553, proteinas: 18.2, carboidratos: 30.2, gorduras: 43.9, fibras: 3.3, sodio: 12, fonte: 'usda' },
  { id: 'usda-08', nome: 'Amêndoa torrada sem sal', kcal: 579, proteinas: 21.2, carboidratos: 21.6, gorduras: 49.9, fibras: 12.5, sodio: 1, fonte: 'usda' },
  { id: 'usda-09', nome: 'Noz comum', kcal: 654, proteinas: 15.2, carboidratos: 13.7, gorduras: 65.2, fibras: 6.7, sodio: 2, fonte: 'usda' },

  // Cereais e pseudocereais
  { id: 'usda-10', nome: 'Quinoa cozida', kcal: 120, proteinas: 4.4, carboidratos: 21.3, gorduras: 1.9, fibras: 2.8, sodio: 7, fonte: 'usda' },
  { id: 'usda-11', nome: 'Granola sem adição de açúcar', kcal: 388, proteinas: 10.0, carboidratos: 60.4, gorduras: 13.2, fibras: 6.6, sodio: 24, fonte: 'usda' },
  { id: 'usda-12', nome: 'Farinha de amêndoa', kcal: 571, proteinas: 21.4, carboidratos: 21.4, gorduras: 50.0, fibras: 10.7, sodio: 1, fonte: 'usda' },

  // Proteínas alternativas
  { id: 'usda-13', nome: 'Tofu firme', kcal: 76, proteinas: 8.1, carboidratos: 1.9, gorduras: 4.8, fibras: 0.3, sodio: 7, fonte: 'usda' },
  { id: 'usda-14', nome: 'Proteína texturizada de soja (PTS) crua', kcal: 331, proteinas: 51.5, carboidratos: 33.9, gorduras: 1.2, fibras: 17.5, sodio: 9, fonte: 'usda' },
  { id: 'usda-15', nome: 'Tempeh', kcal: 193, proteinas: 20.3, carboidratos: 9.4, gorduras: 10.8, fibras: 0.0, sodio: 14, fonte: 'usda' },

  // Laticínios e derivados
  { id: 'usda-16', nome: 'Iogurte grego desnatado', kcal: 59, proteinas: 10.2, carboidratos: 3.6, gorduras: 0.4, fibras: 0.0, sodio: 36, fonte: 'usda' },
  { id: 'usda-17', nome: 'Cream cheese', kcal: 342, proteinas: 5.9, carboidratos: 4.1, gorduras: 34.2, fibras: 0.0, sodio: 321, fonte: 'usda' },
  { id: 'usda-18', nome: 'Ricota', kcal: 174, proteinas: 11.3, carboidratos: 3.0, gorduras: 13.0, fibras: 0.0, sodio: 84, fonte: 'usda' },
  { id: 'usda-19', nome: 'Cheddar', kcal: 403, proteinas: 24.9, carboidratos: 1.3, gorduras: 33.1, fibras: 0.0, sodio: 621, fonte: 'usda' },

  // Frutos do mar
  { id: 'usda-20', nome: 'Camarão cozido', kcal: 99, proteinas: 21.0, carboidratos: 0.0, gorduras: 1.1, fibras: 0.0, sodio: 224, fonte: 'usda' },
  { id: 'usda-21', nome: 'Bacalhau cozido', kcal: 105, proteinas: 22.8, carboidratos: 0.0, gorduras: 0.9, fibras: 0.0, sodio: 132, fonte: 'usda' },
  { id: 'usda-22', nome: 'Atum fresco grelhado', kcal: 184, proteinas: 29.9, carboidratos: 0.0, gorduras: 6.3, fibras: 0.0, sodio: 50, fonte: 'usda' },

  // Frutas e derivados
  { id: 'usda-23', nome: 'Abacate cru', kcal: 160, proteinas: 2.0, carboidratos: 8.5, gorduras: 14.7, fibras: 6.7, sodio: 7, fonte: 'usda' },
  { id: 'usda-24', nome: 'Coco ralado sem açúcar', kcal: 660, proteinas: 6.9, carboidratos: 23.6, gorduras: 64.5, fibras: 16.3, sodio: 37, fonte: 'usda' },
  { id: 'usda-25', nome: 'Leite de coco', kcal: 197, proteinas: 2.0, carboidratos: 2.8, gorduras: 21.3, fibras: 0.0, sodio: 13, fonte: 'usda' },
  { id: 'usda-26', nome: 'Morango cru', kcal: 32, proteinas: 0.7, carboidratos: 7.7, gorduras: 0.3, fibras: 2.0, sodio: 1, fonte: 'usda' },
  { id: 'usda-27', nome: 'Mirtilo (blueberry) cru', kcal: 57, proteinas: 0.7, carboidratos: 14.5, gorduras: 0.3, fibras: 2.4, sodio: 1, fonte: 'usda' },

  // Hortaliças
  { id: 'usda-28', nome: 'Cogumelo champignon cozido', kcal: 28, proteinas: 2.2, carboidratos: 5.3, gorduras: 0.5, fibras: 2.2, sodio: 9, fonte: 'usda' },
  { id: 'usda-29', nome: 'Aspargo cozido', kcal: 22, proteinas: 2.4, carboidratos: 4.1, gorduras: 0.2, fibras: 1.8, sodio: 2, fonte: 'usda' },
  { id: 'usda-30', nome: 'Couve-de-bruxelas cozida', kcal: 36, proteinas: 2.5, carboidratos: 7.1, gorduras: 0.5, fibras: 2.6, sodio: 16, fonte: 'usda' },
  { id: 'usda-31', nome: 'Pepino cru', kcal: 16, proteinas: 0.7, carboidratos: 3.6, gorduras: 0.1, fibras: 0.5, sodio: 2, fonte: 'usda' },
  { id: 'usda-32', nome: 'Repolho cru', kcal: 25, proteinas: 1.3, carboidratos: 5.8, gorduras: 0.1, fibras: 2.5, sodio: 18, fonte: 'usda' },
  { id: 'usda-33', nome: 'Aipo cru', kcal: 16, proteinas: 0.7, carboidratos: 3.0, gorduras: 0.2, fibras: 1.6, sodio: 80, fonte: 'usda' },
  { id: 'usda-34', nome: 'Abóbora cozida', kcal: 26, proteinas: 1.0, carboidratos: 6.5, gorduras: 0.1, fibras: 0.5, sodio: 1, fonte: 'usda' },

  // Gorduras
  { id: 'usda-35', nome: 'Óleo de coco', kcal: 892, proteinas: 0.0, carboidratos: 0.0, gorduras: 99.1, fibras: 0.0, sodio: 0, fonte: 'usda' },
];
