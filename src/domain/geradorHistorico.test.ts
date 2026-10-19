import { describe, it, expect } from 'vitest';
import { gerarPorHistorico } from './geradorHistorico';
import type { Cardapio, CategoriaPrato, DiaSemana, ItemCardapio, Prato, Turma } from './types';

const turma: Turma = {
  id: 't1', clienteId: 'c1', nome: 'Infantis', ordem: 0, restricoes: [],
  refeicoes: [{ tipoRefeicaoId: 'cafe', composicao: [] }, { tipoRefeicaoId: 'almoco', composicao: [] }],
};
const DIAS: DiaSemana[] = [1, 2, 3, 4, 5];

const id = (nome: string) => nome.toLowerCase().replace(/\s+/g, '-');
function catalogo(nomes: string[], inativos: string[] = []): Prato[] {
  return nomes.map((n) => ({ id: id(n), nome: n, categoria: 'outro', restricoes: [], tags: [], ativo: !inativos.includes(n) }));
}

/** Semana salva: para cada dia, as posições do almoço e do café, na ordem da planilha. */
function semana(inicio: string, almoco: string[][], cafe: string[][] = []): Cardapio {
  const itens: ItemCardapio[] = [];
  const add = (tipo: string, dias: string[][], cats: CategoriaPrato[]) =>
    dias.forEach((pos, d) => pos.forEach((nome, i) =>
      itens.push({ dia: DIAS[d], tipoRefeicaoId: tipo, categoria: cats[i] ?? 'outro', pratoId: id(nome), pratoNome: nome })));
  add('cafe', cafe, ['lanche', 'sobremesa']);
  add('almoco', almoco, ['acompanhamento', 'proteina', 'salada']);
  return { id: inicio, clienteId: 'c1', turmaId: 't1', semanaInicio: inicio, itens, geradoEm: '' };
}

const proteinas = ['Frango', 'Carne moída', 'Omelete', 'Peixe', 'Lasanha', 'Risoto', 'Nuggets', 'Strogonoff', 'Escondidinho', 'Panqueca'];
const s1 = semana('2026-10-05', proteinas.slice(0, 5).map((p) => ['Arroz', p, 'Saladas']), [['Chá', 'Banana'], ['Chá', 'Maçã'], ['Suco', 'Manga'], ['Chá', 'Melão'], ['Chá', 'Laranja']]);
const s2 = semana('2026-10-12', proteinas.slice(5).map((p) => ['Arroz', p, 'Saladas']), [['Chá', 'Uva'], ['Suco', 'Mamão'], ['Chá', 'Banana'], ['Chá', 'Pera'], ['Chá', 'Kiwi']]);
const pratos = catalogo(['Arroz', 'Saladas', 'Chá', 'Suco', ...proteinas, 'Banana', 'Maçã', 'Manga', 'Melão', 'Laranja', 'Uva', 'Mamão', 'Pera', 'Kiwi']);

function gerar(over: Partial<Parameters<typeof gerarPorHistorico>[0]> = {}) {
  return gerarPorHistorico({ clienteId: 'c1', turma, dias: DIAS, historico: [s1, s2], pratos, semanaInicio: '2026-10-19', seed: 42, ...over });
}
const doDia = (c: Cardapio, dia: DiaSemana, tipo: string) => c.itens.filter((i) => i.dia === dia && i.tipoRefeicaoId === tipo).map((i) => i.pratoNome);

describe('gerarPorHistorico', () => {
  it('monta uma semana nova com a mesma estrutura das semanas salvas', () => {
    const { cardapio, avisos } = gerar();
    expect(avisos).toEqual([]);
    expect(cardapio!.semanaInicio).toBe('2026-10-19');
    for (const dia of DIAS) {
      const almoco = doDia(cardapio!, dia, 'almoco');
      expect(almoco).toHaveLength(3);
      expect(almoco[0]).toBe('Arroz'); // posição fixa
      expect(almoco[2]).toBe('Saladas');
      expect(proteinas).toContain(almoco[1]);
      expect(doDia(cardapio!, dia, 'cafe')).toHaveLength(2);
    }
  });

  it('varia os pratos sem repetir na semana e prioriza os que não saíram na semana mais recente', () => {
    const { cardapio } = gerar();
    const doAlmoco = DIAS.map((d) => doDia(cardapio!, d, 'almoco')[1]);
    expect(new Set(doAlmoco).size).toBe(5);
    // A semana mais recente (12/10) usou as 5 últimas proteínas: a nova sai das 5 primeiras.
    expect(doAlmoco.every((p) => proteinas.slice(0, 5).includes(p))).toBe(true);
  });

  it('alterna pratos que se revezam na mesma posição (ex.: feijão preto e carioca)', () => {
    const feijoes = ['Feijão preto', 'Feijão carioca', 'Feijão preto', 'Feijão carioca', 'Feijão preto'];
    const h = ['2026-10-05', '2026-10-12'].map((ini) => semana(ini, feijoes.map((f, i) => ['Arroz', f, proteinas[i]])));
    const { cardapio } = gerar({ historico: h, pratos: catalogo(['Arroz', 'Feijão preto', 'Feijão carioca', ...proteinas]) });
    const doDiaFeijao = DIAS.map((d) => doDia(cardapio!, d, 'almoco')[1]);
    expect(new Set(doDiaFeijao)).toEqual(new Set(['Feijão preto', 'Feijão carioca']));
    expect(DIAS.map((d) => doDia(cardapio!, d, 'almoco')[0])).toEqual(Array(5).fill('Arroz'));
  });

  it('mantém a categoria de cada posição', () => {
    const { cardapio } = gerar();
    const almoco = cardapio!.itens.filter((i) => i.tipoRefeicaoId === 'almoco' && i.dia === 1);
    expect(almoco.map((i) => i.categoria)).toEqual(['acompanhamento', 'proteina', 'salada']);
  });

  it('não usa pratos desativados ou excluídos do receituário', () => {
    const { cardapio } = gerar({ pratos: catalogo(['Arroz', 'Saladas', 'Chá', 'Suco', ...proteinas, 'Banana'], ['Frango', 'Omelete']) });
    const usados = cardapio!.itens.map((i) => i.pratoNome);
    expect(usados).not.toContain('Frango');
    expect(usados).not.toContain('Omelete');
    expect(usados).not.toContain('Maçã'); // fora do catálogo
  });

  it('não copia a própria semana que está sendo gerada', () => {
    const { cardapio } = gerar({ historico: [s1], semanaInicio: '2026-10-05' });
    expect(cardapio).toBeNull();
  });

  it('avisa quando não há histórico', () => {
    const { cardapio, avisos } = gerar({ historico: [] });
    expect(cardapio).toBeNull();
    expect(avisos[0]).toMatch(/sem semanas anteriores/);
  });

  it('é determinístico pelo seed', () => {
    expect(gerar({ seed: 7 }).cardapio!.itens).toEqual(gerar({ seed: 7 }).cardapio!.itens);
  });

  it('não sorteia itens de evento (ex.: bolo dos aniversariantes) para outras semanas', () => {
    const lanches = ['Banana', 'Maçã', 'Bolo dos Aniversariantes + Maçã raspada', 'Melão', 'Laranja'];
    const h = [semana('2026-10-05', proteinas.slice(0, 5).map((p) => ['Arroz', p]), lanches.map((l) => ['Chá', l]))];
    const { cardapio } = gerar({ historico: h, pratos: catalogo(['Arroz', 'Chá', ...proteinas, ...lanches]) });
    expect(cardapio!.itens.map((i) => i.pratoNome).some((n) => /Aniversariantes/.test(n))).toBe(false);
  });

  it('trata leite materno/fórmula como bebida, mesmo em semanas importadas como "Proteína"', () => {
    const formula = 'Leite materno/Fórmula Infantil';
    const h = [semana('2026-10-05', DIAS.map(() => [formula]), DIAS.map((_, i) => [formula, ['Banana', 'Maçã', 'Manga', 'Melão', 'Laranja'][i]]))];
    const { cardapio } = gerar({ historico: h, pratos: catalogo([formula, 'Banana', 'Maçã', 'Manga', 'Melão', 'Laranja']) });
    const doAlmoco = cardapio!.itens.filter((i) => i.tipoRefeicaoId === 'almoco');
    expect(doAlmoco.every((i) => i.pratoNome === formula && i.categoria === 'bebida')).toBe(true);
    expect(cardapio!.itens.filter((i) => i.pratoNome === formula).every((i) => i.categoria === 'bebida')).toBe(true);
  });
});
