import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FreeSubscriptionRequest {
  planType: string;
  email: string;
  name: string;
  voucherCode: string;
  voucherId: string;
  originalAmount: number;
  discountAmount: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-FREE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const {
      planType,
      email,
      name,
      voucherCode,
      voucherId,
      originalAmount,
      discountAmount,
    }: FreeSubscriptionRequest = await req.json();

    logStep("Request data received", { planType, email, voucherCode });

    if (!email || !planType || !voucherCode) {
      throw new Error("Email, plano e voucher são obrigatórios");
    }

    // Validate voucher again on server side
    const { data: voucher, error: voucherError } = await supabaseClient
      .from("vouchers")
      .select("*")
      .eq("code", voucherCode.toUpperCase())
      .eq("status", "active")
      .single();

    if (voucherError || !voucher) {
      throw new Error("Voucher inválido ou expirado");
    }

    // Verify it's a 100% discount
    if (voucher.discount_type !== "percentage" || voucher.discount_value !== 100) {
      throw new Error("Este voucher não oferece 100% de desconto");
    }

    logStep("Voucher validated", { voucherId: voucher.id });

    // Increment voucher uses
    await supabaseClient.rpc("increment_voucher_uses", { voucher_code: voucherCode.toUpperCase() });

    // Record voucher use
    const { error: insertError } = await supabaseClient.from("voucher_uses").insert({
      voucher_id: voucher.id,
      user_email: email.toLowerCase(),
      user_name: name,
      plan_type: planType,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: 0,
      stripe_checkout_session_id: `free_${Date.now()}`,
    });

    if (insertError) {
      logStep("Error recording voucher use", { error: insertError });
      // Continue anyway, the subscription was created
    }

    logStep("Voucher usage recorded");

    // Send confirmation email
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "AgendaAÍ Pro <noreply@agendaaipro.com.br>",
            to: [email],
            subject: "🎉 Sua assinatura gratuita foi ativada!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #00FFFF;">Parabéns, ${name}!</h1>
                <p>Sua assinatura do plano <strong>${planType.charAt(0).toUpperCase() + planType.slice(1)}</strong> foi ativada com sucesso usando o voucher <strong>${voucherCode}</strong>.</p>
                <p>Valor original: <s>R$ ${originalAmount.toFixed(2)}</s></p>
                <p style="font-size: 18px; color: #00FF00;"><strong>Você não pagará nada!</strong></p>
                <p>Em breve nossa equipe entrará em contato para configurar seu sistema personalizado.</p>
                <hr style="border: 1px solid #333; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">AgendaAÍ Pro - Sistema Profissional de Agenda Digital</p>
              </div>
            `,
          }),
        });
        logStep("Confirmation email sent");
      }
    } catch (emailError) {
      logStep("Email sending failed", { error: emailError });
      // Don't fail the whole request if email fails
    }

    logStep("Free subscription created successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Assinatura gratuita ativada com sucesso!" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
