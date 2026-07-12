// Camada de dados com abstração de repositório.
//
// Por padrão, o app funciona 100% localmente (localStorage) — basta rodar
// `npm run dev`, sem configurar nada. Ao definir as variáveis de ambiente do
// Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY), os dados passam a ser
// persistidos no Postgres do Supabase.

import type { Cardapio, Cliente, Insumo, PlanoAcao, Prato, Profissional, Relatorio, TipoRefeicao, Turma, Visita, SecaoVisita } from '../domain/types';
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
  listarTurmas(clienteId?: string): Promise<Turma[]>;
  salvarTurma(turma: Turma): Promise<void>;
  removerTurma(id: string): Promise<void>;
  salvarRelatorio(r: Relatorio): Promise<void>;
  carregarRelatorio(clienteId: string): Promise<Relatorio | null>;
  salvarPlanoAcao(p: PlanoAcao): Promise<void>;
  carregarPlanoAcao(clienteId: string): Promise<PlanoAcao | null>;
  listarVisitas(clienteId?: string): Promise<Visita[]>;
  carregarVisita(id: string): Promise<Visita | null>;
  salvarVisita(v: Visita): Promise<void>;
  removerVisita(id: string): Promise<void>;
  listarProfissionais(): Promise<Profissional[]>;
  salvarProfissional(p: Profissional): Promise<void>;
  removerProfissional(id: string): Promise<void>;
}

const KEYS = {
  clientes: 'gf.clientes',
  pratos: 'gf.pratos',
  tipos: 'gf.tipos',
  cardapios: 'gf.cardapios',
  insumos: 'gf.insumos',
  turmas: 'gf.turmas',
  relatorios: 'gf.relatorios',
  planos: 'gf.planos',
  visitas: 'gf.visitas',
  profissionais: 'gf.profissionais',
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
    escrever(
      KEYS.turmas,
      (await this.listarTurmas()).filter((t) => t.clienteId !== id),
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

  async listarTurmas(clienteId?: string) {
    const todas = ler<Turma[]>(KEYS.turmas, []);
    return clienteId ? todas.filter((t) => t.clienteId === clienteId) : todas;
  }

  async salvarTurma(turma: Turma) {
    const turmas = await this.listarTurmas();
    const idx = turmas.findIndex((t) => t.id === turma.id);
    if (idx >= 0) turmas[idx] = turma;
    else turmas.push(turma);
    escrever(KEYS.turmas, turmas);
  }

  async removerTurma(id: string) {
    escrever(
      KEYS.turmas,
      (await this.listarTurmas()).filter((t) => t.id !== id),
    );
    escrever(
      KEYS.cardapios,
      (await this.listarCardapios()).filter((c) => c.turmaId !== id),
    );
  }

  async salvarRelatorio(r: Relatorio): Promise<void> {
    const todos = ler<Relatorio[]>(KEYS.relatorios, []);
    const idx = todos.findIndex((x) => x.id === r.id);
    if (idx >= 0) todos[idx] = r; else todos.push(r);
    escrever(KEYS.relatorios, todos);
  }

  async carregarRelatorio(clienteId: string): Promise<Relatorio | null> {
    const todos = ler<Relatorio[]>(KEYS.relatorios, []);
    const doCliente = todos
      .filter((r) => r.clienteId === clienteId)
      .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
    return doCliente[0] ?? null;
  }

  async salvarPlanoAcao(p: PlanoAcao): Promise<void> {
    const todos = ler<PlanoAcao[]>(KEYS.planos, []);
    const idx = todos.findIndex((x) => x.clienteId === p.clienteId);
    if (idx >= 0) todos[idx] = p; else todos.push(p);
    escrever(KEYS.planos, todos);
  }

  async carregarPlanoAcao(clienteId: string): Promise<PlanoAcao | null> {
    const todos = ler<PlanoAcao[]>(KEYS.planos, []);
    return todos.find((p) => p.clienteId === clienteId) ?? null;
  }

  async listarVisitas(clienteId?: string): Promise<Visita[]> {
    const todas = ler<Visita[]>(KEYS.visitas, []);
    const filtradas = clienteId ? todas.filter((v) => v.clienteId === clienteId) : todas;
    return filtradas
      .map((v): Visita => ({ ...v, secoes: v.secoes ?? ([] as SecaoVisita[]) }))
      .sort((a, b) => b.data.localeCompare(a.data));
  }

  async carregarVisita(id: string): Promise<Visita | null> {
    const todas = ler<Visita[]>(KEYS.visitas, []);
    const v = todas.find((x) => x.id === id);
    return v ? { ...v, secoes: v.secoes ?? ([] as SecaoVisita[]) } : null;
  }

  async salvarVisita(v: Visita): Promise<void> {
    const todas = ler<Visita[]>(KEYS.visitas, []);
    const idx = todas.findIndex((x) => x.id === v.id);
    if (idx >= 0) todas[idx] = v; else todas.push(v);
    escrever(KEYS.visitas, todas);
  }

  async removerVisita(id: string): Promise<void> {
    const todas = ler<Visita[]>(KEYS.visitas, []);
    escrever(KEYS.visitas, todas.filter((v) => v.id !== id));
  }

  async listarProfissionais(): Promise<Profissional[]> {
    return ler<Profissional[]>(KEYS.profissionais, []).sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async salvarProfissional(p: Profissional): Promise<void> {
    const todos = ler<Profissional[]>(KEYS.profissionais, []);
    const idx = todos.findIndex((x) => x.id === p.id);
    if (idx >= 0) todos[idx] = p; else todos.push(p);
    escrever(KEYS.profissionais, todos);
  }

  async removerProfissional(id: string): Promise<void> {
    escrever(KEYS.profissionais, ler<Profissional[]>(KEYS.profissionais, []).filter((p) => p.id !== id));
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
