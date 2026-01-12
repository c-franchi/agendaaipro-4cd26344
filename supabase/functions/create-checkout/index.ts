import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  planType: string;
  email: string;
  name: string;
  voucherCode?: string;
  originalAmount: number;
  discountAmount?: number;
  finalAmount: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const {
      planType,
      email,
      name,
      voucherCode,
      originalAmount,
      discountAmount = 0,
      finalAmount,
    }: CheckoutRequest = await req.json();

    logStep("Request data received", { planType, email, voucherCode, originalAmount, finalAmount });

    if (!email || !planType || !finalAmount) {
      throw new Error("Email, plano e valor são obrigatórios");
    }

    // If voucher code is provided, validate it again on the server side
    let validatedVoucher = null;
    if (voucherCode) {
      const { data: voucher, error } = await supabaseClient
        .from("vouchers")
        .select("*")
        .eq("code", voucherCode.toUpperCase())
        .eq("status", "active")
        .single();

      if (!error && voucher) {
        validatedVoucher = voucher;
        logStep("Voucher validated", { voucherId: voucher.id });
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Create Stripe Checkout Session with dynamic pricing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `AgendaAÍ Pro - Plano ${planType}`,
              description: voucherCode 
                ? `Assinatura mensal com voucher ${voucherCode} aplicado`
                : "Assinatura mensal do sistema de agenda profissional",
            },
            unit_amount: Math.round(finalAmount * 100), // Convert to cents
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/?payment=cancelled`,
      metadata: {
        plan_type: planType,
        voucher_code: voucherCode || "",
        voucher_id: validatedVoucher?.id || "",
        original_amount: originalAmount.toString(),
        discount_amount: discountAmount.toString(),
        final_amount: finalAmount.toString(),
        customer_name: name,
        customer_email: email,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // If voucher was used, increment usage and record
    if (validatedVoucher) {
      // Increment voucher uses
      await supabaseClient.rpc("increment_voucher_uses", { voucher_code: voucherCode?.toUpperCase() });

      // Record voucher use
      await supabaseClient.from("voucher_uses").insert({
        voucher_id: validatedVoucher.id,
        user_email: email.toLowerCase(),
        user_name: name,
        plan_type: planType,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        stripe_checkout_session_id: session.id,
      });

      logStep("Voucher usage recorded");
    }

    return new Response(JSON.stringify({ url: session.url }), {
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
