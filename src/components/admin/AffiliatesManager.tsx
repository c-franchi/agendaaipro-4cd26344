import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Copy } from "lucide-react";

type Affiliate = { id: string; code: string; name: string; whatsapp: string | null; pix_key: string | null; active: boolean };
type Commission = { id: string; affiliate_id: string; kind: string; base_cents: number; commission_cents: number; status: string; created_at: string };
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function AffiliatesManager() {
  const [list, setList] = useState<Affiliate[]>([]);
  const [comms, setComms] = useState<Commission[]>([]);
  const [form, setForm] = useState({ name: "", code: "", whatsapp: "", pix_key: "" });

  async function load() {
    const [a, c] = await Promise.all([
      supabase.from("affiliates").select("id,code,name,whatsapp,pix_key,active").order("created_at", { ascending: false }),
      supabase.from("affiliate_commissions").select("id,affiliate_id,kind,base_cents,commission_cents,status,created_at").order("created_at", { ascending: false }),
    ]);
    setList((a.data as Affiliate[]) || []);
    setComms((c.data as Commission[]) || []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    const code = form.code.trim().toUpperCase();
    if (form.name.trim().length < 2 || !/^[A-Z0-9_-]{2,40}$/.test(code)) return toast.error("Informe nome e código (letras, números, - ou _).");
    const { error } = await supabase.from("affiliates").insert({ name: form.name.trim(), code, whatsapp: form.whatsapp || null, pix_key: form.pix_key || null });
    if (error) return toast.error(error.message.includes("duplicate") ? "Código já existe." : "Não foi possível cadastrar.");
    setForm({ name: "", code: "", whatsapp: "", pix_key: "" });
    toast.success("Afiliado cadastrado"); load();
  }
  async function toggle(a: Affiliate) { await supabase.from("affiliates").update({ active: !a.active }).eq("id", a.id); load(); }
  async function settle(c: Commission, status: "paid" | "canceled") {
    const { error } = await supabase.from("affiliate_commissions").update({ status }).eq("id", c.id);
    if (error) return toast.error("Falha ao atualizar"); load();
  }
  const link = (code: string) => `https://agendaaipro.com.br/?ref=${code}#planos`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Novo afiliado</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-5">
          <Input placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Código (ex: JOAO)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <Input placeholder="WhatsApp" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
          <Input placeholder="Chave Pix" value={form.pix_key} onChange={e => setForm({ ...form, pix_key: e.target.value })} />
          <Button onClick={create}>Cadastrar</Button>
        </CardContent>
      </Card>
      {list.map(a => {
        const mine = comms.filter(c => c.affiliate_id === a.id);
        const pending = mine.filter(c => c.status === "pending").reduce((s, c) => s + c.commission_cents, 0);
        const paid = mine.filter(c => c.status === "paid").reduce((s, c) => s + c.commission_cents, 0);
        return (
          <Card key={a.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base">{a.name} <Badge variant="secondary">{a.code}</Badge></CardTitle>
                <p className="text-sm text-muted-foreground">Pix: {a.pix_key || "—"} · WhatsApp: {a.whatsapp || "—"}</p>
                <p className="text-sm">A pagar: <b>{brl(pending)}</b> · Pago: {brl(paid)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(link(a.code)); toast.success("Link copiado"); }}><Copy className="h-4 w-4" /> Link</Button>
                <Switch checked={a.active} onCheckedChange={() => toggle(a)} aria-label="Ativo" />
              </div>
            </CardHeader>
            {mine.length > 0 && (
              <CardContent className="space-y-2">
                {mine.map(c => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
                    <span>{new Date(c.created_at).toLocaleDateString("pt-BR")} · {c.kind === "setup" ? "Implementação" : "Mensalidade"} de {brl(c.base_cents)} → <b>{brl(c.commission_cents)}</b></span>
                    {c.status === "pending" ? (
                      <span className="flex gap-2"><Button size="sm" onClick={() => settle(c, "paid")}>Marcar pago</Button><Button size="sm" variant="ghost" onClick={() => settle(c, "canceled")}>Cancelar</Button></span>
                    ) : <Badge variant={c.status === "paid" ? "default" : "outline"}>{c.status === "paid" ? "Pago" : "Cancelado"}</Badge>}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
