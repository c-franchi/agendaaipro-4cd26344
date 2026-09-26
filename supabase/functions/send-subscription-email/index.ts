import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  name: string;
  planName: string;
  amount: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-SUBSCRIPTION-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");

    const { email, name, planName, amount }: EmailRequest = await req.json();
    logStep("Request data received", { email, name, planName, amount });

    if (!email || !name || !planName) {
      throw new Error("Email, nome e plano são obrigatórios");
    }

    const formattedAmount = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0f1a;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #00e5cc; font-size: 28px; margin: 0;">AgendaAÍ Pro</h1>
          </div>
          
          <!-- Main Content -->
          <div style="background: linear-gradient(135deg, #0d1424 0%, #131c2e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(0, 229, 204, 0.2);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #00e5cc 0%, #00b3a0 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✓</span>
              </div>
            </div>
            
            <h2 style="color: #ffffff; text-align: center; font-size: 24px; margin: 0 0 20px;">
              Parabéns, ${name}!
            </h2>
            
            <p style="color: #a0aec0; text-align: center; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
              Sua assinatura do <strong style="color: #00e5cc;">Plano ${planName}</strong> foi confirmada com sucesso!
            </p>
            
            <!-- Plan Details -->
            <div style="background: rgba(0, 229, 204, 0.1); border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <h3 style="color: #00e5cc; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px;">
                Detalhes da Assinatura
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #a0aec0; padding: 6px 0;">Plano</td>
                  <td style="color: #ffffff; font-weight: 600; text-align: right; padding: 6px 0;">${planName}</td>
                </tr>
                <tr>
                  <td style="color: #a0aec0; padding: 6px 0;">Valor mensal</td>
                  <td style="color: #ffffff; font-weight: 600; text-align: right; padding: 6px 0;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="color: #a0aec0; padding: 6px 0;">Status</td>
                  <td style="color: #00e5cc; font-weight: 600; text-align: right; padding: 6px 0;">Ativa</td>
                </tr>
              </table>
            </div>
            
            <!-- Next Steps -->
            <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 16px;">
              Próximos passos:
            </h3>
            <ul style="color: #a0aec0; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0 0 30px;">
              <li>Nossa equipe entrará em contato em até 24 horas</li>
              <li>Vamos configurar seu sistema personalizado</li>
              <li>Você receberá acesso ao seu painel em breve</li>
            </ul>
            
            <!-- CTA Button -->
            <div style="text-align: center;">
              <a href="https://wa.me/5511999999999" style="display: inline-block; background: linear-gradient(135deg, #00e5cc 0%, #00b3a0 100%); color: #000000; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px;">
                Falar com nossa equipe
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px;">
              Dúvidas? Entre em contato conosco
            </p>
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              © 2026 AgendaAÍ Pro. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: (Deno.env.get("EMAIL_FROM") ?? "AgendaAÍ Pro <onboarding@resend.dev>"),
        to: [email],
        subject: "🎉 Bem-vindo ao AgendaAÍ Pro! Sua assinatura foi confirmada",
        html: htmlContent,
      }),
    });

    const result = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(result.message || "Failed to send email");
    }

    logStep("Email sent successfully", { emailId: result.id });

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
