// @ts-ignore bun test runner
import { test, expect } from "bun:test";
import { voucherLink, scopeLabel, discountLabel } from "./voucher-share";
const base = { code: "promo10", discount_type: "percentage" as const, discount_value: 10, applies_to: "monthly", discount_months: 3, expires_at: null };
test("link carries the voucher code in upper case and opens plans", () => {
  expect(voucherLink("promo10")).toBe("https://agendaaipro.com.br/?voucher=PROMO10#planos");
});
test("affiliate code is added to the link", () => {
  expect(voucherLink("X", "ana")).toBe("https://agendaaipro.com.br/?voucher=X&ref=ana#planos");
});
test("text describes monthly duration", () => { expect(scopeLabel(base)).toBe("na mensalidade por 3 meses"); });
test("lifetime setup+monthly", () => { expect(scopeLabel({ ...base, applies_to: "setup_and_monthly", discount_months: 0 })).toBe("na implementação + mensalidade para sempre"); });
test("fixed discount label", () => { expect(discountLabel({ ...base, discount_type: "fixed", discount_value: 50 })).toBe("R$ 50,00 OFF"); });
