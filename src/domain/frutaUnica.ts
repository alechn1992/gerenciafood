// Mesma fruta para todas as turmas no mesmo dia e refeição. Muda só a forma de
// servir de cada turma: quem recebia a fruta amassada ou raspada (bebês)
// continua recebendo assim, quem recebia inteira continua inteira, e nos
// lanches combinados ("Pizza caseira + Morango") troca só a parte da fruta.

import { SAZONALIDADE } from '../data/sazonalidade';
import { aplicarConsistencia, consistenciaDe, consistenciaSugerida, nomeBase } from './consistencia';
import { ehFormula } from './pratosEspeciais';
import type { Cardapio, ItemCardapio, Prato } from './types';

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Nomes de frutas conhecidos, do mais longo ao mais curto (para "fruta-do-conde" vencer "fruta"). */
const FRUTAS: string[] = [
  ...SAZONALIDADE.filter((i) => i.categoria === 'fruta').flatMap((i) => i.nome.split('/')),
  'Salada de frutas',
  'Mexerica',
  'Tangerina',
  'Ponkan',
  'Bergamota',
  'Nectarina',
]
  .map((n) => normalizar(n))
  .filter(Boolean)
  .sort((a, b) => b.length - a.length);

/**
 * O trecho é uma fruta servida sozinha? "Uva verde sem semente cortada" e
 * "Maçã raspada" sim; "Bolo de banana" e "Banana com aveia" não (são preparações).
 */
export function ehFruta(trecho: string): boolean {
  if (ehFormula(trecho)) return false;
  const base = normalizar(nomeBase(trecho));
  const fruta = FRUTAS.find((f) => base === f || base.startsWith(`${f} `));
  if (!fruta) return false;
  const resto = base.slice(fruta.length);
  return !/\b(com|de|da|do|ao|na|no|em)\b/.test(resto) || fruta === 'salada de frutas';
}

/** Onde está uma fruta dentro de um cardápio: o item e o trecho (entre "+"). */
interface Ocorrencia {
  idx: number;
  trecho: number;
  texto: string;
}

const separar = (nome: string) => nome.split('+').map((p) => p.trim());

function frutasDoSlot(itens: ItemCardapio[], dia: number, refeicao: string): Ocorrencia[] {
  const out: Ocorrencia[] = [];
  itens.forEach((item, idx) => {
    if (item.dia !== dia || item.tipoRefeicaoId !== refeicao) return;
    separar(item.pratoNome).forEach((texto, trecho) => {
      if (ehFruta(texto)) out.push({ idx, trecho, texto });
    });
  });
  return out;
}

/**
 * Cada turma recebe fruta amassada/raspada (true) ou inteira (false)? Decide
 * pelo que a turma costuma receber nos cardápios salvos (a maioria vence).
 */
export function estiloDeTextura(cardapios: Cardapio[]): Record<string, boolean> {
  const conta: Record<string, { com: number; sem: number }> = {};
  for (const c of cardapios) {
    if (!c.turmaId) continue;
    const t = (conta[c.turmaId] ??= { com: 0, sem: 0 });
    for (const item of c.itens) {
      for (const trecho of separar(item.pratoNome)) {
        if (!ehFruta(trecho) || !consistenciaSugerida(trecho)) continue; // cítricos não contam
        if (consistenciaDe(trecho)) t.com++;
        else t.sem++;
      }
    }
  }
  return Object.fromEntries(
    Object.entries(conta)
      .filter(([, v]) => v.com + v.sem > 0)
      .map(([id, v]) => [id, v.com > v.sem]),
  );
}

/** A fruta da turma com a forma de servir dela, aplicada à fruta escolhida. */
function comMesmaForma(escolhida: string, anterior: string, comTextura?: boolean): string {
  const base = nomeBase(escolhida);
  if (!(comTextura ?? !!consistenciaDe(anterior))) return base;
  // Nome que já diz o preparo ("Uva verde sem semente cortada") fica como está.
  const n = normalizar(base);
  if (!FRUTAS.includes(n)) return base;
  // Quem recebia amassada/raspada continua recebendo, na forma indicada para a
  // fruta nova (cítricos não têm: vão em gomos ou suco).
  const c = consistenciaSugerida(base);
  return c ? aplicarConsistencia(base, c) : base;
}

/**
 * Iguala a fruta de cada dia e refeição em todas as turmas. A fruta escolhida
 * é a mais frequente entre as turmas naquele horário (em empate, a da primeira
 * turma da lista). Devolve os cardápios novos e quantos itens mudaram.
 */
export function unificarFrutas(
  porTurma: Record<string, Cardapio>,
  ordemTurmas: string[],
  pratos: Prato[] = [],
  /** Turma → recebe fruta com textura? (ver estiloDeTextura). Sem a turma, vale o item atual. */
  estilo: Record<string, boolean> = {},
): { porTurma: Record<string, Cardapio>; trocas: number } {
  const ids = ordemTurmas.filter((id) => porTurma[id]);
  const novos: Record<string, Cardapio> = { ...porTurma };
  const itens: Record<string, ItemCardapio[]> = Object.fromEntries(
    ids.map((id) => [id, porTurma[id].itens.map((i) => ({ ...i }))]),
  );
  const pratoPorNome = new Map(pratos.map((p) => [normalizar(p.nome), p]));
  let trocas = 0;

  const slots = new Set<string>();
  for (const id of ids) for (const i of itens[id]) slots.add(`${i.dia}|${i.tipoRefeicaoId}`);

  for (const slot of slots) {
    const [diaTxt, refeicao] = slot.split('|');
    const dia = Number(diaTxt);
    const porId = Object.fromEntries(ids.map((id) => [id, frutasDoSlot(itens[id], dia, refeicao)]));
    const maximo = Math.max(0, ...ids.map((id) => porId[id].length));

    for (let pos = 0; pos < maximo; pos++) {
      // Votação: a fruta (sem textura) que mais turmas têm nesta posição.
      const votos = new Map<string, { n: number; ordem: number; texto: string }>();
      ids.forEach((id, ordem) => {
        const oc = porId[id][pos];
        if (!oc) return;
        const chave = normalizar(nomeBase(oc.texto));
        const v = votos.get(chave);
        if (v) v.n++;
        else votos.set(chave, { n: 1, ordem, texto: nomeBase(oc.texto) });
      });
      const escolhida = [...votos.values()].sort((a, b) => b.n - a.n || a.ordem - b.ordem)[0];
      if (!escolhida) continue;

      for (const id of ids) {
        const oc = porId[id][pos];
        if (!oc) continue;
        const novoTrecho = comMesmaForma(escolhida.texto, oc.texto, estilo[id]);
        if (normalizar(novoTrecho) === normalizar(oc.texto)) continue;
        const item = itens[id][oc.idx];
        const partes = separar(item.pratoNome);
        partes[oc.trecho] = novoTrecho;
        const nome = partes.join(' + ');
        const prato = pratoPorNome.get(normalizar(nome));
        itens[id][oc.idx] = { ...item, pratoNome: nome, pratoId: prato?.id ?? item.pratoId };
        trocas++;
      }
    }
  }

  for (const id of ids) novos[id] = { ...porTurma[id], itens: itens[id] };
  return { porTurma: novos, trocas };
}
