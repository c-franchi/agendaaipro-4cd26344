import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Aff = { id: string; code: string; name: string; email?: string | null };
type Com = { id: string; kind: string; base_cents: number; commission_cents: number; status: string; created_at: string };
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Affiliate() {
  const nav = useNavigate();
  const [aff, setAff] = useState<Aff | null>(null);
  const [coms, setComs] = useState<Com[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let canceled = false;
    const clear = () => { setAff(null); setComs([]); };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Never retain another session's financial data after sign-out or account change.
      clear();
      setLoading(true);
      setTimeout(() => { if (!canceled) void load(); }, 0);
    });
    async function load() {
      setFailed(false);
      try {
      const { data: { user } } = await supabase.auth.getUser();
      if (canceled) return;
      if (!user?.email) { clear(); nav("/auth?redirect=/afiliado", { replace: true }); return; }
      // Exact email equality is case-insensitive; RLS remains the authority.
      const escapedEmail = user.email.replace(/[\\%_]/g, "\\$&");
      const { data: mine, error } = await supabase.from("affiliates").select("id,code,name,email").ilike("email", escapedEmail).maybeSingle();
      if (error) throw error;
      if (canceled) return;
      let commissions: Com[] = [];
      if (mine) {
        const c = await supabase.from("affiliate_commissions").select("id,kind,base_cents,commission_cents,status,created_at").eq("affiliate_id", mine.id).order("created_at", { ascending: false });
        if (c.error) throw c.error;
        commissions = c.data || [];
      }
      // Discard responses that completed after the authenticated account changed.
      const { data: current } = await supabase.auth.getUser();
      if (canceled) return;
      if (current.user?.id !== user.id || current.user?.email !== user.email) { clear(); return; }
      setAff(mine);
      setComs(commissions);
      } catch {
        if (!canceled) { clear(); setFailed(true); }
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    void load();
    return () => { canceled = true; subscription.unsubscribe(); };
  }, [nav]);

  const sum = (s: string) => coms.filter(c => c.status === s).reduce((t, c) => t + c.commission_cents, 0);
  const link = aff ? `https://agendaaipro.com.br/?ref=${aff.code}#planos` : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl py-8 space-y-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Início</Link>
        <h1 className="text-2xl font-bold">Área do afiliado</h1>
        {loading ? <p className="text-muted-foreground">Carregando…</p> : failed ? <p role="alert">Não foi possível consultar seus dados. Tente novamente mais tarde.</p> : !aff ? (
          <Card><CardContent className="pt-6 space-y-3">
            <p>Seu e-mail ainda não está cadastrado como afiliado.</p>
            <Button asChild><a href="https://wa.me/5516997813038?text=Quero%20ser%20afiliado%20AgendaA%C3%8D%20Pro" target="_blank" rel="noopener noreferrer">Quero ser afiliado</a></Button>
          </CardContent></Card>
        ) : (<>
          <Card><CardContent className="pt-6 space-y-3">
            <p>Olá, <b>{aff.name}</b> <Badge variant="secondary">{aff.code}</Badge></p>
            <p className="text-sm text-muted-foreground">Você ganha 15% da implementação e 5% de cada mensalidade, enquanto o cliente pagar.</p>
            <div className="flex flex-wrap gap-2 items-center">
              <code className="text-xs break-all rounded bg-muted p-2">{link}</code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copiado"); }}><Copy className="h-4 w-4" /> Copiar</Button>
            </div>
          </CardContent></Card>
          <div className="grid grid-cols-2 gap-3">
            <Card><CardHeader><CardTitle className="text-sm">A receber</CardTitle></CardHeader><CardContent className="text-xl font-bold">{brl(sum("pending"))}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Já recebido</CardTitle></CardHeader><CardContent className="text-xl font-bold">{brl(sum("paid"))}</CardContent></Card>
          </div>
          <Card><CardHeader><CardTitle className="text-base">Comissões</CardTitle></CardHeader><CardContent className="space-y-2">
            {coms.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma venda ainda.</p> : coms.map(c => (
              <div key={c.id} className="flex flex-wrap justify-between gap-2 rounded-md border p-2 text-sm">
                <span>{new Date(c.created_at).toLocaleDateString("pt-BR")} · {c.kind === "setup" ? "Implementação" : "Mensalidade"} de {brl(c.base_cents)} → <b>{brl(c.commission_cents)}</b></span>
                <Badge variant={c.status === "paid" ? "default" : "outline"}>{c.status === "paid" ? "Pago" : c.status === "pending" ? "A receber" : "Cancelado"}</Badge>
              </div>))}
          </CardContent></Card>
        </>)}
      </div>
    </div>
  );
}
