import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, DollarSign, Loader2, Clock, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/constants';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

type DamageClaim = Tables<'damage_claims'> & {
  bookings?: (Tables<'bookings'> & {
    trips?: Tables<'trips'> | null;
  }) | null;
};

const DamageClaims = () => {
  const { toast } = useToast();
  const [claims, setClaims] = useState<DamageClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<DamageClaim | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [processForm, setProcessForm] = useState({
    status: '' as 'approved' | 'paid' | 'rejected' | '',
    amount_approved: '',
    notes: '',
  });

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const { data, error } = await supabase
        .from('damage_claims')
        .select('*, bookings(*, trips(*))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessClaim = async () => {
    if (!selectedClaim || !processForm.status) return;

    setIsProcessing(true);
    try {
      const updateData: TablesUpdate<'damage_claims'> = {
        status: processForm.status,
        notes: processForm.notes,
      };

      if (processForm.status === 'approved' || processForm.status === 'paid') {
        updateData.amount_approved = parseFloat(processForm.amount_approved) || 0;
      }

      const { error } = await supabase
        .from('damage_claims')
        .update(updateData)
        .eq('id', selectedClaim.id);

      if (error) throw error;

      toast({ title: `Claim ${processForm.status} successfully!` });
      setSelectedClaim(null);
      setProcessForm({ status: '', amount_approved: '', notes: '' });
      fetchClaims();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process claim';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><DollarSign className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredClaims = statusFilter === 'all' 
    ? claims 
    : claims.filter(c => c.status === statusFilter);

  const pendingClaims = claims.filter(c => c.status === 'pending');
  const approvedAmount = claims
    .filter(c => c.status === 'approved' || c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.amount_approved || 0), 0);
  const paidAmount = claims
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.amount_approved || 0), 0);

  if (loading) {
    return (
      <DashboardLayout title="Damage Claims" navigation={<AdminNavigation />}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Damage Claims" navigation={<AdminNavigation />}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total Claims"
            value={claims.length}
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <StatsCard
            title="Pending"
            value={pendingClaims.length}
            icon={<Clock className="w-5 h-5" />}
          />
          <StatsCard
            title="Total Approved"
            value={formatCurrency(approvedAmount)}
            icon={<CheckCircle className="w-5 h-5" />}
          />
          <StatsCard
            title="Total Paid"
            value={formatCurrency(paidAmount)}
            icon={<DollarSign className="w-5 h-5" />}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Label>Filter by Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Claims</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Claims Table */}
        <Card>
          <CardHeader>
            <CardTitle>Damage Claims</CardTitle>
            <CardDescription>
              Review and process damage claims from passengers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Trip</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Claimed</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>
                      {format(new Date(claim.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {claim.bookings?.full_name || 'Unknown'}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {claim.bookings?.student_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      {claim.bookings?.trips ? (
                        <span className="text-sm">
                          {claim.bookings.trips.origin} {" -> "} {claim.bookings.trips.destination}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {claim.description}
                    </TableCell>
                    <TableCell>
                      {claim.amount_claimed ? formatCurrency(Number(claim.amount_claimed)) : '-'}
                    </TableCell>
                    <TableCell>
                      {claim.amount_approved ? formatCurrency(Number(claim.amount_approved)) : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setProcessForm({
                                status: '',
                                amount_approved: String(claim.amount_claimed || ''),
                                notes: claim.notes || '',
                              });
                            }}
                          >
                            Process
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Process Claim</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg space-y-2">
                              <p><strong>Passenger:</strong> {selectedClaim?.bookings?.full_name}</p>
                              <p><strong>Description:</strong> {selectedClaim?.description}</p>
                              <p><strong>Amount Claimed:</strong> {selectedClaim?.amount_claimed ? formatCurrency(Number(selectedClaim.amount_claimed)) : 'Not specified'}</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Decision *</Label>
                              <Select
                                value={processForm.status}
                                onValueChange={(value) => setProcessForm({ ...processForm, status: value as 'approved' | 'paid' | 'rejected' })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select decision..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approved">Approve</SelectItem>
                                  <SelectItem value="paid">Approve & Mark as Paid</SelectItem>
                                  <SelectItem value="rejected">Reject</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {(processForm.status === 'approved' || processForm.status === 'paid') && (
                              <div className="space-y-2">
                                <Label>Amount to Approve (GHS)</Label>
                                <Input
                                  type="number"
                                  value={processForm.amount_approved}
                                  onChange={(e) => setProcessForm({ ...processForm, amount_approved: e.target.value })}
                                />
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label>Notes</Label>
                              <Textarea
                                value={processForm.notes}
                                onChange={(e) => setProcessForm({ ...processForm, notes: e.target.value })}
                                placeholder="Add any notes about this decision..."
                              />
                            </div>
                            <Button
                              onClick={handleProcessClaim}
                              disabled={!processForm.status || isProcessing}
                              className="w-full"
                            >
                              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Submit Decision
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredClaims.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No claims found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DamageClaims;



