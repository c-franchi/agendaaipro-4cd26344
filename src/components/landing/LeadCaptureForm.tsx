import { useId, useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { z } from "zod";

// Schema de validação para proteção contra XSS e injeção
const leadSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .trim(),
  email: z
    .string()
    .email("Email inválido")
    .max(255, "Email muito longo")
    .trim(),
  phone: z.string().max(20, "Telefone muito longo").optional(),
  business_type: z.string().max(100, "Tipo de negócio muito longo").optional(),
  message: z.string().max(1000, "Mensagem muito longa").optional(),
});

interface LeadCaptureFormProps {
  source?: string;
  compact?: boolean;
  initialMessage?: string;
}

const LeadCaptureForm = ({
  source = "landing_page",
  compact = false,
  initialMessage = "",
}: LeadCaptureFormProps) => {
  const consentId = useId();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    business_type: "",
    message: initialMessage,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar checkbox LGPD (exceto para formulário compacto que não mostra)
    if (!compact && !lgpdConsent) {
      toast({
        title: "Aceite os termos",
        description:
          "Você precisa concordar com os Termos de Uso e Política de Privacidade.",
        variant: "destructive",
      });
      return;
    }

    // Validar dados com Zod
    const validation = leadSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: "Dados inválidos",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Save lead to database with sanitized data
      const sanitizedData = validation.data;
      const { error } = await supabase.from("leads").insert({
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone || null,
        business_type: sanitizedData.business_type || null,
        message: sanitizedData.message || null,
        source,
      });

      if (error) throw error;

      // Send confirmation email via edge function
      try {
        await supabase.functions.invoke("send-lead-email", {
          body: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || undefined,
            business_type: formData.business_type || undefined,
            message: formData.message || undefined,
          },
        });
      } catch (emailError) {
        // Email sending is non-blocking - log but don't fail the form
        console.error("Email sending failed:", emailError);
      }

      setIsSuccess(true);
      toast({
        title: "Mensagem enviada!",
        description: "Em breve entraremos em contato com você.",
      });

      // Reset form after success
      setFormData({
        name: "",
        email: "",
        phone: "",
        business_type: "",
        message: initialMessage,
      });

      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({
        title: "Erro ao enviar",
        description:
          "Por favor, tente novamente ou entre em contato pelo WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-8 text-center"
      >
        <CheckCircle className="w-16 h-16 text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">Obrigado pelo interesse!</h3>
        <p className="text-muted-foreground">
          Nossa equipe entrará em contato em breve.
        </p>
      </motion.div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder="Seu nome"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="bg-card/50 border-border/50"
        />
        <Input
          type="email"
          placeholder="Seu e-mail"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="bg-card/50 border-border/50"
        />
        <Button
          type="submit"
          variant="hero"
          disabled={isLoading}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar
            </>
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          type="text"
          placeholder="Seu nome *"
          aria-label="Seu nome"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="bg-card/50 border-border/50"
        />
        <Input
          type="email"
          placeholder="Seu e-mail *"
          aria-label="Seu e-mail"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="bg-card/50 border-border/50"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          type="tel"
          placeholder="WhatsApp (opcional)"
          aria-label="WhatsApp"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="bg-card/50 border-border/50"
        />
        <Input
          type="text"
          placeholder="Tipo de negócio (ex: Barbearia)"
          aria-label="Tipo de negócio"
          value={formData.business_type}
          onChange={(e) =>
            setFormData({ ...formData, business_type: e.target.value })
          }
          className="bg-card/50 border-border/50"
        />
      </div>
      <Textarea
        placeholder="Conte-nos um pouco sobre seu negócio (opcional)"
        aria-label="Mensagem"
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        className="bg-card/50 border-border/50 min-h-[100px]"
      />
      {/* LGPD Consent Checkbox */}
      <div className="flex items-start gap-3">
        <Checkbox
          id={consentId}
          checked={lgpdConsent}
          onCheckedChange={(checked) => setLgpdConsent(checked === true)}
          className="mt-0.5"
        />
        <label
          htmlFor={consentId}
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Li e concordo com os{" "}
          <Link to="/termos" className="text-primary hover:underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link to="/privacidade" className="text-primary hover:underline">
            Política de Privacidade
          </Link>
          . *
        </label>
      </div>

      <Button
        type="submit"
        variant="hero"
        size="lg"
        className="w-full"
        disabled={isLoading || !lgpdConsent}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Solicitar Proposta
          </>
        )}
      </Button>
    </form>
  );
};

export default LeadCaptureForm;
