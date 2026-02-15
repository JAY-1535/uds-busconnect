import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NavLink } from "@/components/NavLink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CAMPUSES, CAMPUS_INFO } from "@/lib/constants";
import { LayoutDashboard, Bus, Route, Users, Plus, Edit, Loader2, MessageCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

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

export default function BusGroups() {
  const { user, isOrganizer, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busGroups, setBusGroups] = useState<BusGroup[]>([]);
  const [buses, setBuses] = useState<Record<string, BusRecord[]>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busDialogOpen, setBusDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<BusGroup | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [groupForm, setGroupForm] = useState({
    name: "",
    campus: "" as "nyankpala" | "tamale" | "",
    description: "",
    whatsapp_group_link: "",
  });

  const [busForm, setBusForm] = useState({
    bus_number: "",
    capacity: 50,
    bus_group_id: "",
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
      const { data: groupsData } = await supabase
        .from("bus_groups")
        .select("*")
        .eq("organizer_id", user.id)
        .order("created_at", { ascending: false });

      setBusGroups(groupsData || []);

      // Fetch buses for each group
      if (groupsData && groupsData.length > 0) {
        const groupIds = groupsData.map((g) => g.id);
        const { data: busesData } = await supabase
          .from("buses")
          .select("*")
          .in("bus_group_id", groupIds);

        // Group buses by bus_group_id
        const busesMap: Record<string, BusRecord[]> = {};
        (busesData || []).forEach((bus) => {
          if (!busesMap[bus.bus_group_id]) {
            busesMap[bus.bus_group_id] = [];
          }
          busesMap[bus.bus_group_id].push(bus);
        });
        setBuses(busesMap);
      }
    } catch (error) {
      console.error("Error fetching bus groups:", error);
      toast.error("Failed to load bus groups");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleCreateGroup = async () => {
    if (!groupForm.name || !groupForm.campus) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!user) {
      toast.error("You must be signed in to create a bus group");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("bus_groups").insert({
        name: groupForm.name,
        campus: groupForm.campus,
        description: groupForm.description || null,
        whatsapp_group_link: groupForm.whatsapp_group_link || null,
        organizer_id: user.id,
      });

      if (error) throw error;

      toast.success("Bus group created successfully!");
      setDialogOpen(false);
      setGroupForm({ name: "", campus: "", description: "", whatsapp_group_link: "" });
      fetchData();
    } catch (error: unknown) {
      console.error("Error creating bus group:", error);
      const message = error instanceof Error ? error.message : "Failed to create bus group";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBus = async () => {
    if (!busForm.bus_number || !busForm.bus_group_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const capacity = Math.min(Math.max(busForm.capacity || 1, 1), 70);
      const { error } = await supabase.from("buses").insert({
        bus_number: busForm.bus_number,
        capacity,
        bus_group_id: busForm.bus_group_id,
      });

      if (error) throw error;

      toast.success("Bus added successfully!");
      setBusDialogOpen(false);
      setBusForm({ bus_number: "", capacity: 50, bus_group_id: "" });
      fetchData();
    } catch (error: unknown) {
      console.error("Error adding bus:", error);
      const message = error instanceof Error ? error.message : "Failed to add bus";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout title="Bus Groups" navigation={<OrganizerNavigation />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Bus Groups</h2>
            <p className="text-muted-foreground">
              Manage your bus organizations and vehicles
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={busDialogOpen} onOpenChange={setBusDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={busGroups.length === 0}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Bus
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Bus</DialogTitle>
                  <DialogDescription>
                    Add a new bus to one of your groups
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bus_group">Bus Group *</Label>
                    <Select
                      value={busForm.bus_group_id}
                      onValueChange={(v) => setBusForm({ ...busForm, bus_group_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bus group" />
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
                  <div className="space-y-2">
                    <Label htmlFor="bus_number">Bus Number/Name *</Label>
                    <Input
                      id="bus_number"
                      placeholder="e.g., Bus A, GR-1234-21"
                      value={busForm.bus_number}
                      onChange={(e) => setBusForm({ ...busForm, bus_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Seat Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min={1}
                      max={70}
                      value={busForm.capacity}
                      onChange={(e) => {
                        const n = parseInt(e.target.value);
                        setBusForm({ ...busForm, capacity: Number.isFinite(n) ? Math.min(Math.max(n, 1), 70) : 50 });
                      }}
                    />
                  </div>
                  <Button onClick={handleAddBus} disabled={submitting} className="w-full">
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add Bus
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Bus Group</DialogTitle>
                  <DialogDescription>
                    Set up a new bus organization for your campus
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Group Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Express Travels"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campus">Campus *</Label>
                    <Select
                      value={groupForm.campus}
                      onValueChange={(v: "nyankpala" | "tamale") => setGroupForm({ ...groupForm, campus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select campus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CAMPUSES.NYANKPALA}>
                          {CAMPUS_INFO[CAMPUSES.NYANKPALA].name}
                        </SelectItem>
                        <SelectItem value={CAMPUSES.TAMALE}>
                          {CAMPUS_INFO[CAMPUSES.TAMALE].name}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of your bus service"
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp Group Link</Label>
                    <Input
                      id="whatsapp"
                      placeholder="https://chat.whatsapp.com/..."
                      value={groupForm.whatsapp_group_link}
                      onChange={(e) => setGroupForm({ ...groupForm, whatsapp_group_link: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateGroup} disabled={submitting} className="w-full">
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bus Groups List */}
        {busGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bus className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bus Groups Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first bus group to start organizing trips
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {busGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Bus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{group.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {group.campus} Campus
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={group.is_active ? "default" : "secondary"}>
                      {group.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.description && (
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  )}

                  {/* Buses */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Buses ({(buses[group.id] || []).length})</h4>
                    {(buses[group.id] || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No buses added yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(buses[group.id] || []).map((bus) => (
                          <Badge key={bus.id} variant="outline">
                            {bus.bus_number} - {bus.capacity} seats
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {group.whatsapp_group_link && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={group.whatsapp_group_link} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBusForm({ ...busForm, bus_group_id: group.id });
                        setBusDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Bus
                    </Button>
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



