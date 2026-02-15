import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AdminNavigation } from "@/components/navigation/AdminNavigation";
import { SeedDataPanel } from "@/components/admin/SeedDataPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import { Users, CheckCircle, Loader2, TrendingUp, Calendar, UserPlus, Bus, Route } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Trip = Tables<"trips">;
type Booking = Tables<"bookings">;

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingTrips: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeTrips: 0,
    pendingOrganizerApps: 0,
    totalBusGroups: 0,
  });
  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/");
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      const [tripsRes, bookingsRes, orgAppsRes, busGroupsRes] = await Promise.all([
        supabase.from("trips").select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("*").eq("status", "confirmed"),
        supabase.from("organizer_applications").select("id").eq("status", "pending"),
        supabase.from("bus_groups").select("id"),
      ]);

      const trips = tripsRes.data || [];
      const bookings = bookingsRes.data || [];
      const pending = trips.filter((t) => t.status === "pending");

      setPendingTrips(pending.slice(0, 5));
      setStats({
        pendingTrips: pending.length,
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum, b) => sum + Number(b.total_amount), 0),
        activeTrips: trips.filter((t) => t.status === "approved" && new Date(t.departure_date) >= new Date()).length,
        pendingOrganizerApps: orgAppsRes.data?.length || 0,
        totalBusGroups: busGroupsRes.data?.length || 0,
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (tripId: string, status: "approved" | "denied") => {
    await supabase.from("trips").update({ status }).eq("id", tripId);
    fetchData();
  };

  if (authLoading || loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <DashboardLayout title="Admin Dashboard" navigation={<AdminNavigation />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-muted-foreground">System overview and management</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatsCard title="Pending Trips" value={stats.pendingTrips} icon={CheckCircle} description="Awaiting review" />
          <StatsCard title="Active Trips" value={stats.activeTrips} icon={Calendar} />
          <StatsCard title="Total Bookings" value={stats.totalBookings} icon={Users} />
          <StatsCard title="Revenue" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} />
          <StatsCard title="Organizer Apps" value={stats.pendingOrganizerApps} icon={UserPlus} description="Pending" />
          <StatsCard title="Bus Groups" value={stats.totalBusGroups} icon={Bus} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Trip Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Pending Trip Approvals
              </CardTitle>
              <CardDescription>Review and approve new trips</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTrips.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No pending trips</p>
                </div>
              ) : (
                <>
                  {pendingTrips.map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">
                          {trip.origin} {" -> "} {trip.destination}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(trip.departure_date), "MMM d, yyyy")} - {formatCurrency(Number(trip.price))}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproval(trip.id, "approved")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleApproval(trip.id, "denied")}>
                          Deny
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => navigate("/admin/approvals")}>
                    View All Pending
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Seed Data Panel - for admin to add test data */}
          {user && <SeedDataPanel userId={user.id} />}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate("/admin/organizer-applications")}>
                <UserPlus className="w-4 h-4 mr-2" />
                Review Organizer Apps ({stats.pendingOrganizerApps})
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/reports")}>
                <TrendingUp className="w-4 h-4 mr-2" />
                View Reports
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/luggage-tags")}>
                Generate Luggage Tags
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/announcements")}>
                Send Announcement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}



