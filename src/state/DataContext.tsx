import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Cardapio, Cliente, Prato, TipoRefeicao } from '../domain/types';
import { getRepository, type Repository } from '../data/repo';

interface DataState {
  repo: Repository;
  clientes: Cliente[];
  pratos: Prato[];
  tiposRefeicao: TipoRefeicao[];
  carregando: boolean;
  recarregarClientes: () => Promise<void>;
  recarregarPratos: () => Promise<void>;
  salvarCliente: (c: Cliente) => Promise<void>;
  removerCliente: (id: string) => Promise<void>;
  salvarPrato: (p: Prato) => Promise<void>;
  removerPrato: (id: string) => Promise<void>;
  listarCardapios: (clienteId?: string) => Promise<Cardapio[]>;
  salvarCardapio: (c: Cardapio) => Promise<void>;
}

const Ctx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const repo = getRepository();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pratos, setPratos] = useState<Prato[]>([]);
  const [tiposRefeicao, setTipos] = useState<TipoRefeicao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregarClientes = async () => setClientes(await repo.listarClientes());
  const recarregarPratos = async () => setPratos(await repo.listarPratos());

  useEffect(() => {
    (async () => {
      const [c, p, t] = await Promise.all([
        repo.listarClientes(),
        repo.listarPratos(),
        repo.listarTiposRefeicao(),
      ]);
      setClientes(c);
      setPratos(p);
      setTipos(t);
      setCarregando(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valor: DataState = {
    repo,
    clientes,
    pratos,
    tiposRefeicao,
    carregando,
    recarregarClientes,
    recarregarPratos,
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
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider');
  return ctx;
}
