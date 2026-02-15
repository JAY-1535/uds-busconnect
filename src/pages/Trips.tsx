import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, Bus, ArrowRight, Loader2, Filter } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { CAMPUS_INFO, CAMPUSES, CampusType, formatCurrency } from '@/lib/constants';
import type { Tables } from '@/integrations/supabase/types';

type Trip = Tables<'trips'> & {
  bus_groups: Tables<'bus_groups'> | null;
};

const Trips = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState<CampusType | 'all'>(
    (searchParams.get('campus') as CampusType) || 'all'
  );

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('trips')
        .select('*, bus_groups(*)')
        .eq('status', 'approved')
        .gte('departure_date', new Date().toISOString().split('T')[0])
        .order('departure_date', { ascending: true });

      if (selectedCampus !== 'all') {
        query = query.eq('campus', selectedCampus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCampus]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Subscribe to realtime trip updates for seat availability
  useEffect(() => {
    const channel = supabase
      .channel('trips-availability')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
        },
        (payload) => {
          console.log('Realtime trip update:', payload);
          // Update the specific trip in state
          if (payload.new) {
            setTrips((currentTrips) =>
              currentTrips.map((trip) =>
                trip.id === payload.new.id
                  ? { ...trip, ...payload.new }
                  : trip
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          // Refetch trips when any booking changes to get updated seat counts
          fetchTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTrips]);

  // fetchTrips is memoized above to keep effects stable.

  const handleCampusChange = (value: string) => {
    setSelectedCampus(value as CampusType | 'all');
    const next = new URLSearchParams(searchParams);
    if (value === 'all') {
      next.delete('campus');
    } else {
      next.set('campus', value);
    }
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary text-white py-12">
          <div className="container">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Available Trips
            </h1>
            <p className="text-white/80">
              Find and book your next TTFPP bus trip
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b bg-card py-4 sticky top-16 z-40">
          <div className="container flex items-center gap-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Select value={selectedCampus} onValueChange={handleCampusChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campuses</SelectItem>
                <SelectItem value={CAMPUSES.NYANKPALA}>Nyankpala Campus</SelectItem>
                <SelectItem value={CAMPUSES.TAMALE}>Tamale Campus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Trip List */}
        <section className="container py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-20">
              <Bus className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">No Trips Available</h2>
              <p className="text-muted-foreground mb-4">
                There are no approved trips for the selected campus at this time.
              </p>
              <Button onClick={() => handleCampusChange('all')} variant="outline">
                View All Campuses
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {trips.map((trip) => (
                <Card key={trip.id} className="bus-card overflow-hidden hover:shadow-elevated transition-all">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      {/* Trip Info */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {CAMPUS_INFO[trip.campus as CampusType]?.shortName || trip.campus}
                            </Badge>
                            <h3 className="font-display text-xl font-bold">
                              {trip.bus_groups?.name || 'Bus Group'}
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(Number(trip.price))}
                            </p>
                            <p className="text-xs text-muted-foreground">per seat</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-lg font-medium mb-4">
                          <MapPin className="w-5 h-5 text-primary" />
                          <span>{trip.origin}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span>{trip.destination}</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(trip.departure_date), 'EEE, MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{trip.departure_time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{trip.available_seats} seats left</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Bus className="w-4 h-4" />
                            <span>{trip.total_seats} total seats</span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex items-center justify-end p-6 bg-muted/30 lg:w-48">
                        {trip.available_seats === 0 ? (
                          <Button
                            disabled
                            className="w-full bg-accent text-accent-foreground"
                          >
                            Sold Out
                          </Button>
                        ) : (
                          <Button
                            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                            onClick={() => navigate(`/book/${trip.id}`)}
                          >
                            Book Now
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Trips;

