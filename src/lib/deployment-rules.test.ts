// @ts-ignore bun test runner
import { describe, expect, it } from 'bun:test';
import { deliveryBlockers, storageKey, validateUpload, MAX_UPLOAD_BYTES } from './deployment-rules';

describe('upload', () => {
  it('aceita PNG abaixo de 20 MB', () => expect(validateUpload({ name: 'a.png', size: 1000, type: 'image/png' })).toBeNull());
  it('recusa acima de 20 MB', () => expect(validateUpload({ name: 'a.pdf', size: MAX_UPLOAD_BYTES + 1, type: 'application/pdf' })).toMatch('20 MB'));
  it('recusa formato não permitido', () => expect(validateUpload({ name: 'a.svg', size: 10, type: 'image/svg+xml' })).toMatch('formato'));
  it('recusa extensão que não bate com o MIME', () => expect(validateUpload({ name: 'a.pdf', size: 10, type: 'text/html' })).toMatch('formato'));
  it('não permite sair da pasta da implantação', () => {
    const k = storageKey('inst-1', '../../outra/x.png', 'abcdefgh');
    expect(k.startsWith('inst-1/abcdefgh-')).toBe(true);
    expect(k.split('/')).toHaveLength(2);
  });
});

const ok = { contractFlow: 'direct', workspacePhase: 'approved', externalId: 'x1', domain: 'a.com.br', enabledFeatures: ['agendamentos'], checklistPending: 0 };
describe('entrega', () => {
  it('libera com tudo completo', () => expect(deliveryBlockers(ok)).toEqual([]));
  it('bloqueia direta sem aprovação do cliente', () => expect(deliveryBlockers({ ...ok, workspacePhase: 'review' })).toContain('aprovação do pedido'));
  it('bloqueia assistida antes de pronta', () => expect(deliveryBlockers({ ...ok, contractFlow: 'assisted', orderStage: 'in_progress' })).toContain('aprovação do pedido'));
  it('bloqueia sem identificador', () => expect(deliveryBlockers({ ...ok, externalId: '' })).toContain('identificador da instalação'));
  it('bloqueia com checklist pendente', () => expect(deliveryBlockers({ ...ok, checklistPending: 2 })).toContain('2 etapa(s) do checklist'));
});
