import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, User } from "lucide-react";
import { Link } from "react-router-dom";
import logoSimple from "@/assets/logo-simple.png";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Check for pending checkout data
  const pendingCheckout = localStorage.getItem("pending_checkout");
  const isCheckoutFlow = redirectTo === "checkout" || !!pendingCheckout;

  useEffect(() => {
    // Check if already logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        handleSuccessfulAuth();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSuccessfulAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSuccessfulAuth = () => {
    if (isCheckoutFlow) {
      // Redirect back to home with checkout intent
      navigate("/#precos");
      toast.success("Login realizado! Agora você pode finalizar sua compra.");
    } else {
      navigate("/admin");
    }
  };

  const validateInputs = () => {
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return false;
    }
    if (!isLogin && !name.trim()) {
      toast.error("Preencha seu nome");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email inválido");
      return false;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return false;
    }
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Login realizado com sucesso!");
        handleSuccessfulAuth();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: name,
              name: name,
            },
          },
        });
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este email já está cadastrado");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Conta criada com sucesso!");
        // Auto login after signup for checkout flow
        if (isCheckoutFlow) {
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!loginError) {
            handleSuccessfulAuth();
          }
        } else {
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast.error("Erro ao processar sua solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 rounded-2xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-6">
              <img src={logoSimple} alt="AgendaAÍ Pro" className="h-14 mx-auto" />
            </Link>
            <h1 className="text-2xl font-bold mb-2">
              {isCheckoutFlow 
                ? (isLogin ? "Faça login para continuar" : "Crie sua conta")
                : (isLogin ? "Acesso Administrativo" : "Criar Conta")
              }
            </h1>
            <p className="text-muted-foreground text-sm">
              {isCheckoutFlow
                ? (isLogin 
                    ? "Entre com sua conta para finalizar a contratação" 
                    : "Crie uma conta para gerenciar sua assinatura"
                  )
                : (isLogin
                    ? "Entre para gerenciar seus leads"
                    : "Crie sua conta de administrador"
                  )
              }
            </p>
          </div>

          {isCheckoutFlow && pendingCheckout && (
            <div className="bg-primary/10 rounded-lg p-3 mb-6 text-center">
              <p className="text-sm text-primary">
                Após o login, você poderá finalizar sua contratação.
              </p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? "Processando..." : isLogin ? "Entrar" : "Criar Conta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin
                ? "Não tem conta? Criar agora"
                : "Já tem conta? Fazer login"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border/30">
            <Link to="/">
              <Button variant="ghost" className="w-full" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao site
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
