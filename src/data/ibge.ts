// Tabela de composição alimentar — alimentos típicos brasileiros levantados pelo
// IBGE (Pesquisa de Orçamentos Familiares / Inquérito Nacional de Alimentação).
// Valores por 100 g ou 100 ml, baseados em literatura nutricional brasileira.

import type { ItemTaco } from './taco';

export const IBGE: ItemTaco[] = [
  // Preparações nordestinas e regionais
  { id: 'ibge-01', nome: 'Carne seca (charque) cozida', kcal: 250, proteinas: 42.1, carboidratos: 0.0, gorduras: 8.8, fibras: 0.0, sodio: 1280, fonte: 'ibge' },
  { id: 'ibge-02', nome: 'Cuscuz de milho cozido', kcal: 128, proteinas: 2.4, carboidratos: 27.3, gorduras: 0.5, fibras: 1.6, sodio: 165, fonte: 'ibge' },
  { id: 'ibge-03', nome: 'Tapioca (goma hidratada)', kcal: 52, proteinas: 0.1, carboidratos: 12.8, gorduras: 0.0, fibras: 0.0, sodio: 1, fonte: 'ibge' },
  { id: 'ibge-04', nome: 'Paçoca de amendoim', kcal: 430, proteinas: 12.1, carboidratos: 55.3, gorduras: 19.2, fibras: 5.2, sodio: 178, fonte: 'ibge' },
  { id: 'ibge-05', nome: 'Rapadura', kcal: 380, proteinas: 0.6, carboidratos: 96.1, gorduras: 0.1, fibras: 0.7, sodio: 30, fonte: 'ibge' },
  { id: 'ibge-06', nome: 'Buchada de bode cozida', kcal: 178, proteinas: 18.4, carboidratos: 2.1, gorduras: 10.6, fibras: 0.0, sodio: 420, fonte: 'ibge' },
  { id: 'ibge-07', nome: 'Vatapá', kcal: 168, proteinas: 9.2, carboidratos: 11.4, gorduras: 9.8, fibras: 1.3, sodio: 386, fonte: 'ibge' },
  { id: 'ibge-08', nome: 'Acarajé', kcal: 268, proteinas: 12.0, carboidratos: 20.5, gorduras: 14.8, fibras: 5.4, sodio: 312, fonte: 'ibge' },

  // Derivados lácteos regionais
  { id: 'ibge-09', nome: 'Queijo coalho assado', kcal: 287, proteinas: 20.3, carboidratos: 1.8, gorduras: 22.4, fibras: 0.0, sodio: 596, fonte: 'ibge' },
  { id: 'ibge-10', nome: 'Coalhada seca', kcal: 140, proteinas: 9.8, carboidratos: 4.2, gorduras: 9.1, fibras: 0.0, sodio: 48, fonte: 'ibge' },
  { id: 'ibge-11', nome: 'Doce de leite cremoso', kcal: 321, proteinas: 7.2, carboidratos: 55.4, gorduras: 8.0, fibras: 0.0, sodio: 142, fonte: 'ibge' },
  { id: 'ibge-12', nome: 'Requeijão cremoso', kcal: 255, proteinas: 9.7, carboidratos: 2.4, gorduras: 23.0, fibras: 0.0, sodio: 441, fonte: 'ibge' },

  // Preparações típicas
  { id: 'ibge-13', nome: 'Pão de queijo assado', kcal: 296, proteinas: 6.8, carboidratos: 44.5, gorduras: 10.4, fibras: 0.4, sodio: 218, fonte: 'ibge' },
  { id: 'ibge-14', nome: 'Brigadeiro', kcal: 387, proteinas: 5.8, carboidratos: 62.4, gorduras: 13.0, fibras: 0.8, sodio: 95, fonte: 'ibge' },
  { id: 'ibge-15', nome: 'Canjica branca cozida', kcal: 112, proteinas: 2.2, carboidratos: 24.8, gorduras: 0.5, fibras: 1.4, sodio: 3, fonte: 'ibge' },
  { id: 'ibge-16', nome: 'Curau de milho', kcal: 100, proteinas: 2.4, carboidratos: 18.6, gorduras: 2.2, fibras: 0.5, sodio: 45, fonte: 'ibge' },
  { id: 'ibge-17', nome: 'Goiabada', kcal: 294, proteinas: 0.6, carboidratos: 76.7, gorduras: 0.2, fibras: 4.4, sodio: 13, fonte: 'ibge' },
  { id: 'ibge-18', nome: 'Pirão de farinha de mandioca', kcal: 76, proteinas: 0.9, carboidratos: 18.3, gorduras: 0.1, fibras: 1.5, sodio: 8, fonte: 'ibge' },

  // Hortaliças e raízes regionais
  { id: 'ibge-19', nome: 'Macaxeira (aipim) cozida', kcal: 130, proteinas: 1.1, carboidratos: 31.5, gorduras: 0.2, fibras: 1.4, sodio: 7, fonte: 'ibge' },
  { id: 'ibge-20', nome: 'Inhame cozido', kcal: 116, proteinas: 1.5, carboidratos: 27.5, gorduras: 0.1, fibras: 4.1, sodio: 9, fonte: 'ibge' },
  { id: 'ibge-21', nome: 'Taro (taioba) cozido', kcal: 142, proteinas: 0.5, carboidratos: 34.6, gorduras: 0.2, fibras: 4.3, sodio: 20, fonte: 'ibge' },
  { id: 'ibge-22', nome: 'Maxixe cozido', kcal: 14, proteinas: 0.8, carboidratos: 2.6, gorduras: 0.1, fibras: 1.5, sodio: 3, fonte: 'ibge' },

  // Peixes e frutos do mar regionais
  { id: 'ibge-23', nome: 'Pirarucu assado', kcal: 131, proteinas: 27.4, carboidratos: 0.0, gorduras: 1.9, fibras: 0.0, sodio: 75, fonte: 'ibge' },
  { id: 'ibge-24', nome: 'Tambaqui grelhado', kcal: 178, proteinas: 25.1, carboidratos: 0.0, gorduras: 8.5, fibras: 0.0, sodio: 68, fonte: 'ibge' },
  { id: 'ibge-25', nome: 'Surubim assado', kcal: 108, proteinas: 22.6, carboidratos: 0.0, gorduras: 1.8, fibras: 0.0, sodio: 57, fonte: 'ibge' },
];
