import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "booking_confirmed" | "trip_approved" | "trip_denied" | "payment_received";
  booking?: Record<string, unknown>;
  trip?: Record<string, unknown>;
  email?: string;
}

const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const asNumber = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined);
const asRecord = (v: unknown): Record<string, unknown> | undefined =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log("Resend API key not configured, skipping email");
      return new Response(
        JSON.stringify({ message: "Email skipped - no API key" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { type, booking, trip, email }: NotificationRequest = await req.json();

    console.log("Sending notification of type:", type);

    let emailContent = {
      to: "",
      subject: "",
      html: "",
    };

    if (type === "booking_confirmed" && booking) {
      const bookingObj = booking;
      const tripData = asRecord((bookingObj as Record<string, unknown>)["trips"]);
      const busGroup = asRecord(tripData?.["bus_groups"]);
      const fullName = asString((bookingObj as Record<string, unknown>)["full_name"]) || "";
      const seatNumber = asNumber((bookingObj as Record<string, unknown>)["seat_number"]);
      const luggageId = asString((bookingObj as Record<string, unknown>)["luggage_id"]);
      const totalAmount = (bookingObj as Record<string, unknown>)["total_amount"];
      const bookingEmail = asString((bookingObj as Record<string, unknown>)["email"]);
      
      emailContent = {
        to: email || bookingEmail || "customer@example.com",
        subject: `Booking Confirmed - ${asString(busGroup?.["name"]) || "UDS BusConnect"}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1a5f2a, #2d8b3f); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .ticket-box { background: white; border: 2px dashed #1a5f2a; padding: 20px; margin: 20px 0; border-radius: 10px; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .highlight { color: #1a5f2a; font-weight: bold; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Booking Confirmed!</h1>
                <p>Your trip has been successfully booked</p>
              </div>
              <div class="content">
                <p>Dear <strong>${fullName}</strong>,</p>
                <p>Your booking with <strong>${asString(busGroup?.["name"]) || "UDS BusConnect"}</strong> has been confirmed!</p>
                
                <div class="ticket-box">
                  <h3 style="color: #1a5f2a; margin-top: 0;">Your Ticket Details</h3>
                  <div class="detail-row">
                    <span>Route:</span>
                    <span class="highlight">${asString(tripData?.["origin"]) || ""} -> ${asString(tripData?.["destination"]) || ""}</span>
                  </div>
                  <div class="detail-row">
                    <span>Date:</span>
                    <span>${asString(tripData?.["departure_date"]) || ""}</span>
                  </div>
                  <div class="detail-row">
                    <span>Time:</span>
                    <span>${asString(tripData?.["departure_time"]) || ""}</span>
                  </div>
                  <div class="detail-row">
                    <span>Seat Number:</span>
                    <span class="highlight" style="font-size: 1.2em;">Seat #${seatNumber ?? ""}</span>
                  </div>
                  ${luggageId ? `
                  <div class="detail-row">
                    <span>Luggage ID:</span>
                    <span style="font-family: monospace; background: #eee; padding: 2px 8px; border-radius: 4px;">${luggageId}</span>
                  </div>
                  ` : ""}
                  <div class="detail-row">
                    <span>Total Paid:</span>
                    <span class="highlight" style="font-size: 1.2em;">GHS ${String(totalAmount ?? "")}</span>
                  </div>
                </div>

                <h4>Contact Person</h4>
                <p><strong>${asString(tripData?.["person_in_charge"]) || ""}</strong><br/>
                Phone: ${asString(tripData?.["person_in_charge_contact"]) || ""}</p>

                ${asString(busGroup?.["whatsapp_group_link"]) ? `
                <p style="text-align: center; margin: 20px 0;">
                  <a href="${asString(busGroup?.["whatsapp_group_link"]) || ""}" style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; display: inline-block;">
                    Join WhatsApp Group
                  </a>
                </p>
                ` : ""}

                <p style="color: #666; font-size: 14px;">
                  Please arrive at the departure point at least 30 minutes before departure time.
                  Show this email or your booking confirmation to the driver.
                </p>
              </div>
              <div class="footer">
                <p>UDS BusConnect - Powered by AnyCo Technologies</p>
                <p>Safe travels!</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
    } else if (type === "trip_approved" && trip) {
      const tripAny = trip;
      emailContent = {
        to: email || "organizer@example.com",
        subject: `Trip Approved - ${asString(tripAny["origin"]) || ""} to ${asString(tripAny["destination"]) || ""}`,
        html: `
          <h2>Your trip has been approved!</h2>
          <p>Your trip from <strong>${asString(tripAny["origin"]) || ""}</strong> to <strong>${asString(tripAny["destination"]) || ""}</strong> on ${asString(tripAny["departure_date"]) || ""} has been approved.</p>
          <p>Students can now book seats for this trip.</p>
        `,
      };
    } else if (type === "trip_denied" && trip) {
      const tripAny = trip;
      emailContent = {
        to: email || "organizer@example.com",
        subject: `Trip Not Approved - ${asString(tripAny["origin"]) || ""} to ${asString(tripAny["destination"]) || ""}`,
        html: `
          <h2>Trip Not Approved</h2>
          <p>Unfortunately, your trip from <strong>${asString(tripAny["origin"]) || ""}</strong> to <strong>${asString(tripAny["destination"]) || ""}</strong> on ${asString(tripAny["departure_date"]) || ""} was not approved.</p>
          <p>Please contact the admin for more information.</p>
        `,
      };
    }

    if (emailContent.to && emailContent.subject) {
      // Use fetch to call Resend API directly
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "UDS BusConnect <onboarding@resend.dev>",
          to: [emailContent.to],
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });

      const emailData = await emailResponse.json();
      console.log("Email sent successfully:", emailData);

      return new Response(JSON.stringify(emailData), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ message: "No email to send" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error sending notification";
    console.error("Error sending notification:", error);
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



