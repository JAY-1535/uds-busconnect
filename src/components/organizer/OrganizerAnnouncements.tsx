import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Send, Megaphone, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Trip = Tables<'trips'>;
type Announcement = Tables<'announcements'>;

interface OrganizerAnnouncementsProps {
  userId: string;
  trips: Trip[];
}

export function OrganizerAnnouncements({ userId, trips }: OrganizerAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    target_type: 'all_trips',
    target_trip_id: '',
  });

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSubmit = async () => {
    if (!form.title || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('announcements').insert({
        title: form.title,
        message: form.message,
        target_type: form.target_type,
        target_trip_id: form.target_trip_id || null,
        sender_id: userId,
      });

      if (error) throw error;

      toast.success('Announcement sent successfully!');
      setDialogOpen(false);
      setForm({ title: '', message: '', target_type: 'all_trips', target_trip_id: '' });
      fetchAnnouncements();
    } catch (error: unknown) {
      console.error('Error sending announcement:', error);
      const message = error instanceof Error ? error.message : 'Failed to send announcement';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const upcomingTrips = trips.filter(
    (t) => t.status === 'approved' && new Date(t.departure_date) >= new Date()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Announcements
          </CardTitle>
          <CardDescription>Send messages to your passengers</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Send className="w-4 h-4 mr-2" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Important Update"
                />
              </div>

              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Type your message here..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Send To</Label>
                <Select
                  value={form.target_type}
                  onValueChange={(v) => setForm({ ...form, target_type: v, target_trip_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_trips">All My Passengers</SelectItem>
                    <SelectItem value="trip">Specific Trip</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.target_type === 'trip' && (
                <div className="space-y-2">
                  <Label>Select Trip</Label>
                  <Select
                    value={form.target_trip_id}
                    onValueChange={(v) => setForm({ ...form, target_trip_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a trip" />
                    </SelectTrigger>
                    <SelectContent>
                      {upcomingTrips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.origin} {" -> "} {trip.destination} ({format(new Date(trip.departure_date), 'MMM d')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Announcement
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8">
            <Megaphone className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.slice(0, 5).map((announcement) => (
              <div
                key={announcement.id}
                className="p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-sm">{announcement.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {announcement.target_type === 'trip' ? 'Trip' : 'All'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {announcement.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}





