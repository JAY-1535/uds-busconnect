import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CreditCard, Loader2, Check, Clock, MapPin, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/constants';
import type { Tables } from '@/integrations/supabase/types';

type Booking = Tables<'bookings'> & {
  trips: (Tables<'trips'> & {
    bus_groups: Tables<'bus_groups'> | null;
  }) | null;
};

const Payment = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'momo'>('card');

  // Check for payment verification from callback
  const reference = searchParams.get('reference');

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, trips(*, bus_groups(*))')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to load booking details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [bookingId, toast]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/auth?redirect=/payment/${bookingId}`);
      return;
    }
    fetchBooking();
  }, [authLoading, user, bookingId, navigate, fetchBooking]);

  const initiatePaystackPayment = async () => {
    if (!booking || !user) return;

    setInitiatingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke('initiate-payment', {
        body: {
          bookingId: booking.id,
          email: user.email,
          amount: booking.total_amount,
          paymentMethod,
          metadata: {
            booking_id: booking.id,
            full_name: booking.full_name,
            student_id: booking.student_id,
            trip_id: booking.trip_id,
          },
        },
      });

      if (error) throw error;

      if (data?.error) {
        const nextStep = data?.paystack_meta?.nextStep;
        const msg = nextStep ? `${data.error}. Next step: ${nextStep}` : data.error;
        throw new Error(msg);
      }

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
        return;
      }
      throw new Error('Failed to get payment URL');
    } catch (error: unknown) {
      console.error('Payment initiation error:', error);
      const message = error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.';
      toast({
        title: 'Payment Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setInitiatingPayment(false);
    }
  };

  const verifyPayment = useCallback(async (paymentReference: string) => {
    setVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
          reference: paymentReference,
          bookingId: booking?.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Payment Successful!',
          description: 'Your booking has been confirmed.',
        });
        navigate(`/booking-confirmation/${booking?.id}`);
      } else {
        const status = data?.status;
        if (status && ['pending', 'ongoing', 'processing', 'queued'].includes(status)) {
          toast({
            title: 'Payment Pending',
            description: 'Complete authorization on your phone, then tap "I have completed payment".',
          });
        } else {
          toast({
            title: 'Payment Verification Failed',
            description: data?.message || 'Unable to verify payment. Please contact support.',
            variant: 'destructive',
          });
        }
      }
    } catch (error: unknown) {
      console.error('Payment verification error:', error);
      const message = error instanceof Error ? error.message : 'Failed to verify payment.';
      toast({
        title: 'Verification Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  }, [booking?.id, navigate, toast]);

  // Verify payment if returning from Paystack
  useEffect(() => {
    if (reference && booking) {
      verifyPayment(reference);
    }
  }, [reference, booking, verifyPayment]);

  // If booking is already confirmed, redirect to confirmation
  useEffect(() => {
    if (booking?.status === 'confirmed') {
      navigate(`/booking-confirmation/${booking.id}`, { replace: true });
    }
  }, [booking?.status, booking?.id, navigate]);

  if (loading || authLoading || verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {verifying ? 'Verifying your payment...' : 'Loading...'}
        </p>
      </div>
    );
  }

  if (!booking || !booking.trips) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-20 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Booking Not Found</h1>
          <Button onClick={() => navigate('/trips')}>Back to Trips</Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (booking.status === 'confirmed') {
    return null;
  }

  const trip = booking.trips;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/my-bookings')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Bookings
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Complete Payment</h1>
            <p className="text-muted-foreground">
              Secure payment powered by Paystack
            </p>
          </div>

          {/* Payment Status Alert */}
          {reference && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Processing your payment verification...
              </AlertDescription>
            </Alert>
          )}

          {/* Booking Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Booking Summary</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Provisional
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{trip.bus_groups?.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {trip.origin} {" -> "} {trip.destination}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {format(new Date(trip.departure_date), 'MMM d, yyyy')} at {trip.departure_time}
                  </p>
                  <p className="text-lg font-bold text-primary">Seat #{booking.seat_number}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passenger</span>
                  <span>{booking.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student ID</span>
                  <span>{booking.student_id}</span>
                </div>
                {booking.luggage_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Luggage ID</span>
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                      {booking.luggage_id}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ticket Price</span>
                  <span>{formatCurrency(Number(trip.price))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Travel Safe Fee</span>
                  <span>{formatCurrency(Number(booking.travel_safe_fee))}</span>
                </div>
                {booking.luggage_tagging_fee && Number(booking.luggage_tagging_fee) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Luggage Tagging</span>
                    <span>{formatCurrency(Number(booking.luggage_tagging_fee))}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount</span>
                  <span className="text-primary">{formatCurrency(Number(booking.total_amount))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Secure Payment
              </CardTitle>
              <CardDescription>
                Pay securely with Mobile Money or Card via Paystack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                    >
                      Card
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'momo' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('momo')}
                    >
                      Mobile Money
                    </Button>
                  </div>
                </div>

                {paymentMethod === 'momo' && (
                  <div className="space-y-2">
                    <Label>Mobile Money</Label>
                    <p className="text-xs text-muted-foreground">
                      You will be redirected to Paystack checkout to enter your MoMo details and approve the payment.
                    </p>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Notice: MTN Mobile Money may be unstable at the moment. If you do not receive a PIN prompt,
                        please use Telecel Cash (Vodafone) on the Paystack page or pay by Card. We are working on it.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    MTN Mobile Money
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Vodafone Cash
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    AirtelTigo Money
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Bank Cards (Visa/Mastercard)
                  </li>
                </ul>
              </div>

              <Button
                onClick={initiatePaystackPayment}
                disabled={initiatingPayment}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                {initiatingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {paymentMethod === 'momo' ? 'Processing Mobile Money...' : 'Redirecting to Paystack...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {paymentMethod === 'momo'
                      ? `Pay ${formatCurrency(Number(booking.total_amount))} (Mobile Money)`
                      : `Pay ${formatCurrency(Number(booking.total_amount))}`}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Your booking will be confirmed immediately after successful payment.
            You will receive an email confirmation.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;




