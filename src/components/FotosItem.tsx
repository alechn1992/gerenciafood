// Fotos de um item (visita técnica): miniaturas, botão para tirar/escolher e
// remover. Na impressão saem só as fotos, em tamanho legível.

import { useState } from 'react';
import type { FotoVisita } from '../domain/types';
import { MAX_FOTOS_POR_ITEM } from '../state/useFotosVisita';

export function FotosItem({
  fotos,
  onAdicionar,
  onRemover,
  somenteLeitura,
}: {
  fotos: FotoVisita[];
  onAdicionar?: (arquivos: FileList) => void;
  onRemover?: (id: string) => void;
  somenteLeitura?: boolean;
}) {
  const [ampliada, setAmpliada] = useState<string | null>(null);
  const podeAdicionar = !somenteLeitura && !!onAdicionar && fotos.length < MAX_FOTOS_POR_ITEM;
  if (fotos.length === 0 && !podeAdicionar) return null;

  return (
    <div className="fotos-item">
      {fotos.map((f, i) => (
        <figure key={f.id} className="fotos-item-foto">
          <button type="button" className="fotos-item-ver" onClick={() => setAmpliada(f.imagem)} title="Ver maior">
            <img src={f.imagem} alt={`Foto ${i + 1} do item`} />
          </button>
          {!somenteLeitura && onRemover && (
            <button
              type="button"
              className="fotos-item-remover no-print"
              onClick={() => confirm('Remover esta foto?') && onRemover(f.id)}
              title="Remover foto"
              aria-label="Remover foto"
            >
              ✕
            </button>
          )}
        </figure>
      ))}
      {podeAdicionar && (
        <label className="fotos-item-adicionar no-print" title="Tirar ou escolher foto">
          📷 {fotos.length === 0 ? 'Foto' : 'Mais'}
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.length) onAdicionar!(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      )}
      {ampliada && (
        <div className="fotos-item-modal no-print" role="dialog" aria-label="Foto ampliada" onClick={() => setAmpliada(null)}>
          <img src={ampliada} alt="Foto ampliada" />
        </div>
      )}
    </div>
  );
}
