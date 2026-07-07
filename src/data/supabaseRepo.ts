// Implementação do repositório sobre o Supabase (Postgres).
// O schema correspondente está em supabase/migrations/.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Cardapio,
  Cliente,
  DiaSemana,
  Insumo,
  Prato,
  RefeicaoConfig,
  TipoRefeicao,
  Turma,
} from '../domain/types';
import type { Repository } from './repo';

export class SupabaseRepository implements Repository {
  readonly modo = 'supabase' as const;

  constructor(private db: SupabaseClient) {}

  private assert<T>(data: T | null, error: unknown): T {
    if (error) throw error;
    return data as T;
  }

  async listarClientes(): Promise<Cliente[]> {
    const { data, error } = await this.db
      .from('clientes')
      .select('*')
      .order('nome');
    const rows = this.assert(data, error);
    return rows.map(mapClienteFromRow);
  }

  async salvarCliente(cliente: Cliente): Promise<void> {
    const { error } = await this.db.from('clientes').upsert(mapClienteToRow(cliente));
    if (error) throw error;
  }

  async removerCliente(id: string): Promise<void> {
    const { error } = await this.db.from('clientes').delete().eq('id', id);
    if (error) throw error;
  }

  async listarPratos(): Promise<Prato[]> {
    const { data, error } = await this.db.from('pratos').select('*').order('nome');
    const rows = this.assert(data, error);
    return rows.map(mapPratoFromRow);
  }

  async salvarPrato(prato: Prato): Promise<void> {
    const { error } = await this.db.from('pratos').upsert(mapPratoToRow(prato));
    if (error) throw error;
  }

  async removerPrato(id: string): Promise<void> {
    const { error } = await this.db.from('pratos').delete().eq('id', id);
    if (error) throw error;
  }

  async listarTiposRefeicao(): Promise<TipoRefeicao[]> {
    const { data, error } = await this.db
      .from('tipos_refeicao')
      .select('*')
      .order('ordem');
    return this.assert(data, error) as TipoRefeicao[];
  }

  async listarCardapios(clienteId?: string): Promise<Cardapio[]> {
    let query = this.db.from('cardapios').select('*').order('semana_inicio', { ascending: false });
    if (clienteId) query = query.eq('cliente_id', clienteId);
    const { data, error } = await query;
    const rows = this.assert(data, error);
    return rows.map(mapCardapioFromRow);
  }

  async salvarCardapio(cardapio: Cardapio): Promise<void> {
    const { error } = await this.db.from('cardapios').upsert({
      id: cardapio.id,
      cliente_id: cardapio.clienteId,
      turma_id: cardapio.turmaId ?? null,
      semana_inicio: cardapio.semanaInicio,
      itens: cardapio.itens,
      gerado_em: cardapio.geradoEm,
    });
    if (error) throw error;
  }

  async listarInsumos(): Promise<Insumo[]> {
    const { data, error } = await this.db.from('insumos').select('*').order('nome');
    const rows = this.assert(data, error);
    return rows.map(mapInsumoFromRow);
  }

  async salvarInsumo(insumo: Insumo): Promise<void> {
    const { error } = await this.db.from('insumos').upsert(mapInsumoToRow(insumo));
    if (error) throw error;
  }

  async removerInsumo(id: string): Promise<void> {
    const { error } = await this.db.from('insumos').delete().eq('id', id);
    if (error) throw error;
  }

  async listarTurmas(clienteId?: string): Promise<Turma[]> {
    let query = this.db.from('turmas').select('*').order('ordem');
    if (clienteId) query = query.eq('cliente_id', clienteId);
    const { data, error } = await query;
    const rows = this.assert(data, error);
    return rows.map(mapTurmaFromRow);
  }

  async salvarTurma(turma: Turma): Promise<void> {
    const { error } = await this.db.from('turmas').upsert(mapTurmaToRow(turma));
    if (error) throw error;
  }

  async removerTurma(id: string): Promise<void> {
    const { error } = await this.db.from('turmas').delete().eq('id', id);
    if (error) throw error;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapClienteFromRow(r: any): Cliente {
  return {
    id: r.id,
    nome: r.nome,
    cnpj: r.cnpj ?? undefined,
    responsavel: r.responsavel ?? undefined,
    cidade: r.cidade ?? undefined,
    uf: r.uf ?? 'PR',
    diasOperacao: (r.dias_operacao ?? []) as DiaSemana[],
    refeicoes: (r.refeicoes ?? []) as RefeicaoConfig[],
    restricoes: r.restricoes ?? [],
    observacoes: r.observacoes ?? undefined,
    criadoEm: r.criado_em,
  };
}

function mapClienteToRow(c: Cliente) {
  return {
    id: c.id,
    nome: c.nome,
    cnpj: c.cnpj ?? null,
    responsavel: c.responsavel ?? null,
    cidade: c.cidade ?? null,
    uf: c.uf,
    dias_operacao: c.diasOperacao,
    refeicoes: c.refeicoes,
    restricoes: c.restricoes,
    observacoes: c.observacoes ?? null,
    criado_em: c.criadoEm,
  };
}

function mapPratoFromRow(r: any): Prato {
  return {
    id: r.id,
    nome: r.nome,
    categoria: r.categoria,
    restricoes: r.restricoes ?? [],
    tags: r.tags ?? [],
    ativo: r.ativo ?? true,
    receita: r.receita ?? undefined,
  };
}

function mapPratoToRow(p: Prato) {
  return {
    id: p.id,
    nome: p.nome,
    categoria: p.categoria,
    restricoes: p.restricoes,
    tags: p.tags,
    ativo: p.ativo,
    receita: p.receita ?? null,
  };
}

function mapInsumoFromRow(r: any): Insumo {
  return {
    id: r.id,
    nome: r.nome,
    unidade: r.unidade,
    precoUnitario: Number(r.preco_unitario ?? 0),
    ativo: r.ativo ?? true,
  };
}

function mapInsumoToRow(i: Insumo) {
  return {
    id: i.id,
    nome: i.nome,
    unidade: i.unidade,
    preco_unitario: i.precoUnitario,
    ativo: i.ativo,
  };
}

function mapCardapioFromRow(r: any): Cardapio {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    turmaId: r.turma_id ?? undefined,
    semanaInicio: r.semana_inicio,
    itens: r.itens ?? [],
    geradoEm: r.gerado_em,
  };
}

function mapTurmaFromRow(r: any): Turma {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    nome: r.nome,
    ordem: r.ordem ?? 0,
    refeicoes: (r.refeicoes ?? []) as RefeicaoConfig[],
    restricoes: r.restricoes ?? [],
  };
}

function mapTurmaToRow(t: Turma) {
  return {
    id: t.id,
    cliente_id: t.clienteId,
    nome: t.nome,
    ordem: t.ordem,
    refeicoes: t.refeicoes,
    restricoes: t.restricoes,
  };
}
