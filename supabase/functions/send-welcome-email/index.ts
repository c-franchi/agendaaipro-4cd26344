import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  name: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const { name, email }: WelcomeEmailRequest = await req.json();

    console.log(`[WELCOME-EMAIL] Sending to ${email}`);

    const welcomeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: bold; color: #00d4d4; }
          .content { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #333; }
          h1 { color: #00d4d4; margin-bottom: 20px; }
          p { line-height: 1.6; color: #cccccc; margin-bottom: 16px; }
          .highlight { color: #00d4d4; font-weight: bold; }
          .features { background: rgba(0,212,212,0.1); border-radius: 12px; padding: 20px; margin: 24px 0; }
          .features ul { list-style: none; padding: 0; margin: 0; }
          .features li { padding: 8px 0; color: #cccccc; }
          .features li::before { content: "✓ "; color: #00d4d4; font-weight: bold; }
          .cta { display: inline-block; background: linear-gradient(135deg, #00d4d4, #00a0a0); color: #000; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 24px; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AgendaAÍ Pro</div>
          </div>
          <div class="content">
            <h1>Bem-vindo(a), ${name}! 🎉</h1>
            <p>Sua conta no <span class="highlight">AgendaAÍ Pro</span> foi criada com sucesso!</p>
            <p>Agora você tem acesso ao sistema de agendamento mais inteligente do mercado, com inteligência artificial integrada para transformar seu negócio.</p>
            
            <div class="features">
              <p style="color: #00d4d4; font-weight: bold; margin-bottom: 12px;">O que você pode fazer agora:</p>
              <ul>
                <li>Acessar seu painel de controle</li>
                <li>Gerenciar sua assinatura</li>
                <li>Configurar sua agenda inteligente</li>
                <li>Automatizar confirmações via WhatsApp</li>
              </ul>
            </div>
            
            <p>Se tiver qualquer dúvida, nossa equipe está pronta para ajudar!</p>
            
            <p>Abraços,<br><span class="highlight">Equipe AgendaAÍ Pro</span></p>
            
            <a href="https://agendaaipro.com.br/meu-perfil" class="cta">Acessar minha conta</a>
          </div>
          <div class="footer">
            <p>© 2026 AgendaAÍ Pro - Sistema de Agenda Digital Profissional</p>
            <p>Você está recebendo este email porque se cadastrou em nossa plataforma.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: (Deno.env.get("EMAIL_FROM") ?? "AgendaAÍ Pro <onboarding@resend.dev>"),
        to: [email],
        subject: "Bem-vindo(a) ao AgendaAÍ Pro! 🎉",
        html: welcomeHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await response.json();
    console.log("[WELCOME-EMAIL] Sent successfully:", data);

    // Send notification to admin
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    if (adminEmail) {
      const adminHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
            .header { background: #00d4d4; padding: 20px; text-align: center; color: #000; }
            .content { padding: 24px; }
            .field { margin-bottom: 16px; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; }
            .value { font-size: 16px; color: #333; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🆕 Novo Usuário Cadastrado</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Nome</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>
              <div class="field">
                <div class="label">Data</div>
                <div class="value">${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: (Deno.env.get("EMAIL_FROM") ?? "AgendaAÍ Pro <onboarding@resend.dev>"),
          to: [adminEmail],
          subject: `🆕 Novo cadastro: ${name}`,
          html: adminHtml,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[WELCOME-EMAIL] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
