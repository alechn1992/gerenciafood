// Implementação do repositório sobre o Supabase (Postgres).
// O schema correspondente está em supabase/migrations/.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Cardapio,
  CategoriaInsumo,
  Cliente,
  ConfiguracaoSync,
  DiaSemana,
  Insumo,
  PlanoAcao,
  Prato,
  Profissional,
  RefeicaoConfig,
  Relatorio,
  TipoRefeicao,
  Turma,
  Visita,
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

  async salvarRelatorio(r: Relatorio): Promise<void> {
    const { error } = await this.db.from('relatorios').upsert({
      id: r.id,
      cliente_id: r.clienteId,
      avaliador: r.avaliador,
      registro_crn: r.registroCRN,
      eh_cei: r.ehCei,
      data_avaliacao: r.dataAvaliacao,
      respostas: r.respostas,
      observacoes: r.observacoes,
      gerado_em: r.geradoEm,
      atualizado_em: new Date().toISOString(),
    });
    if (error) throw error;
  }

  async carregarRelatorio(clienteId: string): Promise<Relatorio | null> {
    const { data, error } = await this.db
      .from('relatorios')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('atualizado_em', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapRelatorioFromRow(data) : null;
  }

  async salvarPlanoAcao(p: PlanoAcao): Promise<void> {
    const { error } = await this.db.from('planos_acao').upsert({
      id: p.id,
      cliente_id: p.clienteId,
      relatorio_id: p.relatorioId,
      acoes: p.acoes,
      criado_em: p.criadoEm,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: 'cliente_id' });
    if (error) throw error;
  }

  async carregarPlanoAcao(clienteId: string): Promise<PlanoAcao | null> {
    const { data, error } = await this.db
      .from('planos_acao')
      .select('*')
      .eq('cliente_id', clienteId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      clienteId: data.cliente_id,
      relatorioId: data.relatorio_id ?? '',
      acoes: data.acoes ?? [],
      criadoEm: data.criado_em,
      atualizadoEm: data.atualizado_em,
    };
  }

  async listarVisitas(clienteId?: string): Promise<Visita[]> {
    let query = this.db.from('visitas').select('*').order('data', { ascending: false });
    if (clienteId) query = query.eq('cliente_id', clienteId);
    const { data, error } = await query;
    const rows = this.assert(data, error);
    return rows.map(mapVisitaFromRow);
  }

  async carregarVisita(id: string): Promise<Visita | null> {
    const { data, error } = await this.db
      .from('visitas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapVisitaFromRow(data) : null;
  }

  async salvarVisita(v: Visita): Promise<void> {
    const { error } = await this.db.from('visitas').upsert({
      id: v.id,
      cliente_id: v.clienteId,
      profissional_id: v.profissionalId || null,
      data: v.data,
      hora: v.hora || null,
      consultor: v.consultor,
      email_consultor: v.emailConsultor || null,
      tipo: v.tipo,
      observacoes: v.observacoes,
      secoes: v.secoes,
      proxima_visita: v.proximaVisita || null,
      relatorio_id: v.relatorioId || null,
      criado_em: v.criadoEm,
    });
    if (error) throw error;
  }

  async removerVisita(id: string): Promise<void> {
    const { error } = await this.db.from('visitas').delete().eq('id', id);
    if (error) throw error;
  }

  async listarProfissionais(): Promise<Profissional[]> {
    const { data, error } = await this.db.from('profissionais').select('*').order('nome');
    const rows = this.assert(data, error);
    return rows.map(mapProfissionalFromRow);
  }

  async salvarProfissional(p: Profissional): Promise<void> {
    const { error } = await this.db.from('profissionais').upsert({
      id: p.id,
      nome: p.nome,
      email: p.email || null,
      telefone: p.telefone || null,
      registro_crn: p.registroCRN || null,
      especialidade: p.especialidade || null,
      empresa: p.empresa || null,
      cargo: p.cargo || null,
      logo_empresa: p.logoEmpresa || null,
      assinatura: p.assinatura || null,
      criado_em: p.criadoEm,
    });
    if (error) throw error;
  }

  async removerProfissional(id: string): Promise<void> {
    const { error } = await this.db.from('profissionais').delete().eq('id', id);
    if (error) throw error;
  }

  async carregarConfiguracaoSync(): Promise<ConfiguracaoSync | null> {
    try {
      const raw = localStorage.getItem('gf.syncconfig');
      return raw ? (JSON.parse(raw) as ConfiguracaoSync) : null;
    } catch {
      return null;
    }
  }

  async salvarConfiguracaoSync(c: ConfiguracaoSync): Promise<void> {
    localStorage.setItem('gf.syncconfig', JSON.stringify(c));
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapClienteFromRow(r: any): Cliente {
  return {
    id: r.id,
    nome: r.nome,
    cnpj: r.cnpj ?? undefined,
    email: r.email ?? undefined,
    responsavel: r.responsavel ?? undefined,
    registroProfissional: r.registro_profissional ?? undefined,
    logo: r.logo ?? undefined,
    cidade: r.cidade ?? undefined,
    uf: r.uf ?? 'PR',
    diasOperacao: (r.dias_operacao ?? []) as DiaSemana[],
    refeicoes: (r.refeicoes ?? []) as RefeicaoConfig[],
    restricoes: r.restricoes ?? [],
    exclusoes: r.exclusoes?.length ? r.exclusoes : undefined,
    pratosFixos: r.pratos_fixos?.length ? r.pratos_fixos : undefined,
    observacoes: r.observacoes ?? undefined,
    criadoEm: r.criado_em,
  };
}

function mapClienteToRow(c: Cliente) {
  return {
    id: c.id,
    nome: c.nome,
    cnpj: c.cnpj ?? null,
    email: c.email ?? null,
    responsavel: c.responsavel ?? null,
    registro_profissional: c.registroProfissional ?? null,
    logo: c.logo ?? null,
    cidade: c.cidade ?? null,
    uf: c.uf,
    dias_operacao: c.diasOperacao,
    refeicoes: c.refeicoes,
    restricoes: c.restricoes,
    exclusoes: c.exclusoes ?? [],
    pratos_fixos: c.pratosFixos ?? [],
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
  const qtd = Number(r.qtd_embalagem ?? 1) || 1;
  const precoEmbalagem = Number(r.preco_embalagem ?? r.preco_unitario ?? 0);
  return {
    id: r.id,
    nome: r.nome,
    unidade: r.unidade,
    qtdEmbalagem: qtd,
    precoEmbalagem,
    precoUnitario: precoEmbalagem / qtd,
    ativo: r.ativo ?? true,
    pesoGramas: r.peso_gramas != null ? Number(r.peso_gramas) : undefined,
    nutricao: r.nutricao ?? undefined,
    categoria: (r.categoria as CategoriaInsumo) ?? undefined,
    codigoExterno: r.codigo_externo ?? undefined,
    sincronizadoEm: r.sincronizado_em ?? undefined,
  };
}

function mapInsumoToRow(i: Insumo) {
  return {
    id: i.id,
    nome: i.nome,
    unidade: i.unidade,
    qtd_embalagem: i.qtdEmbalagem,
    preco_embalagem: i.precoEmbalagem,
    preco_unitario: i.precoUnitario,
    ativo: i.ativo,
    peso_gramas: i.pesoGramas ?? null,
    nutricao: i.nutricao ?? null,
    categoria: i.categoria ?? null,
    codigo_externo: i.codigoExterno ?? null,
    sincronizado_em: i.sincronizadoEm ?? null,
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

function mapVisitaFromRow(r: any): Visita {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    profissionalId: r.profissional_id ?? undefined,
    data: r.data,
    hora: r.hora ?? undefined,
    consultor: r.consultor ?? '',
    emailConsultor: r.email_consultor ?? undefined,
    tipo: r.tipo ?? 'auditoria',
    observacoes: r.observacoes ?? '',
    secoes: r.secoes ?? [],
    proximaVisita: r.proxima_visita ?? undefined,
    relatorioId: r.relatorio_id ?? undefined,
    criadoEm: r.criado_em,
  };
}

function mapProfissionalFromRow(r: any): Profissional {
  return {
    id: r.id,
    nome: r.nome,
    email: r.email ?? undefined,
    telefone: r.telefone ?? undefined,
    registroCRN: r.registro_crn ?? undefined,
    especialidade: r.especialidade ?? undefined,
    empresa: r.empresa ?? undefined,
    cargo: r.cargo ?? undefined,
    logoEmpresa: r.logo_empresa ?? undefined,
    assinatura: r.assinatura ?? undefined,
    criadoEm: r.criado_em,
  };
}

function mapRelatorioFromRow(r: any): Relatorio {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    avaliador: r.avaliador ?? '',
    registroCRN: r.registro_crn ?? '',
    ehCei: r.eh_cei ?? false,
    dataAvaliacao: r.data_avaliacao,
    respostas: r.respostas ?? {},
    observacoes: r.observacoes ?? {},
    geradoEm: r.gerado_em,
    atualizadoEm: r.atualizado_em,
  };
}
