import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateVoucherRequest {
  code: string;
  email: string;
  planType: string;
  originalAmount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { code, email, planType, originalAmount }: ValidateVoucherRequest = await req.json();

    console.log("[VALIDATE-VOUCHER] Validating voucher:", { code, email, planType, originalAmount });

    if (!code || !email || !originalAmount) {
      throw new Error("Código, email e valor são obrigatórios");
    }

    // Find voucher by code
    const { data: voucher, error: voucherError } = await supabaseClient
      .from("vouchers")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (voucherError || !voucher) {
      console.log("[VALIDATE-VOUCHER] Voucher not found:", code);
      return new Response(
        JSON.stringify({ valid: false, message: "Código promocional não encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log("[VALIDATE-VOUCHER] Found voucher:", voucher);

    // Check voucher status
    if (voucher.status !== "active") {
      const statusMessages: Record<string, string> = {
        expired: "Este código promocional expirou",
        exhausted: "Este código promocional atingiu o limite de usos",
        disabled: "Este código promocional foi desativado",
      };
      return new Response(
        JSON.stringify({ valid: false, message: statusMessages[voucher.status] || "Código inválido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check start date
    const now = new Date();
    if (new Date(voucher.starts_at) > now) {
      return new Response(
        JSON.stringify({ valid: false, message: "Este código promocional ainda não está ativo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check expiration
    if (voucher.expires_at && new Date(voucher.expires_at) < now) {
      // Update status to expired
      await supabaseClient
        .from("vouchers")
        .update({ status: "expired" })
        .eq("id", voucher.id);

      return new Response(
        JSON.stringify({ valid: false, message: "Este código promocional expirou" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check max uses
    if (voucher.max_uses && voucher.current_uses >= voucher.max_uses) {
      await supabaseClient
        .from("vouchers")
        .update({ status: "exhausted" })
        .eq("id", voucher.id);

      return new Response(
        JSON.stringify({ valid: false, message: "Este código promocional atingiu o limite de usos" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check max uses per user
    if (voucher.max_uses_per_user) {
      const { count } = await supabaseClient
        .from("voucher_uses")
        .select("*", { count: "exact", head: true })
        .eq("voucher_id", voucher.id)
        .eq("user_email", email.toLowerCase());

      if (count && count >= voucher.max_uses_per_user) {
        return new Response(
          JSON.stringify({ valid: false, message: "Você já utilizou este código promocional" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.discount_type === "percentage") {
      discountAmount = (originalAmount * voucher.discount_value) / 100;
    } else {
      discountAmount = voucher.discount_value;
    }

    // Ensure discount doesn't exceed original amount
    discountAmount = Math.min(discountAmount, originalAmount);
    const finalAmount = originalAmount - discountAmount;

    console.log("[VALIDATE-VOUCHER] Discount calculated:", { discountAmount, finalAmount });

    return new Response(
      JSON.stringify({
        valid: true,
        voucher: {
          id: voucher.id,
          code: voucher.code,
          discount_type: voucher.discount_type,
          discount_value: voucher.discount_value,
          applies_to: voucher.applies_to,
        },
        discount_amount: discountAmount,
        final_amount: finalAmount,
        message: `Desconto de ${voucher.discount_type === "percentage" ? voucher.discount_value + "%" : "R$ " + voucher.discount_value.toFixed(2)} aplicado!`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[VALIDATE-VOUCHER] Error:", errorMessage);
    return new Response(
      JSON.stringify({ valid: false, message: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
