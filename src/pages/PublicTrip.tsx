import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, Bus, ArrowRight, Loader2, Share2, QrCode } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, CAMPUS_INFO, CampusType } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Trip = Tables<'trips'> & {
  bus_groups: Tables<'bus_groups'> | null;
};

const PublicTrip = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTrip = useCallback(async () => {
    if (!shareId) return;

    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, bus_groups(*)')
        .eq('share_link_id', shareId)
        .eq('status', 'approved')
        .single();

      if (error) throw error;
      setTrip(data);
    } catch (error) {
      console.error('Error fetching trip:', error);
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const handleBookNow = () => {
    if (trip) {
      navigate(`/book/${trip.id}`);
    }
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied!',
      description: 'Share this link with others to book this trip.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-20 text-center">
          <Bus className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">Trip Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This trip may have been cancelled or is no longer available.
          </p>
          <Button onClick={() => navigate('/trips')}>View All Trips</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isSoldOut = trip.available_seats === 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16">
          <div className="container">
            <Badge variant="secondary" className="mb-4">
              {CAMPUS_INFO[trip.campus as CampusType]?.name || trip.campus} Campus
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              {trip.bus_groups?.name || 'Bus Group'}
            </h1>
            <div className="flex items-center gap-3 text-2xl">
              <MapPin className="w-6 h-6" />
              <span>{trip.origin}</span>
              <ArrowRight className="w-5 h-5" />
              <span>{trip.destination}</span>
            </div>
          </div>
        </section>

        {/* Trip Details */}
        <section className="container py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trip Details</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Departure Date</p>
                        <p className="font-semibold">
                          {format(new Date(trip.departure_date), 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Departure Time</p>
                        <p className="font-semibold">{trip.departure_time}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Available Seats</p>
                        <p className="font-semibold">
                          {trip.available_seats} of {trip.total_seats} seats
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bus className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Contact Person</p>
                        <p className="font-semibold">{trip.person_in_charge}</p>
                        <p className="text-sm text-muted-foreground">{trip.person_in_charge_contact}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {trip.bus_groups?.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About {trip.bus_groups.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{trip.bus_groups.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Book This Trip</span>
                    <span className="text-3xl text-primary">{formatCurrency(Number(trip.price))}</span>
                  </CardTitle>
                  <CardDescription>per seat (+ GHS 30 Travel Safe fee)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Seats Available</span>
                      <Badge variant={isSoldOut ? 'destructive' : 'default'}>
                        {isSoldOut ? 'Sold Out' : `${trip.available_seats} left`}
                      </Badge>
                    </div>
                    <div className="w-full bg-background rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ 
                          width: `${((trip.total_seats - trip.available_seats) / trip.total_seats) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleBookNow} 
                    disabled={isSoldOut}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    size="lg"
                  >
                    {isSoldOut ? 'Sold Out' : 'Book Now'}
                    {!isSoldOut && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={copyShareLink}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>QR Code</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center justify-center p-8">
                          <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                            <p className="text-sm text-muted-foreground text-center p-4">
                              QR Code for: {window.location.href}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-center text-muted-foreground">
                          Scan to book this trip
                        </p>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PublicTrip;



