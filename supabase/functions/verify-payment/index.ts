import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyRequest {
  reference: string;
  bookingId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key not configured");
    }

    const { reference, bookingId: providedBookingId }: VerifyRequest = await req.json();
    console.log("Verifying payment reference:", reference);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Require an authenticated user to prevent confirming arbitrary bookings.
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized", success: false }), {
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
      return new Response(JSON.stringify({ error: "Unauthorized", success: false }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackResponse.json();
    console.log("Paystack verification response status:", paystackData.status);

    if (!paystackData.status) {
      throw new Error(paystackData.message || "Payment verification failed");
    }

    const { status, metadata, amount } = paystackData.data;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Derive booking id securely: require a payment record created by our initiate-payment.
    let bookingId: string | undefined = metadata?.booking_id;
    if (!bookingId) {
      const { data: paymentRow } = await supabase
        .from("payments")
        .select("booking_id")
        .eq("paystack_reference", reference)
        .maybeSingle();
      bookingId = paymentRow?.booking_id || providedBookingId;
    }
    if (!bookingId) {
      return new Response(JSON.stringify({ error: "Missing booking id", success: false }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Enforce that the booking exists and is owned by the requester (or requester is admin).
    const { data: bookingRow, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_id, status, trip_id")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !bookingRow) {
      return new Response(JSON.stringify({ error: "Booking not found", success: false }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (bookingRow.user_id !== authedUser.id) {
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authedUser.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!adminRole) {
        return new Response(JSON.stringify({ error: "Forbidden", success: false }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    if (status === "success" && bookingId) {
      // Idempotency check: If booking is already confirmed, return success without re-processing
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("status, trip_id, user_id")
        .eq("id", bookingId)
        .maybeSingle();

      if (existingBooking?.status === "confirmed") {
        console.log("Booking already confirmed, returning success (idempotent)");
        return new Response(
          JSON.stringify({
            success: true,
            status: "success",
            bookingId,
            amount: amount / 100,
            message: "Booking already confirmed",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Update payment status
      const { error: paymentError } = await supabase
        .from("payments")
        .update({ status: "success" })
        .eq("paystack_reference", reference)
        .eq("booking_id", bookingId);

      if (paymentError) {
        console.error("Error updating payment:", paymentError);
      }

      // Get booking details before update
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*, trips(*, bus_groups(*))")
        .eq("id", bookingId)
        .single();

      // Update booking status
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          payment_reference: reference,
        })
        .eq("id", bookingId);

      if (bookingError) {
        console.error("Error updating booking:", bookingError);
      }

      // Decrement available seats using atomic RPC
      if (bookingData?.trip_id) {
        const { error: rpcError } = await supabase.rpc("decrement_available_seats", {
          trip_id_param: bookingData.trip_id,
        });
        if (rpcError) {
          console.error("Error decrementing seats:", rpcError);
        }
      }

      console.log("Payment verified and booking confirmed for:", bookingId);

      // Send confirmation email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", bookingData?.user_id)
        .maybeSingle();

      if (profile?.email || bookingData) {
        try {
          await supabase.functions.invoke("send-notification", {
            body: {
              type: "booking_confirmed",
              booking: { ...bookingData, trips: bookingData?.trips },
              email: profile?.email,
            },
          });
        } catch (err) {
          console.error("Email notification failed:", err);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: paystackData.data.status,
          bookingId,
          amount: amount / 100,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        status: paystackData.data.status,
        bookingId,
        amount: amount / 100,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error verifying payment";
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: message, success: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
