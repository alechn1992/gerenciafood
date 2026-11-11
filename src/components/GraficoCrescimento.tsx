// Curva de crescimento da OMS (como na Caderneta da Criança): faixas coloridas
// da classificação, curvas de escore-z e as medidas da criança por cima.

import { useMemo, useState } from 'react';
import { curvas, faixaDoGrafico, type Indicador, type Sexo, type TabelasOms } from '../domain/antropometria';

export interface PontoCrianca {
  meses: number;
  valor: number;
  data: string;
  z?: number;
}

const ROTULO: Record<Indicador, { titulo: string; eixo: string; unidade: string; casas: number }> = {
  imc: { titulo: 'IMC para a idade', eixo: 'IMC (kg/m²)', unidade: 'kg/m²', casas: 1 },
  estatura: { titulo: 'Estatura para a idade', eixo: 'Estatura (cm)', unidade: 'cm', casas: 1 },
  peso: { titulo: 'Peso para a idade', eixo: 'Peso (kg)', unidade: 'kg', casas: 1 },
};

type Zona = 'alerta' | 'adequado' | 'risco' | 'excesso';

/** Faixas entre curvas consecutivas e a zona de cada uma, por indicador. */
function zonas(indicador: Indicador, meses: number): { de: number; ate: number; zona: Zona; rotulo: string }[] {
  if (indicador === 'imc') {
    const ate5 = meses < 60;
    return [
      { de: -3, ate: -2, zona: 'alerta', rotulo: 'Magreza' },
      { de: -2, ate: 1, zona: 'adequado', rotulo: 'Eutrofia' },
      { de: 1, ate: 2, zona: 'risco', rotulo: ate5 ? 'Risco de sobrepeso' : 'Sobrepeso' },
      { de: 2, ate: 3, zona: 'excesso', rotulo: ate5 ? 'Sobrepeso' : 'Obesidade' },
    ];
  }
  if (indicador === 'estatura')
    return [
      { de: -3, ate: -2, zona: 'alerta', rotulo: 'Baixa estatura' },
      { de: -2, ate: 3, zona: 'adequado', rotulo: 'Estatura adequada' },
    ];
  return [
    { de: -3, ate: -2, zona: 'alerta', rotulo: 'Baixo peso' },
    { de: -2, ate: 2, zona: 'adequado', rotulo: 'Peso adequado' },
    { de: 2, ate: 3, zona: 'risco', rotulo: 'Peso elevado' },
  ];
}

const L = 52; // margens do desenho
const R = 34;
const T = 14;
const B = 40;
const W = 760;
const H = 400;

const rotuloIdade = (meses: number, faixa: [number, number]) => {
  if (faixa[1] <= 24) return `${Math.round(meses)}m`;
  const anos = meses / 12;
  return Number.isInteger(anos) ? `${anos}a` : `${Math.floor(anos)}a${Math.round(meses % 12)}m`;
};

export function GraficoCrescimento({
  tabelas,
  indicador,
  sexo,
  pontos,
}: {
  tabelas: TabelasOms;
  indicador: Indicador;
  sexo: Sexo;
  pontos: PontoCrianca[];
}) {
  const [foco, setFoco] = useState<number | null>(null);
  const ultimo = pontos[pontos.length - 1];
  const faixa = faixaDoGrafico(ultimo?.meses ?? 0);
  const visiveis = pontos.filter((p) => p.meses >= faixa[0] && p.meses <= faixa[1]);
  const linhas = useMemo(() => curvas(tabelas, indicador, sexo, faixa), [tabelas, indicador, sexo, faixa[0], faixa[1]]);
  const porZ = (z: number) => linhas.find((c) => c.z === z)!.pontos;

  const valores = [...linhas.flatMap((c) => c.pontos.map((p) => p.valor)), ...visiveis.map((p) => p.valor)];
  const yMin = Math.floor(Math.min(...valores) - 0.5);
  const yMax = Math.ceil(Math.max(...valores) + 0.5);
  const x = (m: number) => L + ((m - faixa[0]) / (faixa[1] - faixa[0])) * (W - L - R);
  const y = (v: number) => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B);
  const caminho = (pts: { meses: number; valor: number }[]) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.meses).toFixed(1)},${y(p.valor).toFixed(1)}`).join('');
  const faixaEntre = (de: number, ate: number) => {
    const a = porZ(de);
    const b = porZ(ate).slice().reverse();
    return `${caminho(a)}${b.map((p) => `L${x(p.meses).toFixed(1)},${y(p.valor).toFixed(1)}`).join('')}Z`;
  };

  // Marcas dos eixos.
  const passoX = faixa[1] - faixa[0] <= 24 ? 2 : faixa[1] - faixa[0] <= 36 ? 6 : 12;
  const marcasX: number[] = [];
  for (let m = faixa[0]; m <= faixa[1]; m += passoX) marcasX.push(m);
  const passoY = yMax - yMin > 60 ? 10 : yMax - yMin > 24 ? 5 : yMax - yMin > 10 ? 2 : 1;
  const marcasY: number[] = [];
  for (let v = Math.ceil(yMin / passoY) * passoY; v <= yMax; v += passoY) marcasY.push(v);

  const info = ROTULO[indicador];
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: info.casas, maximumFractionDigits: info.casas });
  const zs = zonas(indicador, ultimo?.meses ?? 0);
  const focado = foco !== null ? visiveis[foco] : null;

  return (
    <figure className="grafico-crescimento">
      <figcaption className="grafico-crescimento-titulo">
        {info.titulo} · {sexo === 'M' ? 'menino' : 'menina'} · {rotuloIdade(faixa[0], faixa)} a {rotuloIdade(faixa[1], faixa)}
      </figcaption>
      <div className="grafico-crescimento-area">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${info.titulo}: curvas da OMS e medidas da criança`}>
          {/* Faixas da classificação */}
          {zs.map((z) => (
            <path key={`${z.de}`} d={faixaEntre(z.de, z.ate)} className={`gc-zona gc-zona-${z.zona}`} />
          ))}
          {/* Grade */}
          {marcasY.map((v) => (
            <g key={`y${v}`}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="gc-grade" />
              <text x={L - 8} y={y(v)} className="gc-eixo" textAnchor="end" dominantBaseline="middle">
                {v}
              </text>
            </g>
          ))}
          {marcasX.map((m) => (
            <g key={`x${m}`}>
              <line x1={x(m)} x2={x(m)} y1={T} y2={H - B} className="gc-grade" />
              <text x={x(m)} y={H - B + 16} className="gc-eixo" textAnchor="middle">
                {rotuloIdade(m, faixa)}
              </text>
            </g>
          ))}
          <text x={(L + W - R) / 2} y={H - 6} className="gc-eixo-titulo" textAnchor="middle">
            Idade
          </text>
          <text x={12} y={(T + H - B) / 2} className="gc-eixo-titulo" textAnchor="middle" transform={`rotate(-90 12 ${(T + H - B) / 2})`}>
            {info.eixo}
          </text>
          {/* Curvas de escore-z */}
          {linhas.map((c) => (
            <g key={c.z}>
              <path d={caminho(c.pontos)} className={`gc-curva gc-curva-${Math.abs(c.z)}`} />
              {c.pontos.length > 0 && (
                <text
                  x={W - R + 4}
                  y={y(c.pontos[c.pontos.length - 1].valor)}
                  className="gc-rotulo-curva"
                  dominantBaseline="middle"
                >
                  {c.z > 0 ? `+${c.z}` : c.z}
                </text>
              )}
            </g>
          ))}
          {/* Medidas da criança */}
          {visiveis.length > 1 && <path d={caminho(visiveis)} className="gc-trajeto" />}
          {visiveis.map((p, i) => (
            <circle
              key={`${p.data}-${i}`}
              cx={x(p.meses)}
              cy={y(p.valor)}
              r={i === visiveis.length - 1 ? 6.5 : 5}
              className={`gc-ponto${i === visiveis.length - 1 ? ' gc-ponto-ultimo' : ''}`}
              tabIndex={0}
              onMouseEnter={() => setFoco(i)}
              onMouseLeave={() => setFoco(null)}
              onFocus={() => setFoco(i)}
              onBlur={() => setFoco(null)}
              onClick={() => setFoco(foco === i ? null : i)}
            >
              <title>{`${p.data.split('-').reverse().join('/')}: ${fmt(p.valor)} ${info.unidade}`}</title>
            </circle>
          ))}
          {/* Área de toque maior que o ponto */}
          {visiveis.map((p, i) => (
            <circle
              key={`alvo-${p.data}-${i}`}
              cx={x(p.meses)}
              cy={y(p.valor)}
              r={14}
              fill="transparent"
              onMouseEnter={() => setFoco(i)}
              onMouseLeave={() => setFoco(null)}
              onClick={() => setFoco(foco === i ? null : i)}
            />
          ))}
        </svg>
        {focado && (
          <div
            className="gc-dica"
            style={{
              left: `${(x(focado.meses) / W) * 100}%`,
              top: `${(y(focado.valor) / H) * 100}%`,
            }}
            role="status"
          >
            <strong>{focado.data.split('-').reverse().join('/')}</strong>
            <span>
              {fmt(focado.valor)} {info.unidade}
              {focado.z !== undefined && ` · escore-z ${focado.z.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        )}
      </div>
      <ul className="gc-legenda">
        {zs.map((z) => (
          <li key={z.rotulo}>
            <span className={`gc-amostra gc-zona-${z.zona}`} aria-hidden />
            {z.rotulo}
          </li>
        ))}
        <li>
          <span className="gc-amostra-ponto" aria-hidden />
          Medidas da criança
        </li>
        <li className="gc-legenda-nota">Linhas: escores-z da OMS (0 = mediana)</li>
      </ul>
      {pontos.length > visiveis.length && (
        <p className="gc-legenda-nota">
          {pontos.length - visiveis.length} medida(s) de outra faixa de idade não aparecem neste gráfico (veja o histórico).
        </p>
      )}
    </figure>
  );
}
