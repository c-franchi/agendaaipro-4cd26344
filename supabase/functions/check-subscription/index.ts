import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckSubscriptionRequest {
  email: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map price IDs to plan names
const PRICE_TO_PLAN: Record<string, { name: string; price: number }> = {
  "price_1SooiSENKykBJoOzvGAD2WyQ": { name: "Essencial", price: 97 },
  "price_1SooikENKykBJoOzLOBA5dVR": { name: "Pro", price: 197 },
  "price_1SoojEENKykBJoOzQBTKmCaK": { name: "Premium", price: 397 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { email }: CheckSubscriptionRequest = await req.json();
    
    if (!email) {
      throw new Error("Email é obrigatório");
    }
    
    logStep("Checking subscription for email", { email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer by email
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Customer found", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price?.id;
    const planInfo = priceId ? PRICE_TO_PLAN[priceId] : null;

    // Safely convert timestamps, handling null/undefined values
    const currentPeriodStart = subscription.current_period_start 
      ? new Date(subscription.current_period_start * 1000).toISOString() 
      : null;
    const currentPeriodEnd = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString() 
      : null;

    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planName: planInfo?.name || "Desconhecido",
      planPrice: planInfo?.price || 0,
      priceId: priceId,
    };

    logStep("Active subscription found", subscriptionData);

    return new Response(JSON.stringify({ 
      subscribed: true,
      subscription: subscriptionData 
    }), {
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
