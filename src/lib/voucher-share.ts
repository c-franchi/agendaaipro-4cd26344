export type ShareVoucher = { code: string; discount_type: "percentage" | "fixed"; discount_value: number; applies_to: string; discount_months: number; expires_at: string | null };

const SITE = "https://agendaaipro.com.br";
const KEY = "agendaai_voucher";

export function voucherLink(code: string, ref?: string) {
  const p = new URLSearchParams({ voucher: code.trim().toUpperCase() });
  if (ref) p.set("ref", ref);
  return `${SITE}/?${p.toString()}#planos`;
}

export function discountLabel(v: ShareVoucher) {
  return v.discount_type === "percentage" ? `${v.discount_value}% OFF` : `R$ ${Number(v.discount_value).toFixed(2).replace(".", ",")} OFF`;
}

export function scopeLabel(v: ShareVoucher) {
  const months = v.discount_months === 0 ? "para sempre" : `por ${v.discount_months} ${v.discount_months === 1 ? "mês" : "meses"}`;
  switch (v.applies_to) {
    case "setup": return "na implementação do seu sistema";
    case "first_payment": return "na primeira mensalidade";
    case "monthly": return `na mensalidade ${months}`;
    case "setup_and_first": return "na implementação + primeira mensalidade";
    case "setup_and_monthly": return v.discount_months === 0 ? "na implementação + mensalidade para sempre" : `na implementação + mensalidade ${months}`;
    default: return "na sua contratação";
  }
}

export function voucherShareText(v: ShareVoucher, ref?: string) {
  const until = v.expires_at ? `\n⏳ Válido até ${new Date(v.expires_at).toLocaleDateString("pt-BR")}. Corra!` : "\n⏳ Por tempo limitado!";
  return `🎁 *PRESENTE EXCLUSIVO AgendaAÍ Pro!*\n\n🔥 *${discountLabel(v)}* ${scopeLabel(v)}!\n\nTenha seu próprio sistema de agendamento online, com pagamentos e vendas em um só lugar. 📅💳\n\n🎟️ Seu cupom: *${v.code}*${until}\n\n👉 Garanta agora: ${voucherLink(v.code, ref)}`;
}

export function whatsappShareUrl(v: ShareVoucher, ref?: string) {
  return `https://wa.me/?text=${encodeURIComponent(voucherShareText(v, ref))}`;
}

/** Saves ?voucher= (and ?ref=) from the address so checkout can prefill it. */
export function captureVoucherFromUrl() {
  try {
    const p = new URLSearchParams(window.location.search);
    const code = p.get("voucher");
    if (code && /^[A-Z0-9_-]{1,80}$/i.test(code)) localStorage.setItem(KEY, code.toUpperCase());
    const ref = p.get("ref");
    if (ref && /^[A-Z0-9_-]{1,40}$/i.test(ref)) localStorage.setItem("agendaai_ref", ref.toUpperCase());
  } catch { /* ignore */ }
}

export function savedVoucher() {
  try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
}
