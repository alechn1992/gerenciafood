import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Cardapio, CategoriaInsumo, Cliente, ConfiguracaoSync, Insumo, Prato, Profissional, TipoRefeicao, Turma, UnidadeMedida } from '../domain/types';
import { getRepository, type Repository } from '../data/repo';
import { TIPOS_REFEICAO_PADRAO } from '../data/seed';

export interface ResultadoSync {
  importados: number;
  atualizados: number;
  erros: string[];
}

interface DataState {
  repo: Repository;
  clientes: Cliente[];
  pratos: Prato[];
  tiposRefeicao: TipoRefeicao[];
  insumos: Insumo[];
  turmas: Turma[];
  profissionais: Profissional[];
  carregando: boolean;
  configuracaoSync: ConfiguracaoSync | null;
  recarregarClientes: () => Promise<void>;
  recarregarPratos: () => Promise<void>;
  recarregarInsumos: () => Promise<void>;
  recarregarTurmas: () => Promise<void>;
  recarregarProfissionais: () => Promise<void>;
  salvarCliente: (c: Cliente) => Promise<void>;
  removerCliente: (id: string) => Promise<void>;
  salvarPrato: (p: Prato) => Promise<void>;
  removerPrato: (id: string) => Promise<void>;
  listarCardapios: (clienteId?: string) => Promise<Cardapio[]>;
  salvarCardapio: (c: Cardapio) => Promise<void>;
  salvarInsumo: (i: Insumo) => Promise<void>;
  removerInsumo: (id: string) => Promise<void>;
  salvarTurma: (t: Turma) => Promise<void>;
  removerTurma: (id: string) => Promise<void>;
  salvarProfissional: (p: Profissional) => Promise<void>;
  removerProfissional: (id: string) => Promise<void>;
  salvarConfiguracaoSync: (c: ConfiguracaoSync) => Promise<void>;
  sincronizarInsumos: () => Promise<ResultadoSync>;
}

const Ctx = createContext<DataState | null>(null);

/** Formato esperado da API externa de produtos. */
interface ProdutoExterno {
  id: string;
  nome: string;
  categoria?: string;
  unidade?: string;
  qtd_embalagem?: number;
  preco_embalagem?: number;
  ativo?: boolean;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const repo = getRepository();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pratos, setPratos] = useState<Prato[]>([]);
  const [tiposRefeicao, setTipos] = useState<TipoRefeicao[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [configuracaoSync, setConfiguracaoSync] = useState<ConfiguracaoSync | null>(null);

  const recarregarClientes = async () => setClientes(await repo.listarClientes());
  const recarregarPratos = async () => setPratos(await repo.listarPratos());
  const recarregarInsumos = async () => setInsumos(await repo.listarInsumos());
  const recarregarTurmas = async () => setTurmas(await repo.listarTurmas());
  const recarregarProfissionais = async () => setProfissionais(await repo.listarProfissionais());

  useEffect(() => {
    (async () => {
      try {
        const [c, p, t, i, tu, pr, cfg] = await Promise.all([
          repo.listarClientes(),
          repo.listarPratos(),
          repo.listarTiposRefeicao(),
          repo.listarInsumos(),
          repo.listarTurmas(),
          repo.listarProfissionais(),
          repo.carregarConfiguracaoSync(),
        ]);
        setClientes(c);
        setPratos(p);
        setTipos(t.length > 0 ? t : TIPOS_REFEICAO_PADRAO);
        setInsumos(i);
        setTurmas(tu);
        setProfissionais(pr);
        setConfiguracaoSync(cfg);
      } catch (err) {
        console.error('[GerenciaFood] Erro ao carregar dados:', err);
        setTipos(TIPOS_REFEICAO_PADRAO);
      } finally {
        setCarregando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salvarConfiguracaoSync = async (c: ConfiguracaoSync) => {
    await repo.salvarConfiguracaoSync(c);
    setConfiguracaoSync(c);
  };

  const sincronizarInsumos = async (): Promise<ResultadoSync> => {
    const cfg = configuracaoSync;
    if (!cfg?.urlBase || !cfg?.apiKey) {
      return { importados: 0, atualizados: 0, erros: ['Configuração de API não definida.'] };
    }

    let produtos: ProdutoExterno[];
    try {
      const resp = await fetch(`${cfg.urlBase.replace(/\/$/, '')}/produtos`, {
        headers: { 'X-Api-Key': cfg.apiKey },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      produtos = await resp.json();
      if (!Array.isArray(produtos)) throw new Error('A resposta da API não é um array.');
    } catch (e: unknown) {
      return { importados: 0, atualizados: 0, erros: [e instanceof Error ? e.message : String(e)] };
    }

    const insumosAtuais = await repo.listarInsumos();
    const porCodigoExterno = new Map(
      insumosAtuais.filter((i) => i.codigoExterno).map((i) => [i.codigoExterno!, i]),
    );

    let importados = 0;
    let atualizados = 0;
    const erros: string[] = [];
    const agora = new Date().toISOString();

    for (const prod of produtos) {
      try {
        const existente = porCodigoExterno.get(String(prod.id));
        const qtd = Number(prod.qtd_embalagem) || 1;
        const preco = Number(prod.preco_embalagem) || 0;
        const insumo: Insumo = existente
          ? {
              ...existente,
              nome: prod.nome ?? existente.nome,
              categoria: (prod.categoria as CategoriaInsumo) ?? existente.categoria,
              unidade: (prod.unidade as UnidadeMedida) ?? existente.unidade,
              qtdEmbalagem: qtd,
              precoEmbalagem: preco,
              precoUnitario: qtd > 0 ? preco / qtd : 0,
              ativo: prod.ativo ?? existente.ativo,
              sincronizadoEm: agora,
            }
          : {
              id: crypto.randomUUID(),
              nome: prod.nome,
              categoria: prod.categoria as CategoriaInsumo | undefined,
              unidade: (prod.unidade as UnidadeMedida) ?? 'un',
              qtdEmbalagem: qtd,
              precoEmbalagem: preco,
              precoUnitario: qtd > 0 ? preco / qtd : 0,
              ativo: prod.ativo ?? true,
              codigoExterno: String(prod.id),
              sincronizadoEm: agora,
            };
        await repo.salvarInsumo(insumo);
        if (existente) atualizados++; else importados++;
      } catch (e: unknown) {
        erros.push(`"${prod.nome}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const novaCfg: ConfiguracaoSync = { ...cfg, ultimaSincronizacao: agora };
    await repo.salvarConfiguracaoSync(novaCfg);
    setConfiguracaoSync(novaCfg);
    await recarregarInsumos();
    return { importados, atualizados, erros };
  };

  const valor: DataState = {
    repo,
    clientes,
    pratos,
    tiposRefeicao,
    insumos,
    turmas,
    profissionais,
    carregando,
    configuracaoSync,
    recarregarClientes,
    recarregarPratos,
    recarregarInsumos,
    recarregarTurmas,
    recarregarProfissionais,
    salvarCliente: async (c) => {
      await repo.salvarCliente(c);
      await recarregarClientes();
    },
    removerCliente: async (id) => {
      await repo.removerCliente(id);
      await recarregarClientes();
      await recarregarTurmas();
    },
    salvarPrato: async (p) => {
      await repo.salvarPrato(p);
      await recarregarPratos();
    },
    removerPrato: async (id) => {
      await repo.removerPrato(id);
      await recarregarPratos();
    },
    listarCardapios: (clienteId) => repo.listarCardapios(clienteId),
    salvarCardapio: (c) => repo.salvarCardapio(c),
    salvarInsumo: async (i) => {
      await repo.salvarInsumo(i);
      await recarregarInsumos();
    },
    removerInsumo: async (id) => {
      await repo.removerInsumo(id);
      await recarregarInsumos();
    },
    salvarTurma: async (t) => {
      await repo.salvarTurma(t);
      await recarregarTurmas();
    },
    removerTurma: async (id) => {
      await repo.removerTurma(id);
      await recarregarTurmas();
    },
    salvarProfissional: async (p) => {
      await repo.salvarProfissional(p);
      await recarregarProfissionais();
    },
    removerProfissional: async (id) => {
      await repo.removerProfissional(id);
      await recarregarProfissionais();
    },
    salvarConfiguracaoSync,
    sincronizarInsumos,
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider');
  return ctx;
}
