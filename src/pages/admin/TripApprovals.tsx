import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminNavigation } from "@/components/navigation/AdminNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import { CheckCircle, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Trip = Tables<"trips"> & { bus_group?: Tables<"bus_groups"> };

export default function TripApprovals() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => { if (!authLoading && !isAdmin) navigate("/"); }, [authLoading, isAdmin, navigate]);
  useEffect(() => { if (user && isAdmin) fetchTrips(); }, [user, isAdmin]);

  const fetchTrips = async () => {
    const { data } = await supabase.from("trips").select("*, bus_groups(*)").eq("status", "pending").order("created_at");
    setTrips((data || []).map(t => ({ ...t, bus_group: Array.isArray(t.bus_groups) ? t.bus_groups[0] : t.bus_groups })));
    setLoading(false);
  };

  const handleAction = async (id: string, status: "approved" | "denied") => {
    await supabase.from("trips").update({ status }).eq("id", id);
    toast.success(`Trip ${status}`);
    fetchTrips();
  };

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <DashboardLayout title="Trip Approvals" navigation={<AdminNavigation />}>
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold">Trip Approvals</h2><p className="text-muted-foreground">{trips.length} pending</p></div>
        {trips.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">No pending trips</p></CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trips.map(trip => (
              <Card key={trip.id}>
                <CardHeader><CardTitle>{trip.origin} {" -> "} {trip.destination}</CardTitle><p className="text-sm text-muted-foreground">{trip.bus_group?.name} - {trip.campus}</p></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Date:</span> {format(new Date(trip.departure_date), "MMM d, yyyy")}</div>
                    <div><span className="text-muted-foreground">Time:</span> {trip.departure_time}</div>
                    <div><span className="text-muted-foreground">Price:</span> {formatCurrency(Number(trip.price))}</div>
                    <div><span className="text-muted-foreground">Seats:</span> {trip.total_seats}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => handleAction(trip.id, "approved")}>Approve</Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleAction(trip.id, "denied")}>Deny</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}



