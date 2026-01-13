import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[LIST-USERS] No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[LIST-USERS] Invalid token:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.error("[LIST-USERS] User is not admin:", user.email);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[LIST-USERS] Admin verified:", user.email);

    // Fetch all profiles with subscription info from voucher_uses
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("[LIST-USERS] Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // For each profile, get their voucher use info (if any)
    const usersWithSubscription = await Promise.all(
      (profiles || []).map(async (profile) => {
        // Get voucher usage for this user
        const { data: voucherUse } = await supabaseAdmin
          .from("voucher_uses")
          .select("*, vouchers:voucher_id(code, validity_months, discount_type, discount_value)")
          .eq("user_email", profile.email)
          .order("used_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Calculate subscription end date if voucher was used
        let subscriptionEndDate = null;
        if (voucherUse && voucherUse.vouchers) {
          const usedAt = new Date(voucherUse.used_at);
          const validityMonths = voucherUse.vouchers.validity_months || 1;
          subscriptionEndDate = new Date(usedAt);
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + validityMonths);
        }

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          plan_type: voucherUse?.plan_type || profile.plan_type,
          subscription_status: profile.subscription_status,
          app_access_enabled: profile.app_access_enabled,
          voucher_used: voucherUse ? {
            code: voucherUse.vouchers?.code,
            used_at: voucherUse.used_at,
            validity_months: voucherUse.vouchers?.validity_months,
            end_date: subscriptionEndDate?.toISOString(),
          } : null,
        };
      })
    );

    console.log("[LIST-USERS] Returning", usersWithSubscription.length, "users");

    return new Response(
      JSON.stringify({ users: usersWithSubscription }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[LIST-USERS] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});