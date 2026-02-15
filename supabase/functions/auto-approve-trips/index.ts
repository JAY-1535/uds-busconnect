import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutoApproveRequest {
  trip_id?: string;
  action?: 'approve_all_pending' | 'check_and_approve';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { trip_id, action }: AutoApproveRequest = await req.json();

    console.log("Auto-approve request:", { trip_id, action });

    // Auto-approval logic
    // A trip is automatically approved if:
    // 1. The organizer has at least 3 successfully completed trips
    // 2. The trip details are valid (future date, reasonable price, etc.)

    if (trip_id) {
      // Check specific trip for auto-approval
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('*, bus_groups(*)')
        .eq('id', trip_id)
        .single();

      if (tripError || !trip) {
        throw new Error('Trip not found');
      }

      const organizerId = trip.bus_groups?.organizer_id;

      if (!organizerId) {
        return new Response(
          JSON.stringify({ auto_approved: false, reason: 'No organizer found' }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check organizer's history
      const { data: busGroups } = await supabase
        .from('bus_groups')
        .select('id')
        .eq('organizer_id', organizerId);

      const groupIds = busGroups?.map(g => g.id) || [];

      const { count: completedTrips } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .in('bus_group_id', groupIds)
        .eq('status', 'completed');

      const { count: confirmedBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('trip_id', groupIds.length > 0 ? 
          (await supabase.from('trips').select('id').in('bus_group_id', groupIds)).data?.map(t => t.id) || [] 
          : [])
        .eq('status', 'confirmed');

      // Auto-approve criteria
      const hasEnoughHistory = (completedTrips || 0) >= 3;
      const isFutureTrip = new Date(trip.departure_date) > new Date();
      const hasReasonablePrice = Number(trip.price) > 0 && Number(trip.price) <= 500;
      const hasValidSeats = trip.total_seats > 0 && trip.total_seats <= 100;

      const shouldAutoApprove = hasEnoughHistory && isFutureTrip && hasReasonablePrice && hasValidSeats;

      if (shouldAutoApprove) {
        const { error: updateError } = await supabase
          .from('trips')
          .update({ status: 'approved' })
          .eq('id', trip_id);

        if (updateError) throw updateError;

        console.log(`Trip ${trip_id} auto-approved`);

        // Send notification to organizer
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'trip_approved',
            trip: trip,
          }
        });

        return new Response(
          JSON.stringify({ 
            auto_approved: true, 
            reason: 'Organizer meets auto-approval criteria' 
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ 
          auto_approved: false, 
          reason: 'Trip requires manual review',
          details: {
            hasEnoughHistory,
            isFutureTrip,
            hasReasonablePrice,
            hasValidSeats,
            completedTrips: completedTrips || 0,
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === 'approve_all_pending') {
      // Batch approve all eligible pending trips
      const { data: pendingTrips } = await supabase
        .from('trips')
        .select('id')
        .eq('status', 'pending');

      const results = [];
      for (const trip of pendingTrips || []) {
        const { data } = await supabase.functions.invoke('auto-approve-trips', {
          body: { trip_id: trip.id }
        });
        results.push({ trip_id: trip.id, ...data });
      }

      return new Response(
        JSON.stringify({ results }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'No action specified' }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error in auto-approve";
    console.error("Error in auto-approve:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
