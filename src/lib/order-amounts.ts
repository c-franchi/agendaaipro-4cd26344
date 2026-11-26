export function orderAmounts(order: {setup_cents: number; setup_due_cents?: number | null}) {
  const due = order.setup_due_cents ?? order.setup_cents;
  return {due, discount: Math.max(0, order.setup_cents - due)};
}