import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Printer, Loader2, Tag, Bus } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Trip = Tables<'trips'> & {
  bus_groups: Tables<'bus_groups'> | null;
};

type Booking = Tables<'bookings'>;

const LuggageTags = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const fetchTrips = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, bus_groups(*)')
        .in('status', ['approved', 'completed'])
        .order('departure_date', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookingsWithLuggage = useCallback(async () => {
    if (!selectedTrip) return;
    setLoadingBookings(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('trip_id', selectedTrip)
        .eq('status', 'confirmed')
        .eq('has_luggage', true)
        .not('luggage_id', 'is', null)
        .order('seat_number', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  }, [selectedTrip]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    fetchBookingsWithLuggage();
  }, [fetchBookingsWithLuggage]);

  const printTags = () => {
    const printContent = document.getElementById('luggage-tags-print');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Luggage Tags - ${selectedTripData?.bus_groups?.name}</title>
              <style>
                body { font-family: Arial, sans-serif; }
                .tag-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
                .tag { border: 2px dashed #000; padding: 20px; text-align: center; page-break-inside: avoid; }
                .luggage-id { font-size: 24px; font-weight: bold; font-family: monospace; margin: 10px 0; }
                .passenger { font-size: 14px; margin: 5px 0; }
                .seat { background: #000; color: #fff; padding: 5px 10px; display: inline-block; margin-top: 10px; }
                .route { font-size: 12px; color: #666; margin-top: 10px; }
                @media print { .tag { border: 2px dashed #000 !important; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const selectedTripData = trips.find(t => t.id === selectedTrip);

  if (loading) {
    return (
      <DashboardLayout title="Luggage Tags" navigation={<AdminNavigation />}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Luggage Tags" navigation={<AdminNavigation />}>
      <div className="space-y-6">
        {/* Trip Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Generate Luggage Tags
            </CardTitle>
            <CardDescription>
              Select a trip to view and print luggage tags for passengers with luggage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[300px] space-y-2">
                <Label>Select Trip</Label>
                <Select value={selectedTrip} onValueChange={setSelectedTrip}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a trip..." />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.bus_groups?.name} - {trip.origin} {" -> "} {trip.destination} ({format(new Date(trip.departure_date), 'MMM d')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedTrip && bookings.length > 0 && (
                <Button onClick={printTags}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print All Tags
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trip Info */}
        {selectedTripData && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedTripData.bus_groups?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTripData.origin} {" -> "} {selectedTripData.destination}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {format(new Date(selectedTripData.departure_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedTripData.departure_time}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loadingBookings && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Luggage Tags */}
        {!loadingBookings && selectedTrip && (
          <>
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Luggage Tags</h3>
                  <p className="text-muted-foreground">
                    No confirmed passengers with luggage found for this trip.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {bookings.length} Luggage Tag{bookings.length > 1 ? 's' : ''}
                  </h3>
                </div>

                <div id="luggage-tags-print" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="border-2 border-dashed">
                      <CardContent className="py-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2">
                          {selectedTripData?.bus_groups?.name}
                        </p>
                        <div className="text-3xl font-bold font-mono tracking-wider mb-4 luggage-id">
                          {booking.luggage_id}
                        </div>
                        <div className="space-y-1 mb-4 passenger">
                          <p className="font-medium">{booking.full_name}</p>
                          <p className="text-sm text-muted-foreground">ID: {booking.student_id}</p>
                          <p className="text-sm text-muted-foreground">
                            Bags: {booking.luggage_count || 1}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-lg px-4 py-1 seat">
                          Seat #{booking.seat_number}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-4 route">
                          {selectedTripData?.origin} {" -> "} {selectedTripData?.destination}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {!selectedTrip && (
          <Card>
            <CardContent className="py-12 text-center">
              <Bus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Select a Trip</h3>
              <p className="text-muted-foreground">
                Choose a trip from the dropdown to generate luggage tags.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LuggageTags;



