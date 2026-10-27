import { describe, it, expect } from 'vitest';
import { chaveAcao, resumoAcoes, situacaoAcao, sincronizarPlano } from './planoAcao';
import type { AcaoCorretiva, Relatorio, Visita } from './types';

const itens = [
  { id: 'i1', texto: 'Lixeiras com tampa e pedal' },
  { id: 'i2', texto: 'Uniformes limpos' },
];
const checklist = (id: string, data: string, respostas: Record<string, string>): Relatorio => ({
  id, clienteId: 'c1', avaliador: '', registroCRN: '', ehCei: false, dataAvaliacao: data,
  respostas, observacoes: {}, geradoEm: data, atualizadoEm: data,
});
const visita = (id: string, data: string, status: 'conforme' | 'nao_conforme'): Visita => ({
  id, clienteId: 'c1', data, consultor: '', tipo: 'auditoria', observacoes: '', criadoEm: data,
  secoes: [{ id: 's1', nome: 'Cozinha', itens: [{ id: 'v1', descricao: 'Ralos sem tampa', status }] }],
});
const sync = (acoes: AcaoCorretiva[], checklists: Relatorio[], visitas: Visita[] = []) =>
  sincronizarPlano(acoes, { checklists, itensChecklist: itens, visitas, hoje: '2026-10-27' });

describe('plano de ação unificado', () => {
  it('cria ação para cada não conformidade do último checklist e das visitas', () => {
    const r = sync([], [checklist('r1', '2026-10-01', { i1: 'nao_conforme', i2: 'conforme' })], [visita('v', '2026-10-10', 'nao_conforme')]);
    expect(r.map((a) => `${a.origem}:${a.itemTexto}`)).toEqual([
      'checklist:Lixeiras com tampa e pedal',
      'visita:Cozinha: Ralos sem tampa',
    ]);
    expect(r[0].prazo).toBe('2026-11-26');
    expect(r[0].origemData).toBe('2026-10-01');
  });

  it('não duplica a ação quando o item segue não conforme no checklist seguinte e mantém o que foi preenchido', () => {
    const primeira = sync([], [checklist('r1', '2026-03-01', { i1: 'nao_conforme' })]);
    primeira[0].acao = 'Comprar lixeiras com pedal';
    const segunda = sync(primeira, [
      checklist('r1', '2026-03-01', { i1: 'nao_conforme' }),
      checklist('r2', '2026-10-01', { i1: 'nao_conforme' }),
    ]);
    expect(segunda).toHaveLength(1);
    expect(segunda[0].acao).toBe('Comprar lixeiras com pedal');
  });

  it('conclui a ação quando o item fica conforme no checklist mais recente, e reabre se voltar', () => {
    const plano = sync([], [checklist('r1', '2026-03-01', { i1: 'nao_conforme' })]);
    const resolvido = sync(plano, [checklist('r2', '2026-10-01', { i1: 'conforme' })]);
    expect(resolvido[0].status).toBe('concluido');
    expect(resolvido[0].resolvidoEm).toBe('2026-10-01');
    const reaberto = sync(resolvido, [checklist('r3', '2026-12-01', { i1: 'nao_conforme' })]);
    expect(reaberto[0].status).toBe('pendente');
    expect(reaberto[0].resolvidoEm).toBeUndefined();
  });

  it('não mexe em ação concluída à mão', () => {
    const plano = sync([], [checklist('r1', '2026-03-01', { i1: 'nao_conforme' })]);
    plano[0].status = 'concluido';
    expect(sync(plano, [checklist('r1', '2026-03-01', { i1: 'nao_conforme' })])[0].status).toBe('concluido');
  });

  it('conclui a ação da visita quando o item é corrigido nela', () => {
    const plano = sync([], [], [visita('v', '2026-10-10', 'nao_conforme')]);
    expect(sync(plano, [], [visita('v', '2026-10-10', 'conforme')])[0].status).toBe('concluido');
  });

  it('ações antigas sem origem continuam com a mesma chave', () => {
    expect(chaveAcao({ itemId: 'i1' })).toBe('checklist:i1');
    expect(chaveAcao({ itemId: 'manual-123' })).toBe('manual:manual-123');
  });

  it('marca como atrasada a ação aberta com prazo vencido e resume o plano', () => {
    const base = sync([], [checklist('r1', '2026-03-01', { i1: 'nao_conforme', i2: 'nao_conforme' })]);
    base[0].prazo = '2026-10-01';
    base[1].status = 'concluido';
    expect(situacaoAcao(base[0], '2026-10-27')).toBe('atrasada');
    expect(resumoAcoes(base, '2026-10-27')).toMatchObject({ total: 2, pendentes: 1, concluidas: 1, atrasadas: 1, progresso: 50 });
  });
});
