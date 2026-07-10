import { LocalRepository } from '../data/repo';
import type { Repository } from '../data/repo';

export interface ResultadoMigracao {
  migrados: number;
  erros: string[];
}

export async function migrarDadosLocais(destino: Repository): Promise<ResultadoMigracao> {
  const local = new LocalRepository();
  let migrados = 0;
  const erros: string[] = [];

  async function salvar(label: string, fn: () => Promise<void>) {
    try {
      await fn();
      migrados++;
    } catch (e: unknown) {
      erros.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  for (const c of await local.listarClientes())
    await salvar(`Cliente "${c.nome}"`, () => destino.salvarCliente(c));

  for (const p of await local.listarPratos())
    await salvar(`Prato "${p.nome}"`, () => destino.salvarPrato(p));

  for (const i of await local.listarInsumos())
    await salvar(`Insumo "${i.nome}"`, () => destino.salvarInsumo(i));

  for (const t of await local.listarTurmas())
    await salvar(`Turma "${t.nome}"`, () => destino.salvarTurma(t));

  for (const c of await local.listarCardapios())
    await salvar(`Cardápio ${c.semanaInicio}`, () => destino.salvarCardapio(c));

  return { migrados, erros };
}
