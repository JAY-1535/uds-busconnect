import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NavLink } from "@/components/NavLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import {
  LayoutDashboard,
  Bus,
  Route,
  Users,
  Search,
  Download,
  Loader2,
  Phone,
  AlertCircle,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Trip = Tables<"trips">;
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

const statusColors: Record<string, string> = {
  provisional: "bg-warning/10 text-warning border-warning/30",
  confirmed: "bg-green-500/10 text-green-600 border-green-500/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function OrganizerBookings() {
  const { user, isOrganizer, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<(Booking & { trip?: Trip })[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
      // Fetch organizer's bus groups
      const { data: groupsData } = await supabase
        .from("bus_groups")
        .select("id")
        .eq("organizer_id", user.id);

      if (groupsData && groupsData.length > 0) {
        const groupIds = groupsData.map((g) => g.id);

        // Fetch trips
        const { data: tripsData } = await supabase
          .from("trips")
          .select("*")
          .in("bus_group_id", groupIds)
          .order("departure_date", { ascending: false });

        setTrips(tripsData || []);

        if (tripsData && tripsData.length > 0) {
          const tripIds = tripsData.map((t) => t.id);

          // Fetch bookings
          const { data: bookingsData } = await supabase
            .from("bookings")
            .select("*")
            .in("trip_id", tripIds)
            .order("created_at", { ascending: false });

          const bookingsWithTrips = (bookingsData || []).map((booking) => ({
            ...booking,
            trip: tripsData.find((t) => t.id === booking.trip_id),
          }));

          setBookings(bookingsWithTrips);
        }
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.phone.includes(searchQuery);

    const matchesTrip = selectedTrip === "all" || booking.trip_id === selectedTrip;
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesTrip && matchesStatus;
  });

  const exportBookings = () => {
    const csv = [
      ["Name", "Student ID", "Phone", "Seat", "Trip", "Date", "Status", "Amount"].join(","),
      ...filteredBookings.map((b) =>
        [
          b.full_name,
          b.student_id,
          b.phone,
          b.seat_number,
          `${b.trip?.origin} - ${b.trip?.destination}`,
          b.trip?.departure_date,
          b.status,
          b.total_amount,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout title="Bookings" navigation={<OrganizerNavigation />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Bookings</h2>
            <p className="text-muted-foreground">
              View and manage passenger bookings for your trips
            </p>
          </div>
          <Button variant="outline" onClick={exportBookings} disabled={filteredBookings.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, student ID, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedTrip} onValueChange={setSelectedTrip}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by trip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trips</SelectItem>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.origin} {" -> "} {trip.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="provisional">Provisional</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredBookings.length} Booking{filteredBookings.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Passenger</TableHead>
                      <TableHead>Trip</TableHead>
                      <TableHead>Seat</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.full_name}</p>
                            <p className="text-sm text-muted-foreground">{booking.student_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {booking.trip?.origin} {" -> "} {booking.trip?.destination}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.trip?.departure_date && format(new Date(booking.trip.departure_date), "MMM d, yyyy")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Seat {booking.seat_number}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{booking.phone}</span>
                          </div>
                          {booking.emergency_contact && (
                            <div className="flex items-center gap-2 mt-1">
                              <AlertCircle className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{booking.emergency_contact}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{formatCurrency(Number(booking.total_amount))}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[booking.status]}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}



