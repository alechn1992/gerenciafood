import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Cardapio, Cliente, Insumo, Prato, TipoRefeicao } from '../domain/types';
import { getRepository, type Repository } from '../data/repo';

interface DataState {
  repo: Repository;
  clientes: Cliente[];
  pratos: Prato[];
  tiposRefeicao: TipoRefeicao[];
  insumos: Insumo[];
  carregando: boolean;
  recarregarClientes: () => Promise<void>;
  recarregarPratos: () => Promise<void>;
  recarregarInsumos: () => Promise<void>;
  salvarCliente: (c: Cliente) => Promise<void>;
  removerCliente: (id: string) => Promise<void>;
  salvarPrato: (p: Prato) => Promise<void>;
  removerPrato: (id: string) => Promise<void>;
  listarCardapios: (clienteId?: string) => Promise<Cardapio[]>;
  salvarCardapio: (c: Cardapio) => Promise<void>;
  salvarInsumo: (i: Insumo) => Promise<void>;
  removerInsumo: (id: string) => Promise<void>;
}

const Ctx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const repo = getRepository();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pratos, setPratos] = useState<Prato[]>([]);
  const [tiposRefeicao, setTipos] = useState<TipoRefeicao[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregarClientes = async () => setClientes(await repo.listarClientes());
  const recarregarPratos = async () => setPratos(await repo.listarPratos());
  const recarregarInsumos = async () => setInsumos(await repo.listarInsumos());

  useEffect(() => {
    (async () => {
      const [c, p, t, i] = await Promise.all([
        repo.listarClientes(),
        repo.listarPratos(),
        repo.listarTiposRefeicao(),
        repo.listarInsumos(),
      ]);
      setClientes(c);
      setPratos(p);
      setTipos(t);
      setInsumos(i);
      setCarregando(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valor: DataState = {
    repo,
    clientes,
    pratos,
    tiposRefeicao,
    insumos,
    carregando,
    recarregarClientes,
    recarregarPratos,
    recarregarInsumos,
    salvarCliente: async (c) => {
      await repo.salvarCliente(c);
      await recarregarClientes();
    },
    removerCliente: async (id) => {
      await repo.removerCliente(id);
      await recarregarClientes();
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
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider');
  return ctx;
}
