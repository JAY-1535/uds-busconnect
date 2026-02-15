import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Booking = Tables<'bookings'> & {
  trips: (Tables<'trips'> & {
    bus_groups: Tables<'bus_groups'> | null;
  }) | null;
};

const SubmitDamageClaim = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    booking_id: '',
    description: '',
    amount_claimed: '',
  });

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, trips(*, bus_groups(*))')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Avoid crashes from `format()` on missing trip/date.
      setBookings((data || []).filter((b) => Boolean(b.trips)));
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/submit-claim');
      return;
    }
    fetchBookings();
  }, [authLoading, user, navigate, fetchBookings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (!form.booking_id || !form.description) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('damage_claims').insert({
        booking_id: form.booking_id,
        user_id: user.id,
        description: form.description,
        amount_claimed: form.amount_claimed ? parseFloat(form.amount_claimed) : null,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Claim Submitted!',
        description: 'Your damage claim has been submitted for review.',
      });

      navigate('/my-bookings');
    } catch (error: unknown) {
      console.error('Error submitting claim:', error);
      const message = error instanceof Error ? error.message : 'Failed to submit claim.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Submit Damage Claim</h1>
            <p className="text-muted-foreground">
              Report luggage damage to receive compensation through Travel Safe
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Claim Details</CardTitle>
              <CardDescription>
                Please provide details about the damage to your luggage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="booking">Select Booking *</Label>
                  <Select
                    value={form.booking_id}
                    onValueChange={(v) => setForm({ ...form, booking_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose the trip this claim is for" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookings.length === 0 ? (
                        <SelectItem value="none" disabled>No confirmed bookings found</SelectItem>
                  ) : (
                        bookings.map((booking) => (
                          <SelectItem key={booking.id} value={booking.id}>
                            {booking.trips?.origin} {" -> "} {booking.trips?.destination} ({booking.trips?.departure_date ? format(new Date(booking.trips.departure_date), 'MMM d, yyyy') : 'Unknown date'})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {bookings.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      You need at least one confirmed booking to submit a damage claim.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Describe the Damage *</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe what happened and the extent of the damage..."
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Estimated Damage Value (GHS)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount_claimed}
                    onChange={(e) => setForm({ ...form, amount_claimed: e.target.value })}
                    placeholder="e.g., 150.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    This helps us assess your claim. Final amount may vary after review.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">What happens next?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>- Your claim will be reviewed by UDS BusConnect</li>
                    <li>- You may be contacted for additional information</li>
                    <li>- Approved claims are paid via Mobile Money</li>
                    <li>- Processing typically takes 3-5 business days</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || bookings.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Claim'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubmitDamageClaim;



