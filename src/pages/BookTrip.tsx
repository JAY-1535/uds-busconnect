import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, Users, Shield, Tag, Loader2, Check } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TRAVEL_SAFE_FEE, LUGGAGE_TAGGING_FEE, MAX_FREE_BAGS, formatCurrency } from '@/lib/constants';
import { SeatSelector } from '@/components/booking/SeatSelector';
import type { Tables } from '@/integrations/supabase/types';

type Trip = Tables<'trips'> & {
  bus_groups: Tables<'bus_groups'> | null;
};

const BookTrip = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [studentId, setStudentId] = useState(profile?.student_id || '');
  const [studentClass, setStudentClass] = useState(profile?.student_class || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [emergencyContact, setEmergencyContact] = useState(profile?.emergency_contact || '');
  const [hasLuggage, setHasLuggage] = useState(false);
  const [luggageCount, setLuggageCount] = useState(0);

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return;
    
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to book a trip.',
        variant: 'destructive',
      });
      navigate(`/auth?redirect=/book/${tripId}`);
      return;
    }
    fetchTripDetails();
  }, [authLoading, user, tripId, toast, navigate, fetchTripDetails]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setStudentId(profile.student_id || '');
      setStudentClass(profile.student_class || '');
      setPhone(profile.phone || '');
      setEmergencyContact(profile.emergency_contact || '');
    }
  }, [profile]);

  // Subscribe to realtime seat updates
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`bookings-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log('Realtime booking update:', payload);
          // Refetch booked seats when any booking changes
          fetchBookedSeats();
          
          // If user's selected seat was just booked by someone else, notify them
          if (payload.eventType === 'INSERT' && payload.new) {
            const newBooking = payload.new as { seat_number: number; user_id: string };
            if (newBooking.seat_number === selectedSeat && newBooking.user_id !== user?.id) {
              setSelectedSeat(null);
              toast({
                title: 'Seat Taken',
                description: `Seat ${newBooking.seat_number} was just booked by another passenger. Please select a different seat.`,
                variant: 'destructive',
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, selectedSeat, user?.id, toast, fetchBookedSeats]);

  const fetchBookedSeats = useCallback(async () => {
    if (!tripId) return;
    
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('seat_number')
      .eq('trip_id', tripId)
      .neq('status', 'cancelled');

    if (!bookingsError) {
      setBookedSeats(bookingsData?.map((b) => b.seat_number) || []);
    }
  }, [tripId]);

  const fetchTripDetails = useCallback(async () => {
    if (!tripId) return;

    try {
      // Fetch trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*, bus_groups(*)')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // Fetch booked seats
      await fetchBookedSeats();
    } catch (error) {
      console.error('Error fetching trip:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trip details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tripId, toast, fetchBookedSeats]);

  const calculateTotal = () => {
    if (!trip) return 0;
    const ticketPrice = Number(trip.price);
    const luggageFee = hasLuggage && luggageCount > MAX_FREE_BAGS ? LUGGAGE_TAGGING_FEE : 0;
    return ticketPrice + TRAVEL_SAFE_FEE + luggageFee;
  };

  const handleSubmitBooking = async () => {
    if (!trip || !user || !selectedSeat) return;

    // Validation
    if (!fullName || !studentId || !studentClass || !phone || !emergencyContact) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const totalAmount = calculateTotal();
      const luggageFee = hasLuggage && luggageCount > MAX_FREE_BAGS ? LUGGAGE_TAGGING_FEE : 0;

      // Generate luggage ID if applicable
      let luggageId = null;
      if (hasLuggage && trip.bus_groups) {
        const orgName = trip.bus_groups.name;
        const lastThree = orgName.slice(-3).toUpperCase();
        luggageId = `${lastThree}${selectedSeat}${studentId}`;
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          trip_id: trip.id,
          user_id: user.id,
          seat_number: selectedSeat,
          full_name: fullName,
          student_id: studentId,
          student_class: studentClass,
          phone: phone,
          emergency_contact: emergencyContact,
          has_luggage: hasLuggage,
          luggage_count: luggageCount,
          luggage_id: luggageId,
          luggage_tagging_fee: luggageFee,
          travel_safe_fee: TRAVEL_SAFE_FEE,
          total_amount: totalAmount,
          status: 'provisional',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update profile with student details
      await supabase
        .from('profiles')
        .update({
          student_id: studentId,
          student_class: studentClass,
          phone: phone,
          emergency_contact: emergencyContact,
        })
        .eq('user_id', user.id);

      toast({
        title: 'Booking Created!',
        description: 'Your provisional booking has been created. Please complete payment.',
      });

      navigate(`/payment/${booking.id}`);
    } catch (error: unknown) {
      console.error('Booking error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create booking. Please try again.';
      toast({
        title: 'Booking Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
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
          <h1 className="font-display text-2xl font-bold mb-4">Trip Not Found</h1>
          <Button onClick={() => navigate('/trips')}>Back to Trips</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/trips')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trips
        </Button>

        {/* Trip Summary */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <Badge variant="outline" className="mb-2">
                  {trip.bus_groups?.name}
                </Badge>
                <div className="flex items-center gap-2 text-xl font-bold">
                  <MapPin className="w-5 h-5 text-primary" />
                  {trip.origin} {" -> "} {trip.destination}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(trip.departure_date), 'EEE, MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {trip.departure_time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {trip.available_seats} seats left
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(Number(trip.price))}
                </p>
                <p className="text-xs text-muted-foreground">+ GHS30 Travel Safe</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 md:w-24 h-1 mx-2 ${
                    step > s ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Your Seat</CardTitle>
                </CardHeader>
                <CardContent>
                  <SeatSelector
                    totalSeats={trip.total_seats}
                    bookedSeats={bookedSeats}
                    selectedSeat={selectedSeat}
                    onSelectSeat={setSelectedSeat}
                  />
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!selectedSeat}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID *</Label>
                      <Input
                        id="studentId"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g., UDS/EDU/0001/22"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentClass">Class/Level *</Label>
                      <Input
                        id="studentClass"
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        placeholder="e.g., Level 300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+233 XX XXX XXXX"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                      <Input
                        id="emergencyContact"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Name - Phone Number"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="hasLuggage" className="text-base font-medium">
                        Do you have luggage?
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        First 3 bags are free, additional bags incur a GHS5 tagging fee
                      </p>
                    </div>
                    <Switch
                      id="hasLuggage"
                      checked={hasLuggage}
                      onCheckedChange={setHasLuggage}
                    />
                  </div>

                  {hasLuggage && (
                    <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                      <Label htmlFor="luggageCount">Number of Bags</Label>
                      <Input
                        id="luggageCount"
                        type="number"
                        min="1"
                        max="10"
                        value={luggageCount}
                        onChange={(e) => setLuggageCount(parseInt(e.target.value) || 0)}
                      />
                      {luggageCount > MAX_FREE_BAGS && (
                        <p className="text-sm text-warning">
                          WARNING: {luggageCount - MAX_FREE_BAGS} extra bag(s) will incur a GHS{LUGGAGE_TAGGING_FEE} tagging fee.
                          <br />
                          <span className="text-muted-foreground">
                            Note: Organizers may charge additional fees for luggage.
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Review Booking
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review & Confirm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Passenger Details</h4>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Name:</dt>
                          <dd>{fullName}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Student ID:</dt>
                          <dd>{studentId}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Class:</dt>
                          <dd>{studentClass}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Phone:</dt>
                          <dd>{phone}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Emergency:</dt>
                          <dd className="text-right max-w-[200px] truncate">{emergencyContact}</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Booking Details</h4>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Seat Number:</dt>
                          <dd className="font-bold text-primary">#{selectedSeat}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Luggage:</dt>
                          <dd>{hasLuggage ? `${luggageCount} bag(s)` : 'None'}</dd>
                        </div>
                        {hasLuggage && trip.bus_groups && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Luggage ID:</dt>
                            <dd className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              {trip.bus_groups.name.slice(-3).toUpperCase()}{selectedSeat}{studentId}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>

                  <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-sm text-warning-foreground">
                      WARNING: <strong>Important:</strong> Payment must be completed by{' '}
                      <strong>
                        {format(new Date(new Date(trip.departure_date).getTime() - 86400000), 'MMMM d, yyyy')}
                      </strong>{' '}
                      or your booking will be automatically cancelled.
                    </p>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmitBooking}
                      disabled={submitting}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Confirm & Pay
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Ticket Price</span>
                    <span>{formatCurrency(Number(trip.price))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-primary" />
                      Travel Safe Fee
                    </span>
                    <span>{formatCurrency(TRAVEL_SAFE_FEE)}</span>
                  </div>
                  {hasLuggage && luggageCount > MAX_FREE_BAGS && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-primary" />
                        Luggage Tagging
                      </span>
                      <span>{formatCurrency(LUGGAGE_TAGGING_FEE)}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                </div>

                {selectedSeat && (
                  <div className="p-3 bg-primary/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Selected Seat</p>
                    <p className="text-3xl font-bold text-primary">#{selectedSeat}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookTrip;





