import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { NavLink } from "@/components/NavLink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrganizerAnnouncements } from "@/components/organizer/OrganizerAnnouncements";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import {
  LayoutDashboard,
  Bus,
  Route,
  Users,
  Calendar,
  Plus,
  ArrowRight,
  TrendingUp,
  Loader2,
  MessageCircle,
  Share2,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Trip = Tables<"trips">;
type BusGroup = Tables<"bus_groups">;
type Booking = Tables<"bookings">;

const OrganizerNavigation = () => (
  <>
    <NavLink to="/organizer" icon={<LayoutDashboard className="h-4 w-4" />}>
      Dashboard
    </NavLink>
    <NavLink to="/organizer/bus-groups" icon={<Bus className="h-4 w-4" />}>
      Bus Groups
    </NavLink>
    <NavLink to="/organizer/trips" icon={<Route className="h-4 w-4" />}>
      My Trips
    </NavLink>
    <NavLink to="/organizer/bookings" icon={<Users className="h-4 w-4" />}>
      Bookings
    </NavLink>
  </>
);

export default function OrganizerDashboard() {
  const { user, isOrganizer, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busGroups, setBusGroups] = useState<BusGroup[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [recentBookings, setRecentBookings] = useState<(Booking & { trip?: Trip })[]>([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (!authLoading && !isOrganizer) {
      navigate("/");
    }
  }, [authLoading, isOrganizer, navigate]);

  useEffect(() => {
    if (user && isOrganizer) {
      fetchData();
    }
  }, [user, isOrganizer, fetchData]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch bus groups
      const { data: groupsData } = await supabase
        .from("bus_groups")
        .select("*")
        .eq("organizer_id", user.id);

      setBusGroups(groupsData || []);

      if (groupsData && groupsData.length > 0) {
        const groupIds = groupsData.map((g) => g.id);

        // Fetch trips for organizer's bus groups
        const { data: tripsData } = await supabase
          .from("trips")
          .select("*")
          .in("bus_group_id", groupIds)
          .order("departure_date", { ascending: false });

        setTrips(tripsData || []);

        // Calculate stats
        const activeTrips = tripsData?.filter(
          (t) => t.status === "approved" && new Date(t.departure_date) >= new Date()
        ).length || 0;

        // Fetch bookings for trips
        if (tripsData && tripsData.length > 0) {
          const tripIds = tripsData.map((t) => t.id);
          const { data: bookingsData } = await supabase
            .from("bookings")
            .select("*")
            .in("trip_id", tripIds)
            .order("created_at", { ascending: false })
            .limit(10);

          // Map bookings with trip info
          const bookingsWithTrips = (bookingsData || []).map((booking) => ({
            ...booking,
            trip: tripsData.find((t) => t.id === booking.trip_id),
          }));

          setRecentBookings(bookingsWithTrips);

          const totalRevenue = bookingsData
            ?.filter((b) => b.status === "confirmed")
            .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

          setStats({
            totalTrips: tripsData?.length || 0,
            activeTrips,
            totalBookings: bookingsData?.length || 0,
            totalRevenue,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching organizer data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const upcomingTrips = trips
    .filter((t) => t.status === "approved" && new Date(t.departure_date) >= new Date())
    .slice(0, 5);

  const pendingTrips = trips.filter((t) => t.status === "pending");

  return (
    <DashboardLayout title="Organizer Dashboard" navigation={<OrganizerNavigation />}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here's what's happening with your bus services.
            </p>
          </div>
          <Button onClick={() => navigate("/organizer/trips")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Trip
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Trips"
            value={stats.totalTrips}
            icon={Route}
            description="All time trips created"
          />
          <StatsCard
            title="Active Trips"
            value={stats.activeTrips}
            icon={Calendar}
            description="Currently approved trips"
          />
          <StatsCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Users}
            description="Passengers booked"
          />
          <StatsCard
            title="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={TrendingUp}
            description="From confirmed bookings"
          />
        </div>

        {/* Quick Actions & Alerts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Approvals */}
          {pendingTrips.length > 0 && (
            <Card className="border-warning/50 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <Calendar className="h-5 w-5" />
                  Pending Approvals
                </CardTitle>
                <CardDescription>
                  {pendingTrips.length} trip(s) awaiting admin approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingTrips.slice(0, 3).map((trip) => (
                    <div
                      key={trip.id}
                      className="flex items-center justify-between rounded-lg border bg-background p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {trip.origin} {" -> "} {trip.destination}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(trip.departure_date), "MMM d, yyyy")} at {trip.departure_time}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bus Groups */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Bus Groups</CardTitle>
                <CardDescription>Manage your bus organizations</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/organizer/bus-groups")}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {busGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bus className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No bus groups yet</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => navigate("/organizer/bus-groups/new")}
                  >
                    Create your first bus group
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {busGroups.slice(0, 3).map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Bus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {group.campus} Campus
                          </p>
                        </div>
                      </div>
                      <Badge variant={group.is_active ? "default" : "secondary"}>
                        {group.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Announcements Section */}
        {user && (
          <OrganizerAnnouncements userId={user.id} trips={trips} />
        )}

        {/* Upcoming Trips & Recent Bookings */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Trips */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Trips</CardTitle>
                <CardDescription>Your next scheduled departures</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/organizer/trips")}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Route className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No upcoming trips</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {trip.origin} {" -> "} {trip.destination}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(trip.departure_date), "MMM d, yyyy")} - {trip.departure_time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatCurrency(Number(trip.price))}</p>
                        <p className="text-xs text-muted-foreground">
                          {trip.available_seats}/{trip.total_seats} seats
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest passenger reservations</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/organizer/bookings")}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{booking.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Seat {booking.seat_number} - {booking.trip?.origin} {" -> "} {booking.trip?.destination}
                        </p>
                      </div>
                      <Badge
                        variant={
                          booking.status === "confirmed"
                            ? "default"
                            : booking.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}





