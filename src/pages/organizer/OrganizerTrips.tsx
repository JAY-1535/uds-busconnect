import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NavLink } from "@/components/NavLink";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency, TRIP_STATUS } from "@/lib/constants";
import { format } from "date-fns";
import {
  LayoutDashboard,
  Bus,
  Route,
  Users,
  Plus,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  Share2,
  Link2,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { ShareTripLink } from "@/components/organizer/ShareTripLink";

type Trip = Tables<"trips">;
type BusGroup = Tables<"bus_groups">;
type BusRecord = Tables<"buses">;

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
  pending: "bg-warning/10 text-warning border-warning/30",
  approved: "bg-green-500/10 text-green-600 border-green-500/30",
  denied: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/30",
};

export default function OrganizerTrips() {
  const { user, isOrganizer, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<(Trip & { bus_group?: BusGroup })[]>([]);
  const [busGroups, setBusGroups] = useState<BusGroup[]>([]);
  const [buses, setBuses] = useState<BusRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const [tripForm, setTripForm] = useState({
    bus_group_id: "",
    bus_id: "",
    origin: "",
    destination: "",
    departure_date: "",
    departure_time: "",
    price: "",
    total_seats: 50,
    person_in_charge: "",
    person_in_charge_contact: "",
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

        // Fetch buses
        const { data: busesData } = await supabase
          .from("buses")
          .select("*")
          .in("bus_group_id", groupIds);

        setBuses(busesData || []);

        // Fetch trips
        const { data: tripsData } = await supabase
          .from("trips")
          .select("*")
          .in("bus_group_id", groupIds)
          .order("departure_date", { ascending: false });

        const tripsWithGroups = (tripsData || []).map((trip) => ({
          ...trip,
          bus_group: groupsData.find((g) => g.id === trip.bus_group_id),
        }));

        setTrips(tripsWithGroups);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleCreateTrip = async () => {
    if (
      !tripForm.bus_group_id ||
      !tripForm.origin ||
      !tripForm.destination ||
      !tripForm.departure_date ||
      !tripForm.departure_time ||
      !tripForm.price ||
      !tripForm.person_in_charge ||
      !tripForm.person_in_charge_contact
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const selectedGroup = busGroups.find((g) => g.id === tripForm.bus_group_id);

      const { error } = await supabase.from("trips").insert({
        bus_group_id: tripForm.bus_group_id,
        bus_id: tripForm.bus_id || null,
        campus: selectedGroup?.campus || "nyankpala",
        origin: tripForm.origin,
        destination: tripForm.destination,
        departure_date: tripForm.departure_date,
        departure_time: tripForm.departure_time,
        price: parseFloat(tripForm.price),
        total_seats: tripForm.total_seats,
        available_seats: tripForm.total_seats,
        person_in_charge: tripForm.person_in_charge,
        person_in_charge_contact: tripForm.person_in_charge_contact,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Trip created! Awaiting admin approval.");
      setDialogOpen(false);
      setTripForm({
        bus_group_id: "",
        bus_id: "",
        origin: "",
        destination: "",
        departure_date: "",
        departure_time: "",
        price: "",
        total_seats: 50,
        person_in_charge: "",
        person_in_charge_contact: "",
      });
      fetchData();
    } catch (error: unknown) {
      console.error("Error creating trip:", error);
      const message = error instanceof Error ? error.message : "Failed to create trip";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") {
      return trip.status === "approved" && new Date(trip.departure_date) >= new Date();
    }
    if (activeTab === "pending") return trip.status === "pending";
    if (activeTab === "completed") return trip.status === "completed";
    return true;
  });

  const selectedGroupBuses = buses.filter((b) => b.bus_group_id === tripForm.bus_group_id);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout title="My Trips" navigation={<OrganizerNavigation />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">My Trips</h2>
            <p className="text-muted-foreground">Create and manage your bus trips</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={busGroups.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Create Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Trip</DialogTitle>
                <DialogDescription>
                  Fill in the details for your new trip. It will be sent for admin approval.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Bus Group *</Label>
                  <Select
                    value={tripForm.bus_group_id}
                    onValueChange={(v) => setTripForm({ ...tripForm, bus_group_id: v, bus_id: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bus group" />
                    </SelectTrigger>
                    <SelectContent>
                      {busGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedGroupBuses.length > 0 && (
                  <div className="space-y-2">
                    <Label>Bus (Optional)</Label>
                    <Select
                      value={tripForm.bus_id}
                      onValueChange={(v) => {
                        const selectedBus = selectedGroupBuses.find((b) => b.id === v);
                        setTripForm({
                          ...tripForm,
                          bus_id: v,
                          total_seats: Math.min(selectedBus?.capacity || 50, 70),
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bus" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedGroupBuses.map((bus) => (
                          <SelectItem key={bus.id} value={bus.id}>
                            {bus.bus_number} ({bus.capacity} seats)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Origin *</Label>
                    <Input
                      placeholder="e.g., Nyankpala"
                      value={tripForm.origin}
                      onChange={(e) => setTripForm({ ...tripForm, origin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Destination *</Label>
                    <Input
                      placeholder="e.g., Accra"
                      value={tripForm.destination}
                      onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Departure Date *</Label>
                    <Input
                      type="date"
                      value={tripForm.departure_date}
                      onChange={(e) => setTripForm({ ...tripForm, departure_date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Departure Time *</Label>
                    <Input
                      type="time"
                      value={tripForm.departure_time}
                      onChange={(e) => setTripForm({ ...tripForm, departure_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Price (GHS) *</Label>
                    <Input
                      type="number"
                      placeholder="150.00"
                      value={tripForm.price}
                      onChange={(e) => setTripForm({ ...tripForm, price: e.target.value })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Seats</Label>
                    <Input
                      type="number"
                      value={tripForm.total_seats}
                      onChange={(e) => setTripForm({ ...tripForm, total_seats: parseInt(e.target.value) || 50 })}
                      min="1"
                      max="70"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Person in Charge *</Label>
                  <Input
                    placeholder="Full name"
                    value={tripForm.person_in_charge}
                    onChange={(e) => setTripForm({ ...tripForm, person_in_charge: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Number *</Label>
                  <Input
                    placeholder="024XXXXXXX"
                    value={tripForm.person_in_charge_contact}
                    onChange={(e) => setTripForm({ ...tripForm, person_in_charge_contact: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreateTrip} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Trip
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {busGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bus className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bus Groups</h3>
              <p className="text-muted-foreground text-center mb-4">
                You need to create a bus group before you can create trips
              </p>
              <Button onClick={() => navigate("/organizer/bus-groups")}>
                Go to Bus Groups
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({trips.length})</TabsTrigger>
                <TabsTrigger value="upcoming">
                  Upcoming ({trips.filter((t) => t.status === "approved" && new Date(t.departure_date) >= new Date()).length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({trips.filter((t) => t.status === "pending").length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({trips.filter((t) => t.status === "completed").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredTrips.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Route className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No trips found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTrips.map((trip) => (
                      <Card key={trip.id} className="relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-semibold text-lg">
                                {trip.origin} {" -> "} {trip.destination}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {trip.bus_group?.name}
                              </p>
                            </div>
                            <Badge variant="outline" className={statusColors[trip.status]}>
                              {trip.status}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(trip.departure_date), "MMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {trip.departure_time}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {trip.available_seats}/{trip.total_seats} seats available
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t flex items-center justify-between">
                            <span className="text-xl font-bold text-primary">
                              {formatCurrency(Number(trip.price))}
                            </span>
                            <div className="flex gap-2">
                              {trip.status === 'approved' && trip.share_link_id && (
                                <ShareTripLink trip={trip} />
                              )}
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}



