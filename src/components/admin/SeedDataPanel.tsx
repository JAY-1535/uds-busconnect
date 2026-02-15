import { useState } from 'react';
import { Loader2, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SeedDataPanelProps {
  userId: string;
}

export const SeedDataPanel = ({ userId }: SeedDataPanelProps) => {
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const seedSampleData = async () => {
    setSeeding(true);
    try {
      // Check if data already exists
      const { data: existingGroups } = await supabase
        .from('bus_groups')
        .select('id')
        .limit(1);

      if (existingGroups && existingGroups.length > 0) {
        toast.info('Sample data already exists');
        setSeeded(true);
        setSeeding(false);
        return;
      }

      // Create sample bus groups
      const busGroupsData = [
        {
          name: 'Express TTFPP Travels',
          campus: 'nyankpala' as const,
          description: 'Fast and reliable transportation for Nyankpala students',
          whatsapp_group_link: 'https://chat.whatsapp.com/sample1',
          organizer_id: userId,
        },
        {
          name: 'Kwame TTFPP Buses',
          campus: 'nyankpala' as const,
          description: 'Premium bus service with experienced drivers',
          whatsapp_group_link: 'https://chat.whatsapp.com/sample2',
          organizer_id: userId,
        },
        {
          name: 'Tamale Express',
          campus: 'tamale' as const,
          description: 'Serving Tamale campus students with care',
          whatsapp_group_link: 'https://chat.whatsapp.com/sample3',
          organizer_id: userId,
        },
      ];

      const { data: createdGroups, error: groupsError } = await supabase
        .from('bus_groups')
        .insert(busGroupsData)
        .select();

      if (groupsError) throw groupsError;

      // Create buses for each group
      const busesData = createdGroups!.flatMap((group, index) => [
        {
          bus_group_id: group.id,
          bus_number: `GR-${1234 + index * 2}-21`,
          capacity: 50,
        },
        {
          bus_group_id: group.id,
          bus_number: `GR-${1235 + index * 2}-21`,
          capacity: 45,
        },
      ]);

      const { data: createdBuses, error: busesError } = await supabase
        .from('buses')
        .insert(busesData)
        .select();

      if (busesError) throw busesError;

      // Create sample trips
      const today = new Date();
      const tripsData = createdGroups!.flatMap((group, groupIndex) => {
        const campusBuses = createdBuses!.filter(b => b.bus_group_id === group.id);
        return [
          {
            bus_group_id: group.id,
            bus_id: campusBuses[0]?.id || null,
            campus: group.campus as 'nyankpala' | 'tamale',
            origin: group.campus === 'nyankpala' ? 'Nyankpala' : 'Tamale',
            destination: 'Accra',
            departure_date: new Date(today.getTime() + (3 + groupIndex) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            departure_time: '06:00',
            price: 150,
            total_seats: campusBuses[0]?.capacity || 50,
            available_seats: campusBuses[0]?.capacity || 50,
            person_in_charge: `Driver ${groupIndex + 1}`,
            person_in_charge_contact: `024000000${groupIndex}`,
            status: 'approved' as const,
          },
          {
            bus_group_id: group.id,
            bus_id: campusBuses[1]?.id || null,
            campus: group.campus as 'nyankpala' | 'tamale',
            origin: group.campus === 'nyankpala' ? 'Nyankpala' : 'Tamale',
            destination: 'Kumasi',
            departure_date: new Date(today.getTime() + (5 + groupIndex) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            departure_time: '07:30',
            price: 120,
            total_seats: campusBuses[1]?.capacity || 45,
            available_seats: campusBuses[1]?.capacity || 45,
            person_in_charge: `Manager ${groupIndex + 1}`,
            person_in_charge_contact: `020000000${groupIndex}`,
            status: 'approved' as const,
          },
        ];
      });

      const { error: tripsError } = await supabase
        .from('trips')
        .insert(tripsData);

      if (tripsError) throw tripsError;

      // Create sample representatives
      const repsData = [
        {
          user_id: userId,
          full_name: 'Kofi Mensah',
          phone: '0241234567',
          campus: 'nyankpala' as const,
          station_assignment: 'Nyankpala Main Station',
          is_active: true,
        },
        {
          user_id: userId,
          full_name: 'Ama Osei',
          phone: '0209876543',
          campus: 'tamale' as const,
          station_assignment: 'Tamale Central Bus Terminal',
          is_active: true,
        },
      ];

      const { error: repsError } = await supabase
        .from('representatives')
        .insert(repsData);

      if (repsError) throw repsError;

      // Create sample announcement
      const { error: announcementError } = await supabase
        .from('announcements')
        .insert({
          sender_id: userId,
          title: 'Welcome to UDS BusConnect!',
          message: 'We are excited to launch our new bus booking platform. Book your TTFPP trips easily and travel safely with Travel Safe insurance included in every booking.',
          target_type: 'all',
        });

      if (announcementError) throw announcementError;

      toast.success('Sample data created successfully!');
      setSeeded(true);
    } catch (error: unknown) {
      console.error('Error seeding data:', error);
      const message = error instanceof Error ? error.message : 'Failed to seed sample data';
      toast.error(message);
    } finally {
      setSeeding(false);
    }
  };

  if (seeded) {
    return (
      <Alert className="bg-primary/5 border-primary/20">
        <CheckCircle className="h-4 w-4 text-primary" />
        <AlertTitle>Sample Data Ready</AlertTitle>
        <AlertDescription>
          The platform has been populated with sample bus groups, buses, trips, and representatives.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Seed Sample Data
        </CardTitle>
        <CardDescription>
          Populate the platform with sample data for testing purposes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default" className="bg-warning/10 border-warning/20">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Development Only</AlertTitle>
          <AlertDescription>
            This will create sample bus groups, buses, trips, and representatives. Use only for testing.
          </AlertDescription>
        </Alert>
        <Button onClick={seedSampleData} disabled={seeding} variant="outline" className="w-full">
          {seeding ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Sample Data...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Create Sample Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};



