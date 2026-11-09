import { useCallback, useEffect, useRef, useState } from 'react';
import type { FotoVisita } from '../domain/types';
import { comprimirImagem } from '../lib/imagem';
import { useData } from './DataContext';

export const MAX_FOTOS_POR_ITEM = 4;

const descrever = (e: unknown) => (e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e));

/**
 * Fotos dos itens de uma visita. Com `salva`, cada foto é gravada na hora;
 * numa visita nova (ainda não salva) elas ficam guardadas aqui até
 * `gravarPendentes`, chamado depois de salvar a visita.
 */
export function useFotosVisita(visitaId: string | undefined, salva: boolean) {
  const { repo } = useData();
  const [fotos, setFotos] = useState<FotoVisita[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const gravadas = useRef(new Set<string>());

  useEffect(() => {
    setFotos([]);
    gravadas.current = new Set();
    setErro(null);
    if (!visitaId || !salva) return;
    let ativo = true;
    setCarregando(true);
    repo
      .listarFotosVisita(visitaId)
      .then((lista) => {
        if (!ativo) return;
        gravadas.current = new Set(lista.map((f) => f.id));
        setFotos(lista);
      })
      .catch((e) => ativo && setErro(descrever(e)))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // `salva` só importa na abertura: uma visita nova salva grava as pendentes por gravarPendentes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitaId, repo]);

  const doItem = useCallback((itemId: string) => fotos.filter((f) => f.itemId === itemId), [fotos]);

  const adicionar = async (itemId: string, arquivos: FileList | File[]) => {
    if (!visitaId) return;
    const livres = MAX_FOTOS_POR_ITEM - fotos.filter((f) => f.itemId === itemId).length;
    const lista = Array.from(arquivos).slice(0, Math.max(0, livres));
    if (lista.length === 0) return;
    setErro(null);
    setEnviando((n) => n + lista.length);
    for (const file of lista) {
      try {
        const foto: FotoVisita = {
          id: crypto.randomUUID(),
          visitaId,
          itemId,
          imagem: await comprimirImagem(file),
          criadoEm: new Date().toISOString(),
        };
        if (salva) {
          await repo.salvarFotoVisita(foto);
          gravadas.current.add(foto.id);
        }
        setFotos((atual) => [...atual, foto]);
      } catch (e) {
        setErro(descrever(e));
      } finally {
        setEnviando((n) => n - 1);
      }
    }
  };

  const remover = async (id: string) => {
    setErro(null);
    try {
      if (gravadas.current.has(id)) {
        await repo.removerFotoVisita(id);
        gravadas.current.delete(id);
      }
      setFotos((atual) => atual.filter((f) => f.id !== id));
    } catch (e) {
      setErro(descrever(e));
    }
  };

  /**
   * Depois de salvar a visita: grava as fotos que ainda não foram e apaga as
   * de itens que saíram da visita. Lança o erro para quem salvou mostrar.
   */
  const gravarPendentes = async (itensValidos: Set<string>) => {
    for (const f of fotos) {
      if (!itensValidos.has(f.itemId)) {
        if (gravadas.current.has(f.id)) await repo.removerFotoVisita(f.id);
        gravadas.current.delete(f.id);
      } else if (!gravadas.current.has(f.id)) {
        await repo.salvarFotoVisita(f);
        gravadas.current.add(f.id);
      }
    }
    setFotos((atual) => atual.filter((f) => itensValidos.has(f.itemId)));
  };

  return { fotos, doItem, adicionar, remover, gravarPendentes, carregando, enviando, erro };
}
