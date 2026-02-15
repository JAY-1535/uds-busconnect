import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Check, Calendar, Clock, User, Phone, Tag, Shield, Download, Copy, MessageCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, BOOKING_STATUS } from '@/lib/constants';
import type { Tables } from '@/integrations/supabase/types';

type Booking = Tables<'bookings'> & {
  trips: (Tables<'trips'> & {
    bus_groups: Tables<'bus_groups'> | null;
  }) | null;
};

const BookingConfirmation = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchBooking();
  }, [authLoading, user, navigate, fetchBooking]);

  const getStatusBadge = (status: string) => {
    const config = BOOKING_STATUS[status as keyof typeof BOOKING_STATUS] || {
      PROVISIONAL: { label: 'Provisional', color: 'warning' }
    };
    return (
      <Badge className={`status-${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading || authLoading || !booking || !booking.trips) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const trip = booking.trips;
  const shortRef = booking.id.slice(0, 8).toUpperCase();

  const buildTicketText = () => {
    const lines: string[] = [];
    lines.push("UDS BusConnect Ticket");
    lines.push(`Booking Reference: ${shortRef}`);
    lines.push(`Status: ${booking.status}`);
    lines.push("");
    lines.push(`Passenger: ${booking.full_name}`);
    lines.push(`Student ID: ${booking.student_id}`);
    lines.push(`Phone: ${booking.phone}`);
    lines.push(`Seat: ${booking.seat_number}`);
    if (booking.luggage_id) lines.push(`Luggage ID: ${booking.luggage_id}`);
    lines.push("");
    lines.push(`Bus Group: ${trip.bus_groups?.name ?? ""}`);
    lines.push(`Route: ${trip.origin} -> ${trip.destination}`);
    lines.push(`Departure: ${format(new Date(trip.departure_date), "EEE, MMM d, yyyy")} ${trip.departure_time}`);
    lines.push("");
    lines.push(`Total Paid: ${formatCurrency(Number(booking.total_amount))}`);
    if (booking.payment_reference) lines.push(`Payment Reference: ${booking.payment_reference}`);
    lines.push("");
    lines.push(`Person in Charge: ${trip.person_in_charge}`);
    lines.push(`Contact: ${trip.person_in_charge_contact}`);
    return lines.join("\n");
  };

  const downloadTicket = () => {
    try {
      const text = buildTicketText();
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `UDSBusConnect-Ticket-${shortRef}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "Ticket Downloaded",
        description: `Saved as UDSBusConnect-Ticket-${shortRef}.txt`,
      });
    } catch (e: unknown) {
      console.error("Ticket download failed:", e);
      toast({
        title: "Download Failed",
        description: "Could not download ticket. Try copying instead.",
        variant: "destructive",
      });
    }
  };

  const copyTicket = async () => {
    try {
      const text = buildTicketText();
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Ticket details copied to clipboard.",
      });
    } catch (e: unknown) {
      console.error("Copy failed:", e);
      toast({
        title: "Copy Failed",
        description: "Your browser blocked clipboard access.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Booking Submitted!</h1>
            <p className="text-muted-foreground">
              {booking.status === 'confirmed'
                ? 'Your booking is confirmed. See you on the bus!'
                : 'Your payment is being verified. You will receive a confirmation email shortly.'}
            </p>
          </div>

          {/* Ticket Card */}
          <Card className="ticket shadow-elevated mb-6">
            <CardContent className="p-0">
              {/* Header */}
              <div className="bg-primary text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-white/70">Bus Group</p>
                    <p className="font-display text-xl font-bold">
                      {trip.bus_groups?.name}
                    </p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
                <div className="flex items-center gap-4 text-lg">
                  <span>{trip.origin}</span>
                  <div className="flex-1 border-t-2 border-dashed border-white/30 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary px-2">
                      {" -> "}
                    </div>
                  </div>
                  <span>{trip.destination}</span>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-semibold">
                        {format(new Date(trip.departure_date), 'EEE, MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="font-semibold">{trip.departure_time}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Passenger</p>
                      <p className="font-semibold">{booking.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-primary font-bold">
                      #
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Seat</p>
                      <p className="font-semibold text-xl">{booking.seat_number}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Student ID</p>
                      <p className="font-semibold">{booking.student_id}</p>
                    </div>
                  </div>
                  {booking.luggage_id && (
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Luggage ID</p>
                        <p className="font-mono font-semibold">{booking.luggage_id}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-success">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm font-medium">Travel Safe Included</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="font-bold text-xl text-primary">
                      {formatCurrency(Number(booking.total_amount))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Booking Reference: <span className="font-mono">{shortRef}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <Button variant="outline" className="gap-2" onClick={downloadTicket}>
              <Download className="w-4 h-4" />
              Download Ticket
            </Button>
            <Button variant="outline" className="gap-2" onClick={copyTicket}>
              <Copy className="w-4 h-4" />
              Copy Ticket
            </Button>
            {trip.bus_groups?.whatsapp_group_link && (
              <Button
                asChild
                variant="outline"
                className="gap-2 text-success border-success/30 hover:bg-success/10"
              >
                <a href={trip.bus_groups.whatsapp_group_link} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" />
                  Join WhatsApp Group
                </a>
              </Button>
            )}
          </div>

          {/* Person in Charge */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Person in Charge</p>
              <p className="font-semibold">{trip.person_in_charge}</p>
              <p className="text-sm">{trip.person_in_charge_contact}</p>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button asChild>
              <Link to="/my-bookings">View All My Bookings</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingConfirmation;



