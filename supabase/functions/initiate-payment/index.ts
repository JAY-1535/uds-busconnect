import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  bookingId: string;
  email: string;
  amount: number;
  paymentMethod?: "card" | "momo";
  momoProvider?: "mtn" | "vod" | "tgo";
  momoPhone?: string;
  metadata?: Record<string, unknown>;
}

const normalizePhone = (value: string): string => {
  const trimmed = value.replace(/\s+/g, "");
  if (trimmed.startsWith("+")) {
    return trimmed.slice(1);
  }
  if (trimmed.startsWith("233")) {
    return trimmed;
  }
  if (trimmed.startsWith("0") && trimmed.length === 10) {
    return `233${trimmed.slice(1)}`;
  }
  return trimmed;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key not configured");
    }

    const { bookingId, email, amount, paymentMethod, momoProvider, momoPhone, metadata }: PaymentRequest = await req.json();
    
    console.log("Initiating payment for booking:", bookingId, "amount:", amount);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Require an authenticated user. Even though this function uses the service role
    // for writes, we must enforce booking ownership to prevent abuse.
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    const authedUser = userData?.user;
    if (userError || !authedUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load booking and enforce ownership. Ignore client-provided amount/email.
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_id, status, total_amount")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (booking.user_id !== authedUser.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (booking.status === "confirmed") {
      return new Response(
        JSON.stringify({
          error: "Booking already confirmed",
          status: "success",
          reference: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get the origin from the request headers for callback URL
    const appUrl = Deno.env.get("APP_URL") || Deno.env.get("PUBLIC_SITE_URL");
    const origin = req.headers.get("origin") || appUrl;
    if (!origin) {
      throw new Error("APP_URL or PUBLIC_SITE_URL must be set for payment callbacks");
    }
    const callbackUrl = `${origin}/payment/${bookingId}`;

    const useMomo = paymentMethod === "momo";
    const normalizedPhone = useMomo && momoPhone ? normalizePhone(momoPhone) : undefined;
    const reference = `BUS-${bookingId.slice(0, 8)}-${Date.now()}`;
    const amountToCharge = Number(booking.total_amount);
    const emailToUse = authedUser.email || email;
    if (!emailToUse) {
      throw new Error("Email is required to initialize payment");
    }

    const channels = useMomo ? ["mobile_money"] : ["card"];
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailToUse,
        amount: Math.round(amountToCharge * 100), // Paystack expects amount in pesewas/kobo
        callback_url: callbackUrl,
        reference,
        currency: "GHS",
        channels,
        metadata: {
          booking_id: bookingId,
          payment_method: useMomo ? "momo" : "card",
          momo_provider: momoProvider,
          momo_phone: normalizedPhone,
          ...metadata,
          custom_fields: [
            {
              display_name: "Booking ID",
              variable_name: "booking_id",
              value: bookingId,
            },
          ],
        },
      }),
    });
    const paystackData = await paystackResponse.json();
    console.log("Paystack initialize response:", paystackData);
    if (!paystackData.status) {
      // Paystack returns "Invalid key" when the merchant secret key is wrong or not live-enabled.
      // Make the next step explicit so we don't keep debugging UI for a config issue.
      const inferredNextStep =
        paystackResponse.status === 401 || paystackData?.message?.toLowerCase?.().includes("invalid key")
          ? "Update PAYSTACK_SECRET_KEY in Supabase Edge Function secrets (use a valid sk_live_... key)."
          : undefined;

      // Persist the failure so we have a trace even when Paystack blocks MoMo via risk/fraud systems.
      try {
        await supabase.from("payments").insert({
          booking_id: bookingId,
          amount: amountToCharge,
          paystack_reference: reference,
          payment_method: "paystack",
          status: "failed",
          error_code: paystackData?.code ?? null,
          error_message: paystackData?.message ?? "Failed to initialize payment",
          gateway_response: paystackData ?? null,
        });
      } catch (e) {
        console.error("Failed to persist payment failure:", e);
      }
      return new Response(
        JSON.stringify({
          error: paystackData.message || "Failed to initialize payment",
          paystack_status: paystackData.status,
          paystack_code: paystackData?.code,
          paystack_type: paystackData?.type,
          paystack_meta: paystackData?.meta || (inferredNextStep ? { nextStep: inferredNextStep } : undefined),
          reference: paystackData?.data?.reference || reference,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const paystackReference = paystackData?.data?.reference || reference;
    const { error: paymentError } = await supabase.from("payments").insert({
      booking_id: bookingId,
      amount: amountToCharge,
      paystack_reference: paystackReference,
      payment_method: "paystack",
      status: "pending",
      gateway_response: paystackData ?? null,
    });

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
    }

    return new Response(
      JSON.stringify({
        status: paystackData?.data?.status,
        display_text: paystackData?.data?.display_text,
        authorization_url: paystackData?.data?.authorization_url || paystackData?.data?.url,
        access_code: paystackData?.data?.access_code,
        reference: paystackReference,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error initiating payment";
    console.error("Error initiating payment:", error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
