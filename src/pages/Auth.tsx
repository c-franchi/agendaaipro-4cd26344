import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, User } from "lucide-react";
import { Link } from "react-router-dom";
import logoSimple from "@/assets/logo-simple.png";

type AuthMode = "login" | "signup" | "forgot-password";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  
  // Check for pending checkout data
  const pendingCheckout = localStorage.getItem("pending_checkout");
  const isAffiliateFlow = redirectTo === "/afiliado";
  const isCheckoutFlow = !isAffiliateFlow && (redirectTo === "checkout" || !!pendingCheckout);

  // Start with signup form when coming from checkout flow
  const [mode, setMode] = useState<AuthMode>(isCheckoutFlow ? "signup" : "login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    // Check if already logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && event === "SIGNED_IN") {
        // Defer navigation to avoid deadlock
        setTimeout(() => {
          handleSuccessfulAuth();
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSuccessfulAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSuccessfulAuth = async () => {
    if (isAffiliateFlow) {
      navigate("/afiliado", { replace: true });
    } else if (isCheckoutFlow && pendingCheckout) {
      // Parse pending checkout data and open checkout modal
      try {
        const checkoutData = JSON.parse(pendingCheckout);
        // Store flag to auto-open checkout
        localStorage.setItem("auto_open_checkout", JSON.stringify(checkoutData));
        // Clear pending checkout
        localStorage.removeItem("pending_checkout");
        // Navigate to home with checkout intent
        navigate("/#planos");
        toast.success("Conta criada! Finalizando sua compra...");
      } catch {
        navigate("/#planos");
        toast.success("Login realizado! Agora você pode finalizar sua compra.");
      }
    } else if (isCheckoutFlow) {
      navigate("/#planos");
      toast.success("Login realizado! Agora você pode finalizar sua compra.");
    } else {
      navigate("/meu-perfil");
    }
  };

  const validateInputs = () => {
    if (!email) {
      toast.error("Preencha o email");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email inválido");
      return false;
    }
    if (mode !== "forgot-password") {
      if (!password) {
        toast.error("Preencha a senha");
        return false;
      }
      if (password.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
        return false;
      }
    }
    if (mode === "signup" && !name.trim()) {
      toast.error("Preencha seu nome");
      return false;
    }
    return true;
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Preencha seu email para recuperar a senha");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email inválido");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setMode("login");
    } catch (error) {
      toast.error("Erro ao enviar email de recuperação");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Preserve the pending plan choice so the checkout resumes after the OAuth redirect.
      if (!isAffiliateFlow && pendingCheckout) {
        localStorage.setItem("auto_open_checkout", pendingCheckout);
        localStorage.removeItem("pending_checkout");
      }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: isAffiliateFlow ? `${window.location.origin}/auth?redirect=/afiliado` : window.location.origin,
      });
      if (result.error) {
        toast.error("Não foi possível entrar com o Google. Tente novamente.");
        setLoading(false);
        return;
      }
      if (result.redirected) {
        // Browser is redirecting to Google; keep the loading state.
        return;
      }
      // Session already set; onAuthStateChange handles the navigation.
    } catch {
      toast.error("Erro ao entrar com o Google");
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "forgot-password") {
      await handleForgotPassword();
      return;
    }

    if (!validateInputs()) return;

    setLoading(true);
    try {
      if (mode === "login") {
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
      } else {
        const { data, error } = await supabase.auth.signUp({
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
            toast.error("Este email já está cadastrado. Faça login.");
            setMode("login");
          } else {
            toast.error(error.message);
          }
          return;
        }

        // Send welcome email
        try {
          await supabase.functions.invoke("send-welcome-email", {
            body: { name, email },
          });
        } catch (emailError) {
          console.error("Welcome email error:", emailError);
        }

        toast.success("Conta criada com sucesso!");
        
        // Auto login after signup
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) {
          console.error("Auto-login error:", loginError);
          setMode("login");
        }
      }
    } catch (error) {
      toast.error("Erro ao processar sua solicitação");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "forgot-password") return "Recuperar Senha";
    if (isCheckoutFlow) {
      return mode === "login" ? "Faça login para continuar" : "Crie sua conta para continuar";
    }
    return mode === "login" ? "Acessar minha conta" : "Criar Conta";
  };

  const getDescription = () => {
    if (mode === "forgot-password") {
      return "Digite seu email para receber o link de recuperação";
    }
    if (isCheckoutFlow) {
      return mode === "login" 
        ? "Entre com sua conta para finalizar a contratação" 
        : "Crie uma conta para gerenciar sua assinatura";
    }
    return mode === "login" ? "Entre para acessar seu painel" : "Crie sua conta para começar";
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
            <h1 className="text-2xl font-bold mb-2">{getTitle()}</h1>
            <p className="text-muted-foreground text-sm">{getDescription()}</p>
          </div>

          {isCheckoutFlow && pendingCheckout && mode !== "forgot-password" && (
            <div className="bg-primary/10 rounded-lg p-3 mb-6 text-center">
              <p className="text-sm text-primary">
                {mode === "login" 
                  ? "Após o login, você será redirecionado para finalizar sua compra."
                  : "Após criar sua conta, você finalizará sua contratação."
                }
              </p>
            </div>
          )}

          {mode !== "forgot-password" && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center rounded-md border border-[#8E918F] bg-[#131314] px-3 py-2.5 text-sm font-medium text-[#E3E3E3] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" className="mr-2.5 shrink-0">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
                Continuar com Google
              </button>

              <div className="flex items-center gap-3 my-6">
                <span className="flex-1 border-t border-border/30" />
                <span className="text-xs text-muted-foreground">ou continue com email</span>
                <span className="flex-1 border-t border-border/30" />
              </div>
            </>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === "signup" && (
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

            {mode !== "forgot-password" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot-password")}
                      className="text-xs text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
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
            )}

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading 
                ? "Processando..." 
                : mode === "forgot-password" 
                  ? "Enviar Link de Recuperação"
                  : mode === "login" 
                    ? "Entrar" 
                    : "Criar Conta"
              }
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {mode === "forgot-password" ? (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Voltar para o login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === "login"
                  ? "Não tem conta? Criar agora"
                  : "Já tem conta? Fazer login"}
              </button>
            )}
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
