import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ExternalLink,
  User as UserIcon,
  Mail,
  LogOut,
  Crown,
  Settings
} from "lucide-react";
import logoSimple from "@/assets/logo-simple.png";

interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  planName: string;
  planPrice: number;
  priceId: string;
}

const MyProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
      
      // Check subscription
      checkSubscription(session.user.email!);
    };

    checkAuth();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => authSub.unsubscribe();
  }, [navigate]);

  const checkSubscription = async (email: string) => {
    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        body: { email: email.toLowerCase().trim() },
      });

      if (error) throw error;

      if (data.subscribed) {
        setSubscription(data.subscription);
      }
    } catch (error: any) {
      console.error("Error checking subscription:", error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user?.email) return;

    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { email: user.email.toLowerCase().trim() },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Error opening portal:", error);
      toast.error("Erro ao abrir portal: " + error.message);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Você saiu da sua conta");
  };

  const formatDate = (dateString: string) => {
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

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || "Usuário";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoSimple} alt="AgendaAÍ Pro" className="h-8" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Olá, {userName}! 👋</h1>
            <p className="text-muted-foreground">
              Gerencie sua conta e assinatura do AgendaAÍ Pro
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-primary" />
                  Meus Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Nome</p>
                      <p className="font-medium">{userName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Membro desde</p>
                      <p className="font-medium">
                        {user?.created_at ? formatDate(user.created_at) : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Card */}
            <Card className={`glass-card ${subscription ? 'border-primary/30' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  Minha Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptionLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ativa
                      </Badge>
                      <span className="text-xl font-bold text-primary">{subscription.planName}</span>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor mensal</span>
                        <span className="font-medium">{formatCurrency(subscription.planPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Próxima cobrança</span>
                        <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                      </div>
                    </div>

                    {subscription.cancelAtPeriodEnd && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-yellow-500 text-sm">
                          ⚠️ Sua assinatura será cancelada em {formatDate(subscription.currentPeriodEnd)}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={openCustomerPortal}
                      disabled={portalLoading}
                      className="w-full"
                      variant="outline"
                    >
                      {portalLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Abrindo...
                        </>
                      ) : (
                        <>
                          <Settings className="w-4 h-4 mr-2" />
                          Gerenciar assinatura
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                      <XCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium mb-1">Nenhuma assinatura ativa</p>
                      <p className="text-sm text-muted-foreground">
                        Escolha um plano e comece a usar o AgendaAÍ Pro
                      </p>
                    </div>
                    <Button asChild className="w-full">
                      <Link to="/#precos">
                        <Crown className="w-4 h-4 mr-2" />
                        Ver planos
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                  <Link to="/#precos">
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs">Ver Planos</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                  <Link to="/faq">
                    <span className="text-lg">❓</span>
                    <span className="text-xs">Dúvidas</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                  <Link to="/#contato">
                    <Mail className="w-5 h-5" />
                    <span className="text-xs">Suporte</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                  <Link to="/termos">
                    <span className="text-lg">📜</span>
                    <span className="text-xs">Termos</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default MyProfile;
