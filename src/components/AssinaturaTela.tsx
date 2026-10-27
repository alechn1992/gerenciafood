// Assinatura desenhada na tela, com o dedo (celular/tablet), caneta ou mouse.
// Devolve a imagem como data URL PNG com fundo transparente.

import { useEffect, useRef, useState } from 'react';

export function AssinaturaTela({
  valor,
  onChange,
  altura = 160,
}: {
  /** Imagem já salva (data URL); mostrada até a pessoa assinar de novo. */
  valor?: string;
  onChange: (imagem: string | undefined) => void;
  altura?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const ultimo = useRef<{ x: number; y: number } | null>(null);
  const [vazio, setVazio] = useState(true);
  const [editando, setEditando] = useState(!valor);
  /** Última imagem que este quadro mesmo produziu. */
  const emitida = useRef<string | undefined>(undefined);

  // Assinatura que chega de fora (ex.: relatório carregado depois de montar):
  // mostra a imagem em vez do quadro em branco.
  useEffect(() => {
    if (valor && valor !== emitida.current) setEditando(false);
  }, [valor]);

  // Ajusta o canvas à largura disponível e à densidade da tela (traço nítido).
  useEffect(() => {
    if (!editando) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let larguraAtual = 0;
    const ajustar = () => {
      const largura = canvas.parentElement?.clientWidth ?? 320;
      // No celular a barra de endereço muda a altura da janela ao rolar; só a
      // largura justifica redesenhar (o que apagaria a assinatura).
      if (largura === larguraAtual) return;
      larguraAtual = largura;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      canvas.style.width = `${largura}px`;
      canvas.style.height = `${altura}px`;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#1b2a4a';
      setVazio(true);
    };
    ajustar();
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, [editando, altura]);

  const ponto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const iniciar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    desenhando.current = true;
    ultimo.current = ponto(e);
    // Um toque sem arrastar ainda deixa um ponto.
    const ctx = e.currentTarget.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(ultimo.current.x, ultimo.current.y, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle as string;
    ctx.fill();
    setVazio(false);
  };

  const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!desenhando.current || !ultimo.current) return;
    e.preventDefault();
    const p = ponto(e);
    const ctx = e.currentTarget.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(ultimo.current.x, ultimo.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ultimo.current = p;
  };

  const terminar = () => {
    if (!desenhando.current) return;
    desenhando.current = false;
    ultimo.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    emitida.current = canvas.toDataURL('image/png');
    onChange(emitida.current);
  };

  const limpar = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setVazio(true);
    emitida.current = undefined;
    onChange(undefined);
  };

  if (!editando && valor) {
    return (
      <div className="assinatura-tela">
        <div className="assinatura-tela-quadro">
          <img src={valor} alt="Assinatura" style={{ maxHeight: altura, maxWidth: '100%' }} />
        </div>
        <div className="assinatura-tela-acoes">
          <button type="button" className="btn pequeno secundario" onClick={() => setEditando(true)}>
            Assinar de novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assinatura-tela">
      <div className="assinatura-tela-quadro">
        <canvas
          ref={canvasRef}
          onPointerDown={iniciar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerCancel={terminar}
          onPointerLeave={terminar}
          aria-label="Área para assinar"
        />
        {vazio && <span className="assinatura-tela-dica">Assine aqui com o dedo ou o mouse</span>}
        <div className="assinatura-tela-linha" />
      </div>
      <div className="assinatura-tela-acoes">
        <button type="button" className="btn pequeno secundario" onClick={limpar}>
          Limpar
        </button>
        {valor && (
          <button type="button" className="btn pequeno secundario" onClick={() => setEditando(false)}>
            Manter a anterior
          </button>
        )}
      </div>
    </div>
  );
}
