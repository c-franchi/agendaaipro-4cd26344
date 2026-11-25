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

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { nav("/auth?redirect=/afiliado"); return; }
      const { data } = await supabase.from("affiliates").select("*");
      const mine = ((data as Aff[]) || []).find(a => a.email?.toLowerCase() === user.email?.toLowerCase()) || null;
      setAff(mine);
      if (mine) {
        const c = await supabase.from("affiliate_commissions").select("id,kind,base_cents,commission_cents,status,created_at").eq("affiliate_id", mine.id).order("created_at", { ascending: false });
        setComs((c.data as Com[]) || []);
      }
      setLoading(false);
    })();
  }, [nav]);

  const sum = (s: string) => coms.filter(c => c.status === s).reduce((t, c) => t + c.commission_cents, 0);
  const link = aff ? `https://agendaaipro.com.br/?ref=${aff.code}#planos` : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl py-8 space-y-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Início</Link>
        <h1 className="text-2xl font-bold">Área do afiliado</h1>
        {loading ? <p className="text-muted-foreground">Carregando…</p> : !aff ? (
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
