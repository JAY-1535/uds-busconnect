import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper function to compute HMAC-SHA512
async function computeHmacSha512(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    if (signature) {
      const hash = await computeHmacSha512(PAYSTACK_SECRET_KEY, body);

      if (hash !== signature) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const event = JSON.parse(body);
    console.log("Received Paystack webhook event:", event.event);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event.event === "charge.success") {
      const { reference, metadata } = event.data;
      const bookingId = metadata?.booking_id;

      console.log("Payment successful for reference:", reference, "booking:", bookingId);

      if (bookingId) {
        // Idempotency check: skip if already confirmed
        const { data: existingBooking } = await supabase
          .from("bookings")
          .select("status, trip_id")
          .eq("id", bookingId)
          .maybeSingle();

        if (existingBooking?.status === "confirmed") {
          console.log("Booking already confirmed, skipping webhook processing (idempotent)");
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Update payment status to success
        const { error: paymentError } = await supabase
          .from("payments")
          .update({ status: "success" })
          .eq("paystack_reference", reference);

        if (paymentError) {
          console.error("Error updating payment:", paymentError);
        }

        // Update booking status to confirmed
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
        if (existingBooking?.trip_id) {
          const { error: rpcError } = await supabase.rpc("decrement_available_seats", {
            trip_id_param: existingBooking.trip_id,
          });
          if (rpcError) {
            console.error("Error decrementing seats:", rpcError);
          }
        }

        // Get booking details for notification
        const { data: booking } = await supabase
          .from("bookings")
          .select("*, trips(*, bus_groups(*))")
          .eq("id", bookingId)
          .single();

        if (booking) {
          // Get user email for notification
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("user_id", booking.user_id)
            .maybeSingle();

          // Send notification using supabase.functions.invoke
          try {
            await supabase.functions.invoke("send-notification", {
              body: {
                type: "booking_confirmed",
                booking,
                email: profile?.email,
              },
            });
          } catch (notifError) {
            console.error("Error sending notification:", notifError);
          }
        }

        console.log("Booking confirmed successfully via webhook");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error processing webhook";
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
