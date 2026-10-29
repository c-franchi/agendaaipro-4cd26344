import {allowed,cors} from "../_shared/commerce-runtime.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LeadEmailRequest {
  name: string;
  email: string;
  phone?: string;
  business_type?: string;
  message?: string;
  source?: string;
}

const sendEmail = async (to: string[], subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: (Deno.env.get("EMAIL_FROM") ?? "AgendaAÍ Pro <onboarding@resend.dev>"),
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
};

const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if(req.method!=="POST"||!allowed(req))return Response.json({error:"Origem ou método inválido"},{status:403,headers:cors(req)});
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const body: LeadEmailRequest = await req.json();
    if(typeof body.name!=='string'||body.name.trim().length<2||body.name.length>100||typeof body.email!=='string'||body.email.length>255||!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(body.email)||(['phone','business_type','message','source'] as const).some(k=>body[k]!==undefined&&(typeof body[k]!=='string'||body[k].length>(k==='message'?1000:k==='phone'?30:100))))return Response.json({error:'Dados inválidos'},{status:400,headers:cors(req)});
    const email=body.email.trim();
    const [name,phone,business_type,message,source]=[body.name,body.phone,body.business_type,body.message,body.source].map(v=>escapeHtml(v||''));

    // Email to the lead (confirmation)
    const confirmationHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
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
            <h1>Olá, ${name}! 👋</h1>
            <p>Ficamos muito felizes com seu interesse no <span class="highlight">AgendaAÍ Pro</span>!</p>
            <p>Recebemos suas informações e nossa equipe entrará em contato em breve para entender melhor suas necessidades e apresentar a melhor solução para o seu negócio.</p>
            ${business_type ? `<p>Vimos que você atua na área de <span class="highlight">${business_type}</span>. Temos soluções específicas para esse segmento!</p>` : ''}
            <h2>Resumo da sua solicitação</h2><p><strong>Nome:</strong> ${name}<br/><strong>E-mail:</strong> ${escapeHtml(email)}<br/><strong>WhatsApp:</strong> ${phone||'Não informado'}<br/><strong>Área:</strong> ${business_type||'Não informada'}<br/><strong>Origem:</strong> ${source||'Site'}</p><p style="white-space:pre-wrap"><strong>Mensagem e plano solicitado:</strong><br/>${message||'Não informados'}</p>
            <p>Enquanto isso, fique à vontade para responder este email caso tenha alguma dúvida.</p>
            <p>Até breve! 🚀</p>
            <a href="https://agendaaipro.com.br" class="cta">Conhecer mais sobre o AgendaAÍ Pro</a>
          </div>
          <div class="footer">
            <p>© 2026 AgendaAÍ Pro - Sistema de Agenda Digital Profissional</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const confirmationEmail = await sendEmail(
      [email],
      "Recebemos seu interesse no AgendaAÍ Pro! 🎉",
      confirmationHtml
    ).catch(()=>null);

    // Email to admin (notification)
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "neifranchi@gmail.com";
    if (adminEmail) {
      const adminHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #00d4d4, #00a0a0); padding: 20px; text-align: center; }
            .header h1 { color: #fff; margin: 0; font-size: 20px; }
            .content { padding: 30px; }
            .field { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
            .field:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
            .value { font-size: 16px; color: #333; }
            .cta { display: block; background: #00d4d4; color: #000; text-align: center; padding: 16px; text-decoration: none; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Novo Lead Capturado!</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Nome</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
              </div>
              ${phone ? `
              <div class="field">
                <div class="label">Telefone</div>
                <div class="value"><a href="tel:${phone}">${phone}</a></div>
              </div>
              ` : ''}
              ${business_type ? `
              <div class="field">
                <div class="label">Tipo de Negócio</div>
                <div class="value">${business_type}</div>
              </div>
              ` : ''}
              ${message ? `
              <div class="field">
                <div class="label">Mensagem e plano solicitado</div>
                <div class="value">${message.replace(/\n/g,"<br/>")}</div>
              </div>
              ` : ''}
            </div>
            <p>Origem: ${source||'Site'}</p><a href="https://agendaaipro.com.br/admin" class="cta">Ver no Painel Admin</a>
          </div>
        </body>
        </html>
      `;

      await sendEmail(
        [adminEmail],
        `🔔 Novo Lead: ${name} - ${business_type || 'Não informado'}`,
        adminHtml
      );
    }

    if(!confirmationEmail)throw Error("A confirmação ao solicitante não foi enviada.");

    return new Response(JSON.stringify({ success: true, data: confirmationEmail }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-lead-email function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
