import { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Download, Calendar, TrendingUp, DollarSign, Loader2, FileText, Bus } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/constants';
import type { Tables } from '@/integrations/supabase/types';

type BookingWithTrip = Tables<'bookings'> & {
  trips: (Tables<'trips'> & {
    bus_groups: Pick<Tables<'bus_groups'>, 'name'> | null;
  }) | null;
};

interface ReportData {
  totalRevenue: number;
  travelSafeFees: number;
  luggageTaggingFees: number;
  totalBookings: number;
  confirmedBookings: number;
  bookingsByTrip: {
    tripId: string;
    origin: string;
    destination: string;
    date: string;
    busGroup: string;
    bookings: number;
    revenue: number;
  }[];
}

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    travelSafeFees: 0,
    luggageTaggingFees: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    bookingsByTrip: [],
  });

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, trips(*, bus_groups(name))')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      if (error) throw error;

      const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
      const travelSafeFees = bookings?.reduce((sum, b) => sum + Number(b.travel_safe_fee || 0), 0) || 0;
      const luggageTaggingFees = bookings?.reduce((sum, b) => sum + Number(b.luggage_tagging_fee || 0), 0) || 0;
      const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;

      // Group by trip
      const tripMap = new Map<string, ReportData['bookingsByTrip'][number]>();
      (bookings as BookingWithTrip[] | null)?.forEach((booking) => {
        const tripId = booking.trip_id;
        if (!tripMap.has(tripId)) {
          tripMap.set(tripId, {
            tripId,
            origin: booking.trips?.origin || 'Unknown',
            destination: booking.trips?.destination || 'Unknown',
            date: booking.trips?.departure_date || '',
            busGroup: booking.trips?.bus_groups?.name || 'Unknown',
            bookings: 0,
            revenue: 0,
          });
        }
        const tripData = tripMap.get(tripId);
        if (tripData) {
          tripData.bookings++;
          tripData.revenue += Number(booking.total_amount);
        }
      });

      setReportData({
        totalRevenue,
        travelSafeFees,
        luggageTaggingFees,
        totalBookings: bookings?.length || 0,
        confirmedBookings,
        bookingsByTrip: Array.from(tripMap.values()).sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const exportToCSV = () => {
    const headers = ['Trip', 'Date', 'Bus Group', 'Bookings', 'Revenue (GHS)'];
    const rows = reportData.bookingsByTrip.map(trip => [
      `${trip.origin} - ${trip.destination}`,
      trip.date,
      trip.busGroup,
      trip.bookings,
      trip.revenue,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total Revenue,${reportData.totalRevenue}`,
      `Travel Safe Fees,${reportData.travelSafeFees}`,
      `Luggage Tagging Fees,${reportData.luggageTaggingFees}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `busconnect-report-${startDate}-to-${endDate}.csv`;
    link.click();
  };

  const setQuickDateRange = (range: string) => {
    const today = new Date();
    switch (range) {
      case 'today':
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'week':
        setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Financial Reports" navigation={<AdminNavigation />}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Financial Reports" navigation={<AdminNavigation />}>
      <div className="space-y-6">
        {/* Date Range Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Report Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange('today')}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange('week')}>
                  Last 7 Days
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange('month')}>
                  This Month
                </Button>
              </div>
              <Button onClick={exportToCSV} className="ml-auto">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(reportData.totalRevenue)}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatsCard
            title="Travel Safe Fees"
            value={formatCurrency(reportData.travelSafeFees)}
            icon={<TrendingUp className="w-5 h-5" />}
            description="GHS 30 per booking"
          />
          <StatsCard
            title="Luggage Tagging"
            value={formatCurrency(reportData.luggageTaggingFees)}
            icon={<FileText className="w-5 h-5" />}
            description="GHS 5 for excess luggage"
          />
          <StatsCard
            title="Confirmed Bookings"
            value={`${reportData.confirmedBookings}/${reportData.totalBookings}`}
            icon={<Bus className="w-5 h-5" />}
          />
        </div>

        {/* Revenue by Trip */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Trip</CardTitle>
            <CardDescription>
              Breakdown of bookings and revenue per trip
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Bus Group</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.bookingsByTrip.map((trip) => (
                  <TableRow key={trip.tripId}>
                    <TableCell className="font-medium">
                      {trip.origin} {" -> "} {trip.destination}
                    </TableCell>
                    <TableCell>
                      {trip.date ? format(new Date(trip.date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>{trip.busGroup}</TableCell>
                    <TableCell className="text-right">{trip.bookings}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(trip.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
                {reportData.bookingsByTrip.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No bookings found for this period
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

export default Reports;



