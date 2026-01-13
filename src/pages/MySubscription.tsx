import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  RefreshCw,
  ExternalLink,
  Mail,
  Rocket
} from "lucide-react";
import logoSimple from "@/assets/logo-simple.png";
import { SubscriptionExpirationWarning } from "@/components/subscription/SubscriptionExpirationWarning";
import { APP_URL } from "@/lib/constants";

interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  planName: string;
  planPrice: number;
  priceId: string;
}

const MySubscription = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const checkSubscription = async () => {
    if (!email) {
      toast.error("Por favor, informe seu email");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        body: { email: email.toLowerCase().trim() },
      });

      if (error) throw error;

      setSubscribed(data.subscribed);
      setSubscription(data.subscription);
      setChecked(true);

      if (data.subscribed) {
        toast.success("Assinatura encontrada!");
      } else {
        toast.info("Nenhuma assinatura ativa encontrada para este email");
      }
    } catch (error: any) {
      toast.error("Erro ao verificar assinatura. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!email) return;

    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { email: email.toLowerCase().trim() },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast.error("Erro ao abrir portal. Tente novamente.");
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoSimple} alt="AgendaAÍ Pro" className="h-8" />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="container py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Minha Assinatura</h1>
            <p className="text-muted-foreground">
              Gerencie sua assinatura do AgendaAÍ Pro
            </p>
          </div>

          {/* Email Input Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Verificar Assinatura
              </CardTitle>
              <CardDescription>
                Digite o email usado na contratação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkSubscription()}
                />
              </div>
              <Button
                onClick={checkSubscription}
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : checked ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verificar novamente
                  </>
                ) : (
                  "Verificar assinatura"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          {checked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {subscribed && subscription ? (
                <>
                  {/* Expiration Warning */}
                  <SubscriptionExpirationWarning
                    endDate={subscription.currentPeriodEnd}
                    planPrice={subscription.planPrice}
                    planName={subscription.planName}
                  />

                  {/* Access App Button */}
                  <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
                    <CardContent className="py-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                            <Rocket className="w-6 h-6 text-primary" />
                          </div>
                          <div className="text-center sm:text-left">
                            <h3 className="font-semibold text-lg">Pronto para usar!</h3>
                            <p className="text-sm text-muted-foreground">
                              Acesse o AgendaAÍ Pro
                            </p>
                          </div>
                        </div>
                        <Button asChild size="lg" className="w-full sm:w-auto">
                          <a href={APP_URL} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-5 h-5 mr-2" />
                            Acessar o Aplicativo
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-primary/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          Assinatura Ativa
                        </CardTitle>
                        <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                          {subscription.status === "active" ? "Ativa" : subscription.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Plan Details */}
                      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Plano</span>
                          <span className="font-semibold text-primary">{subscription.planName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Valor mensal</span>
                          <span className="font-semibold">{formatCurrency(subscription.planPrice)}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Próxima cobrança
                          </span>
                          <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                        </div>
                      </div>

                      {subscription.cancelAtPeriodEnd && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                          <p className="text-yellow-500 text-sm">
                            ⚠️ Sua assinatura será cancelada em {formatDate(subscription.currentPeriodEnd)}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="space-y-3">
                        <Button
                          onClick={openCustomerPortal}
                          disabled={portalLoading}
                          className="w-full"
                          variant="outline"
                        >
                          {portalLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Abrindo portal...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Gerenciar assinatura
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          No portal você pode atualizar forma de pagamento, cancelar ou reativar sua assinatura
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="glass-card border-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                      Nenhuma Assinatura Encontrada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Não encontramos uma assinatura ativa para o email <strong>{email}</strong>.
                    </p>
                    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium">Possíveis motivos:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• O email informado é diferente do usado na contratação</li>
                        <li>• A assinatura foi cancelada ou expirou</li>
                        <li>• O pagamento não foi concluído</li>
                      </ul>
                    </div>
                    <Button asChild className="w-full">
                      <Link to="/#planos">
                        Ver planos disponíveis
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default MySubscription;
