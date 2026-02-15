import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Ticket, Loader2, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/constants';
import type { Tables } from '@/integrations/supabase/types';

type Booking = Tables<'bookings'> & {
  trips: (Tables<'trips'> & {
    bus_groups: Tables<'bus_groups'> | null;
  }) | null;
};

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, trips(*, bus_groups(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={`status-${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const upcomingBookings = bookings.filter(
    (b) => b.trips && new Date(b.trips.departure_date) >= new Date() && b.status !== 'cancelled'
  );

  const pastBookings = bookings.filter(
    (b) => b.trips && (new Date(b.trips.departure_date) < new Date() || b.status === 'cancelled')
  );

  const BookingCard = ({ booking }: { booking: Booking }) => {
    if (!booking.trips) return null;
    const trip = booking.trips;

    return (
      <Card className="bus-card overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {trip.bus_groups?.name}
                  </p>
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <MapPin className="w-4 h-4 text-primary" />
                    {trip.origin} {" -> "} {trip.destination}
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(trip.departure_date), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {trip.departure_time}
                </div>
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-primary" />
                  <span className="font-bold">Seat #{booking.seat_number}</span>
                </div>
                <div className="text-right md:text-left">
                  <span className="font-bold text-primary">
                    {formatCurrency(Number(booking.total_amount))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end p-6 bg-muted/30 md:w-40">
              <Button
                variant="ghost"
                asChild
                className="gap-2"
              >
                <Link to={`/booking-confirmation/${booking.id}`}>
                  View
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="bg-primary text-white py-12">
          <div className="container">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              My Bookings
            </h1>
            <p className="text-white/80">
              View and manage your trip bookings
            </p>
          </div>
        </section>

        <section className="container py-8">
          {bookings.length === 0 ? (
            <div className="text-center py-20">
              <Ticket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">No Bookings Yet</h2>
              <p className="text-muted-foreground mb-4">
                You haven't made any bookings yet. Find a trip and book your seat!
              </p>
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/trips">Find Trips</Link>
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="upcoming" className="space-y-6">
              <TabsList>
                <TabsTrigger value="upcoming">
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past ({pastBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No upcoming bookings</p>
                    <Button asChild variant="link">
                      <Link to="/trips">Find a trip</Link>
                    </Button>
                  </div>
                ) : (
                  upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {pastBookings.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No past bookings</p>
                  </div>
                ) : (
                  pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MyBookings;



