import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Loader2, Clock, User, Building, MapPin } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CAMPUS_INFO } from '@/lib/constants';

interface OrganizerApplication {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  campus: string;
  bus_group_name: string;
  experience: string | null;
  reason: string;
  status: string;
  review_notes: string | null;
  created_at: string;
}

const OrganizerApplications = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<OrganizerApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchApplications();
    }
  }, [user, isAdmin]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('organizer_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;

    setProcessing(true);
    try {
      // Call the approve function
      const { data, error } = await supabase.rpc('approve_organizer_application', {
        application_id: selectedApp.id,
        admin_notes: reviewNotes || null,
      });

      if (error) throw error;

      toast.success('Application approved! User is now an organizer.');
      setSelectedApp(null);
      setReviewNotes('');
      fetchApplications();
    } catch (error: unknown) {
      console.error('Error approving application:', error);
      const message = error instanceof Error ? error.message : 'Failed to approve application';
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('organizer_applications')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          review_notes: reviewNotes || null,
        })
        .eq('id', selectedApp.id);

      if (error) throw error;

      toast.success('Application rejected.');
      setSelectedApp(null);
      setReviewNotes('');
      fetchApplications();
    } catch (error: unknown) {
      console.error('Error rejecting application:', error);
      const message = error instanceof Error ? error.message : 'Failed to reject application';
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-primary/10 text-primary"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout title="Organizer Applications" navigation={<AdminNavigation />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Organizer Applications</h2>
            <p className="text-muted-foreground">
              {pendingCount} pending application{pendingCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Applications</CardTitle>
            <CardDescription>Review and manage organizer applications</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="py-12 text-center">
                <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No applications yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Bus Group</TableHead>
                    <TableHead>Campus</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{app.full_name}</p>
                          <p className="text-sm text-muted-foreground">{app.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{app.bus_group_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CAMPUS_INFO[app.campus as keyof typeof CAMPUS_INFO]?.shortName || app.campus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(app.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setReviewNotes(app.review_notes || '');
                          }}
                        >
                          {app.status === 'pending' ? 'Review' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Review the organizer application
              </DialogDescription>
            </DialogHeader>

            {selectedApp && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{selectedApp.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedApp.email} - {selectedApp.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Building className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{selectedApp.bus_group_name}</p>
                      <p className="text-sm text-muted-foreground">Proposed Bus Group</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{CAMPUS_INFO[selectedApp.campus as keyof typeof CAMPUS_INFO]?.name}</p>
                      <p className="text-sm text-muted-foreground">Campus</p>
                    </div>
                  </div>
                </div>

                {selectedApp.experience && (
                  <div>
                    <Label className="text-sm font-medium">Experience</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedApp.experience}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Reason for Applying</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedApp.reason}</p>
                </div>

                {selectedApp.status === 'pending' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Review Notes (Optional)</Label>
                      <Textarea
                        placeholder="Add any notes for this application..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleApprove}
                        disabled={processing}
                        className="flex-1"
                      >
                        {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={processing}
                        className="flex-1"
                      >
                        {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="font-medium">Status: {selectedApp.status}</p>
                    {selectedApp.review_notes && (
                      <p className="text-sm text-muted-foreground mt-1">Notes: {selectedApp.review_notes}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default OrganizerApplications;



