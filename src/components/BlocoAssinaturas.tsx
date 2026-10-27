// Assinaturas de um relatório (checklist ou visita): a do profissional, que
// pode ser a padrão do cadastro, desenhada na tela ou em branco para o papel,
// e a do responsável do estabelecimento, opcional.

import type { AssinaturasRelatorio, ModoAssinatura, Profissional } from '../domain/types';
import { AssinaturaTela } from './AssinaturaTela';

const OPCOES: { modo: ModoAssinatura; rotulo: string }[] = [
  { modo: 'padrao', rotulo: 'Assinatura padrão do cadastro' },
  { modo: 'tela', rotulo: 'Assinar na tela' },
  { modo: 'papel', rotulo: 'Em branco (assinar no papel)' },
];

/** Modo efetivo: sem escolha, usa a padrão quando o profissional tem uma. */
export function modoAssinatura(a: AssinaturasRelatorio | undefined, prof?: Profissional): ModoAssinatura {
  if (a?.modo) return a.modo;
  return prof?.assinatura ? 'padrao' : 'papel';
}

export function BlocoAssinaturas({
  valor,
  onChange,
  profissional,
  nomeProfissional,
  registro,
  data,
  semImpressao,
}: {
  valor: AssinaturasRelatorio | undefined;
  onChange: (a: AssinaturasRelatorio) => void;
  profissional?: Profissional;
  nomeProfissional: string;
  registro?: string;
  /** Data já formatada, para o campo "Data" da impressão. */
  data: string;
  /** A página desenha a própria área de assinaturas na impressão. */
  semImpressao?: boolean;
}) {
  const a = valor ?? {};
  const modo = modoAssinatura(a, profissional);
  const temPadrao = !!profissional?.assinatura;
  const atualizar = (campos: Partial<AssinaturasRelatorio>) => onChange({ ...a, modo, ...campos });

  const imagemProfissional =
    modo === 'padrao' ? profissional?.assinatura : modo === 'tela' ? a.imagemTela : undefined;

  return (
    <>
      <div className="no-print">
        <label>Assinatura do profissional</label>
        <div className="assinatura-opcoes" role="radiogroup" aria-label="Como assinar">
          {OPCOES.map((o) => {
            const desabilitada = o.modo === 'padrao' && !temPadrao;
            return (
              <label
                key={o.modo}
                className={`assinatura-opcao${modo === o.modo ? ' on' : ''}${desabilitada ? ' desabilitada' : ''}`}
                title={desabilitada ? 'Selecione um profissional com assinatura cadastrada (Cadastros → Profissionais)' : undefined}
              >
                <input
                  type="radio"
                  name="modo-assinatura"
                  checked={modo === o.modo}
                  disabled={desabilitada}
                  onChange={() => atualizar({ modo: o.modo })}
                />
                {o.rotulo}
              </label>
            );
          })}
        </div>
        {modo === 'padrao' && temPadrao && (
          <img src={profissional!.assinatura} alt="Assinatura padrão" style={{ maxHeight: 70, maxWidth: 240, objectFit: 'contain' }} />
        )}
        {modo === 'padrao' && !temPadrao && (
          <p className="subtitulo" style={{ margin: 0 }}>
            O profissional selecionado não tem assinatura cadastrada.
          </p>
        )}
        {modo === 'tela' && (
          <AssinaturaTela valor={a.imagemTela} onChange={(img) => atualizar({ imagemTela: img })} />
        )}

        <div style={{ marginTop: 18 }}>
          <label>Responsável pelo estabelecimento (opcional)</label>
          <div className="grid cols-2" style={{ marginBottom: 8 }}>
            <input
              value={a.responsavelLocal ?? ''}
              onChange={(e) => atualizar({ responsavelLocal: e.target.value })}
              placeholder="Nome de quem acompanhou"
              aria-label="Nome do responsável pelo estabelecimento"
            />
            <input
              value={a.responsavelCargo ?? ''}
              onChange={(e) => atualizar({ responsavelCargo: e.target.value })}
              placeholder="Cargo (ex.: Diretora, Cozinheira)"
              aria-label="Cargo do responsável"
            />
          </div>
          <AssinaturaTela
            valor={a.imagemResponsavel}
            onChange={(img) => atualizar({ imagemResponsavel: img })}
            altura={130}
          />
        </div>
      </div>

      {/* Impressão */}
      {!semImpressao && (
      <div className="somente-print">
      <div className="assinatura-bloco" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="assinatura-campo">
          {imagemProfissional ? (
            <img src={imagemProfissional} alt="Assinatura" style={{ maxHeight: 64, maxWidth: 200, objectFit: 'contain' }} />
          ) : (
            <div className="assinatura-linha" />
          )}
          <div className="assinatura-rotulo">
            {nomeProfissional || 'Responsável técnico'}
            {registro && ` — ${registro}`}
          </div>
        </div>
        {(a.responsavelLocal || a.imagemResponsavel) && (
          <div className="assinatura-campo">
            {a.imagemResponsavel ? (
              <img src={a.imagemResponsavel} alt="Assinatura do responsável" style={{ maxHeight: 64, maxWidth: 200, objectFit: 'contain' }} />
            ) : (
              <div className="assinatura-linha" />
            )}
            <div className="assinatura-rotulo">
              {a.responsavelLocal || 'Responsável pelo estabelecimento'}
              {a.responsavelCargo && ` — ${a.responsavelCargo}`}
            </div>
          </div>
        )}
        <div className="assinatura-campo">
          <div className="assinatura-linha">{data}</div>
          <div className="assinatura-rotulo">Data</div>
        </div>
      </div>
      </div>
      )}
    </>
  );
}
