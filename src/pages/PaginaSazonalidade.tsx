import { useEffect, useMemo, useState } from 'react';
import {
  SAZONALIDADE,
  UF_PARA_REGIAO,
  NOME_REGIAO,
  MESES_NOMES,
  itensEmSafra,
  type CategoriaSazonal,
  type RegiaoClimatica,
} from '../data/sazonalidade';

interface EstadoIBGE {
  id: number;
  sigla: string;
  nome: string;
}

const COR_CAT: Record<CategoriaSazonal, { bg: string; text: string; emoji: string; rotulo: string }> = {
  fruta:  { bg: '#fff3e0', text: '#e65100', emoji: '🍎', rotulo: 'Frutas' },
  verdura:{ bg: '#e8f5e9', text: '#2e7d32', emoji: '🥬', rotulo: 'Verduras' },
  legume: { bg: '#e3f2fd', text: '#1565c0', emoji: '🥕', rotulo: 'Legumes' },
  raiz:   { bg: '#fce4ec', text: '#880e4f', emoji: '🥔', rotulo: 'Raízes e tubérculos' },
};

const CATS_ORDEM: CategoriaSazonal[] = ['fruta', 'verdura', 'legume', 'raiz'];

const ESTADOS_FALLBACK: EstadoIBGE[] = [
  { id: 12, sigla: 'AC', nome: 'Acre' },
  { id: 27, sigla: 'AL', nome: 'Alagoas' },
  { id: 16, sigla: 'AP', nome: 'Amapá' },
  { id: 13, sigla: 'AM', nome: 'Amazonas' },
  { id: 29, sigla: 'BA', nome: 'Bahia' },
  { id: 23, sigla: 'CE', nome: 'Ceará' },
  { id: 53, sigla: 'DF', nome: 'Distrito Federal' },
  { id: 32, sigla: 'ES', nome: 'Espírito Santo' },
  { id: 52, sigla: 'GO', nome: 'Goiás' },
  { id: 21, sigla: 'MA', nome: 'Maranhão' },
  { id: 51, sigla: 'MT', nome: 'Mato Grosso' },
  { id: 50, sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { id: 31, sigla: 'MG', nome: 'Minas Gerais' },
  { id: 15, sigla: 'PA', nome: 'Pará' },
  { id: 25, sigla: 'PB', nome: 'Paraíba' },
  { id: 41, sigla: 'PR', nome: 'Paraná' },
  { id: 26, sigla: 'PE', nome: 'Pernambuco' },
  { id: 22, sigla: 'PI', nome: 'Piauí' },
  { id: 33, sigla: 'RJ', nome: 'Rio de Janeiro' },
  { id: 24, sigla: 'RN', nome: 'Rio Grande do Norte' },
  { id: 43, sigla: 'RS', nome: 'Rio Grande do Sul' },
  { id: 11, sigla: 'RO', nome: 'Rondônia' },
  { id: 14, sigla: 'RR', nome: 'Roraima' },
  { id: 42, sigla: 'SC', nome: 'Santa Catarina' },
  { id: 35, sigla: 'SP', nome: 'São Paulo' },
  { id: 28, sigla: 'SE', nome: 'Sergipe' },
  { id: 17, sigla: 'TO', nome: 'Tocantins' },
].sort((a, b) => a.nome.localeCompare(b.nome));

export function PaginaSazonalidade() {
  const hoje = new Date();
  const [mes, setMes] = useState<number>(hoje.getMonth() + 1);
  const [uf, setUf] = useState<string>(() => localStorage.getItem('sazonalidade_uf') ?? 'SP');
  const [estados, setEstados] = useState<EstadoIBGE[]>(ESTADOS_FALLBACK);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then((r) => r.json())
      .then((data: EstadoIBGE[]) => {
        setEstados(data);
        setApiOk(true);
      })
      .catch(() => setApiOk(false));
  }, []);

  const mudarUf = (novaUf: string) => {
    setUf(novaUf);
    localStorage.setItem('sazonalidade_uf', novaUf);
  };

  const regiao = UF_PARA_REGIAO[uf] as RegiaoClimatica | undefined;

  const itensSafra = useMemo(
    () => (regiao ? itensEmSafra(mes, regiao) : []),
    [mes, regiao],
  );

  const porCategoria = useMemo(() => {
    const mapa: Partial<Record<CategoriaSazonal, typeof itensSafra>> = {};
    for (const cat of CATS_ORDEM) {
      const lista = itensSafra.filter((i) => i.categoria === cat);
      if (lista.length > 0) mapa[cat] = lista;
    }
    return mapa;
  }, [itensSafra]);

  const gradeAnual = useMemo(
    () => (regiao ? SAZONALIDADE.filter((i) => (i.meses[regiao] ?? []).length > 0) : []),
    [regiao],
  );

  return (
    <div>
      <h1>Sazonalidade</h1>
      <p className="subtitulo">
        Frutas, verduras e legumes em safra por estado e mês, com calendário anual.
      </p>

      <div className="card">
        <div className="linha" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <label>Estado (UF)</label>
            <select
              value={uf}
              onChange={(e) => mudarUf(e.target.value)}
              style={{ minWidth: 240 }}
            >
              {estados.map((e) => (
                <option key={e.sigla} value={e.sigla}>
                  {e.sigla} — {e.nome}
                </option>
              ))}
            </select>
            {apiOk === false && (
              <small style={{ color: 'var(--cinza)', display: 'block', marginTop: 4 }}>
                Lista carregada localmente (API IBGE indisponível).
              </small>
            )}
          </div>
          <div>
            <label>Mês</label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              style={{ minWidth: 170 }}
            >
              {MESES_NOMES.map((nome, i) => (
                <option key={i + 1} value={i + 1}>
                  {nome}
                </option>
              ))}
            </select>
          </div>
          {regiao && (
            <div style={{ alignSelf: 'flex-end', paddingBottom: 3 }}>
              <span className="tag">Região: {NOME_REGIAO[regiao]}</span>
            </div>
          )}
        </div>
      </div>

      {regiao && (
        <>
          {/* Itens em safra no mês selecionado */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>
              Em safra em {MESES_NOMES[mes - 1]}
              <span
                style={{ fontWeight: 400, fontSize: 14, marginLeft: 12, color: 'var(--cinza)' }}
              >
                {itensSafra.length} {itensSafra.length === 1 ? 'item' : 'itens'} — {uf} ({NOME_REGIAO[regiao]})
              </span>
            </h3>

            {itensSafra.length === 0 ? (
              <p style={{ color: 'var(--cinza)' }}>
                Nenhum item mapeado para este mês na região {NOME_REGIAO[regiao]}.
              </p>
            ) : (
              CATS_ORDEM.map((cat) => {
                const lista = porCategoria[cat];
                if (!lista) return null;
                const cor = COR_CAT[cat];
                return (
                  <div key={cat} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{cor.emoji}</span>
                      <strong style={{ color: cor.text }}>{cor.rotulo}</strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {lista.map((item) => (
                        <span
                          key={item.id}
                          style={{
                            background: cor.bg,
                            color: cor.text,
                            padding: '4px 14px',
                            borderRadius: 20,
                            fontWeight: 500,
                            fontSize: 14,
                          }}
                        >
                          {item.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Calendário anual */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>
              Calendário anual — {uf} ({NOME_REGIAO[regiao]})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ fontSize: 12, minWidth: 680 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', minWidth: 160 }}>Item</th>
                    <th style={{ textAlign: 'left', minWidth: 80 }}>Tipo</th>
                    {MESES_NOMES.map((m, i) => (
                      <th
                        key={i}
                        style={{
                          width: 32,
                          textAlign: 'center',
                          background: mes === i + 1 ? '#e8f0fe' : undefined,
                          color: mes === i + 1 ? '#1a56db' : undefined,
                          fontWeight: mes === i + 1 ? 700 : 400,
                        }}
                      >
                        {m.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gradeAnual.map((item) => {
                    const mesesItem = item.meses[regiao] ?? [];
                    const cor = COR_CAT[item.categoria];
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.nome}</td>
                        <td>
                          <span
                            style={{
                              background: cor.bg,
                              color: cor.text,
                              padding: '1px 7px',
                              borderRadius: 8,
                              fontSize: 11,
                            }}
                          >
                            {cor.emoji} {COR_CAT[item.categoria].rotulo.replace(/s$/, '')}
                          </span>
                        </td>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <td
                            key={m}
                            title={mesesItem.includes(m) ? `${item.nome} em safra` : undefined}
                            style={{
                              textAlign: 'center',
                              background: mesesItem.includes(m)
                                ? mes === m
                                  ? cor.bg
                                  : '#f0f0f0'
                                : undefined,
                              color: mesesItem.includes(m) && mes === m ? cor.text : '#888',
                              fontWeight: mesesItem.includes(m) && mes === m ? 700 : 400,
                            }}
                          >
                            {mesesItem.includes(m) ? '●' : ''}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ fontSize: 13, color: 'var(--cinza)' }}>
            <strong>Fontes:</strong> CEAGESP · EMBRAPA · literatura agronômica brasileira. Para
            preços e cotações atualizadas, consulte{' '}
            <a
              href="https://www.conab.gov.br/info-agro/precos"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primario)' }}
            >
              conab.gov.br/info-agro/precos
            </a>
            . Lista de estados via API pública do{' '}
            <a
              href="https://servicodados.ibge.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primario)' }}
            >
              IBGE
            </a>
            .
          </div>
        </>
      )}
    </div>
  );
}
