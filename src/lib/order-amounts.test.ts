// @ts-ignore bun test runner, matching the project's adjacent tests
import {test, expect} from 'bun:test';
import {orderAmounts} from './order-amounts';

test('100% de implantação preserva R$ 350 de desconto e total zero', () => {
  expect(orderAmounts({setup_cents: 35000, setup_due_cents: 0})).toEqual({due: 0, discount: 35000});
});
test('pedido sem valor descontado mantém o preço registrado', () => {
  expect(orderAmounts({setup_cents: 35000, setup_due_cents: null})).toEqual({due: 35000, discount: 0});
});