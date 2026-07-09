import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Cardapio, Cliente, Insumo, Prato, TipoRefeicao, Turma } from '../domain/types';
import { getRepository, type Repository } from '../data/repo';
import { TIPOS_REFEICAO_PADRAO } from '../data/seed';

interface DataState {
  repo: Repository;
  clientes: Cliente[];
  pratos: Prato[];
  tiposRefeicao: TipoRefeicao[];
  insumos: Insumo[];
  turmas: Turma[];
  carregando: boolean;
  recarregarClientes: () => Promise<void>;
  recarregarPratos: () => Promise<void>;
  recarregarInsumos: () => Promise<void>;
  recarregarTurmas: () => Promise<void>;
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
}

const Ctx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const repo = getRepository();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pratos, setPratos] = useState<Prato[]>([]);
  const [tiposRefeicao, setTipos] = useState<TipoRefeicao[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregarClientes = async () => setClientes(await repo.listarClientes());
  const recarregarPratos = async () => setPratos(await repo.listarPratos());
  const recarregarInsumos = async () => setInsumos(await repo.listarInsumos());
  const recarregarTurmas = async () => setTurmas(await repo.listarTurmas());

  useEffect(() => {
    (async () => {
      try {
        const [c, p, t, i, tu] = await Promise.all([
          repo.listarClientes(),
          repo.listarPratos(),
          repo.listarTiposRefeicao(),
          repo.listarInsumos(),
          repo.listarTurmas(),
        ]);
        setClientes(c);
        setPratos(p);
        setTipos(t.length > 0 ? t : TIPOS_REFEICAO_PADRAO);
        setInsumos(i);
        setTurmas(tu);
      } catch (err) {
        console.error('[GerenciaFood] Erro ao carregar dados:', err);
        setTipos(TIPOS_REFEICAO_PADRAO);
      } finally {
        setCarregando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valor: DataState = {
    repo,
    clientes,
    pratos,
    tiposRefeicao,
    insumos,
    turmas,
    carregando,
    recarregarClientes,
    recarregarPratos,
    recarregarInsumos,
    recarregarTurmas,
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
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider');
  return ctx;
}
