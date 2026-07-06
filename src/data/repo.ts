// Camada de dados com abstração de repositório.
//
// Por padrão, o app funciona 100% localmente (localStorage) — basta rodar
// `npm run dev`, sem configurar nada. Ao definir as variáveis de ambiente do
// Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY), os dados passam a ser
// persistidos no Postgres do Supabase.

import type { Cardapio, Cliente, Insumo, Prato, TipoRefeicao } from '../domain/types';
import { INSUMOS_PADRAO, PRATOS_PADRAO, TIPOS_REFEICAO_PADRAO } from './seed';
import { supabase } from '../lib/supabase';
import { SupabaseRepository } from './supabaseRepo';

export interface Repository {
  readonly modo: 'local' | 'supabase';
  listarClientes(): Promise<Cliente[]>;
  salvarCliente(cliente: Cliente): Promise<void>;
  removerCliente(id: string): Promise<void>;
  listarPratos(): Promise<Prato[]>;
  salvarPrato(prato: Prato): Promise<void>;
  removerPrato(id: string): Promise<void>;
  listarTiposRefeicao(): Promise<TipoRefeicao[]>;
  listarCardapios(clienteId?: string): Promise<Cardapio[]>;
  salvarCardapio(cardapio: Cardapio): Promise<void>;
  listarInsumos(): Promise<Insumo[]>;
  salvarInsumo(insumo: Insumo): Promise<void>;
  removerInsumo(id: string): Promise<void>;
}

const KEYS = {
  clientes: 'gf.clientes',
  pratos: 'gf.pratos',
  tipos: 'gf.tipos',
  cardapios: 'gf.cardapios',
  insumos: 'gf.insumos',
};

function ler<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function escrever<T>(key: string, valor: T): void {
  localStorage.setItem(key, JSON.stringify(valor));
}

export class LocalRepository implements Repository {
  readonly modo = 'local' as const;

  constructor() {
    // Semeia dados padrão apenas no primeiro uso.
    if (localStorage.getItem(KEYS.pratos) === null) {
      escrever(KEYS.pratos, PRATOS_PADRAO);
    }
    if (localStorage.getItem(KEYS.tipos) === null) {
      escrever(KEYS.tipos, TIPOS_REFEICAO_PADRAO);
    }
    if (localStorage.getItem(KEYS.insumos) === null) {
      escrever(KEYS.insumos, INSUMOS_PADRAO);
    }
  }

  async listarClientes() {
    return ler<Cliente[]>(KEYS.clientes, []);
  }

  async salvarCliente(cliente: Cliente) {
    const clientes = await this.listarClientes();
    const idx = clientes.findIndex((c) => c.id === cliente.id);
    if (idx >= 0) clientes[idx] = cliente;
    else clientes.push(cliente);
    escrever(KEYS.clientes, clientes);
  }

  async removerCliente(id: string) {
    escrever(
      KEYS.clientes,
      (await this.listarClientes()).filter((c) => c.id !== id),
    );
    escrever(
      KEYS.cardapios,
      (await this.listarCardapios()).filter((c) => c.clienteId !== id),
    );
  }

  async listarPratos() {
    return ler<Prato[]>(KEYS.pratos, PRATOS_PADRAO);
  }

  async salvarPrato(prato: Prato) {
    const pratos = await this.listarPratos();
    const idx = pratos.findIndex((p) => p.id === prato.id);
    if (idx >= 0) pratos[idx] = prato;
    else pratos.push(prato);
    escrever(KEYS.pratos, pratos);
  }

  async removerPrato(id: string) {
    escrever(
      KEYS.pratos,
      (await this.listarPratos()).filter((p) => p.id !== id),
    );
  }

  async listarTiposRefeicao() {
    return ler<TipoRefeicao[]>(KEYS.tipos, TIPOS_REFEICAO_PADRAO);
  }

  async listarCardapios(clienteId?: string) {
    const todos = ler<Cardapio[]>(KEYS.cardapios, []);
    return clienteId ? todos.filter((c) => c.clienteId === clienteId) : todos;
  }

  async salvarCardapio(cardapio: Cardapio) {
    const cardapios = await this.listarCardapios();
    const idx = cardapios.findIndex((c) => c.id === cardapio.id);
    if (idx >= 0) cardapios[idx] = cardapio;
    else cardapios.push(cardapio);
    escrever(KEYS.cardapios, cardapios);
  }

  async listarInsumos() {
    return ler<Insumo[]>(KEYS.insumos, INSUMOS_PADRAO);
  }

  async salvarInsumo(insumo: Insumo) {
    const insumos = await this.listarInsumos();
    const idx = insumos.findIndex((i) => i.id === insumo.id);
    if (idx >= 0) insumos[idx] = insumo;
    else insumos.push(insumo);
    escrever(KEYS.insumos, insumos);
  }

  async removerInsumo(id: string) {
    escrever(
      KEYS.insumos,
      (await this.listarInsumos()).filter((i) => i.id !== id),
    );
  }
}

let instancia: Repository | null = null;

/** Retorna o repositório ativo (Supabase se configurado, senão local). */
export function getRepository(): Repository {
  if (!instancia) {
    instancia = supabase ? new SupabaseRepository(supabase) : new LocalRepository();
  }
  return instancia;
}
