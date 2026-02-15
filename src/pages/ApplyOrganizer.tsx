import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Building, FileText, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CAMPUSES, CAMPUS_INFO } from '@/lib/constants';
import type { Tables } from '@/integrations/supabase/types';

const applicationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  campus: z.enum(['nyankpala', 'tamale'], { required_error: 'Please select a campus' }),
  busGroupName: z.string().min(2, 'Bus group name must be at least 2 characters'),
  experience: z.string().optional(),
  reason: z.string().min(20, 'Please provide a reason (at least 20 characters)'),
});

type ApplicationForm = z.infer<typeof applicationSchema>;
type OrganizerApplication = Tables<'organizer_applications'>;

const ApplyOrganizer = () => {
  const navigate = useNavigate();
  const { user, profile, isOrganizer, loading: authLoading, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<OrganizerApplication | null>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      campus: undefined,
      busGroupName: '',
      experience: '',
      reason: '',
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?mode=signup&redirect=/apply-organizer');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && isOrganizer) {
      navigate('/organizer');
    }
  }, [authLoading, isOrganizer, navigate]);

  useEffect(() => {
    if (existingApplication?.status === 'approved' && !isOrganizer) {
      refreshProfile();
    }
  }, [existingApplication?.status, isOrganizer, refreshProfile]);

  useEffect(() => {
    if (profile) {
      form.setValue('fullName', profile.full_name || '');
      form.setValue('email', profile.email || '');
      form.setValue('phone', profile.phone || '');
      if (profile.campus) {
        form.setValue('campus', profile.campus);
      }
    }
  }, [profile, form]);

  const checkExistingApplication = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('organizer_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setExistingApplication(data);
      }
    } catch (error) {
      // No existing application
    } finally {
      setCheckingApplication(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkExistingApplication();
    }
  }, [user, checkExistingApplication]);

  const onSubmit = async (data: ApplicationForm) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('organizer_applications').insert({
        user_id: user.id,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        campus: data.campus,
        bus_group_name: data.busGroupName,
        experience: data.experience || null,
        reason: data.reason,
      });

      if (error) throw error;

      toast.success('Application submitted successfully!');
      checkExistingApplication();
    } catch (error: unknown) {
      console.error('Error submitting application:', error);
      const message = error instanceof Error ? error.message : 'Failed to submit application';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
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
          {existingApplication ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Application {existingApplication.status === 'pending' ? 'Submitted' : existingApplication.status === 'approved' ? 'Approved!' : 'Status Update'}</CardTitle>
                <CardDescription>
                  {existingApplication.status === 'pending' && 'Your organizer application is being reviewed'}
                  {existingApplication.status === 'approved' && 'Congratulations! Your application has been approved'}
                  {existingApplication.status === 'rejected' && 'Unfortunately, your application was not approved'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p><strong>Bus Group:</strong> {existingApplication.bus_group_name}</p>
                  <p><strong>Campus:</strong> {CAMPUS_INFO[existingApplication.campus as keyof typeof CAMPUS_INFO]?.name}</p>
                  <p><strong>Status:</strong> <span className={`font-medium ${existingApplication.status === 'approved' ? 'text-green-600' : existingApplication.status === 'rejected' ? 'text-destructive' : 'text-warning'}`}>{existingApplication.status.charAt(0).toUpperCase() + existingApplication.status.slice(1)}</span></p>
                  {existingApplication.review_notes && (
                    <p><strong>Notes:</strong> {existingApplication.review_notes}</p>
                  )}
                </div>

                {existingApplication.status === 'approved' && (
                  <div className="space-y-3">
                    {!isOrganizer && (
                      <p className="text-sm text-muted-foreground">
                        Your organizer access is being activated. If you still cannot access the dashboard, refresh your session.
                      </p>
                    )}
                    <Button onClick={() => refreshProfile()} variant="outline" className="w-full">
                      Refresh Access
                    </Button>
                    <Button onClick={() => navigate('/organizer')} className="w-full">
                      Go to Organizer Dashboard
                    </Button>
                  </div>
                )}

                {existingApplication.status === 'rejected' && (
                  <Button
                    variant="outline"
                    onClick={() => setExistingApplication(null)}
                    className="w-full"
                  >
                    Submit New Application
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Become a Bus Organizer</CardTitle>
                <CardDescription>
                  Apply to become a verified bus organizer on UDS BusConnect. 
                  Once approved, you can create bus groups and manage trips for students.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          placeholder="Your full name"
                          className="pl-10"
                          {...form.register('fullName')}
                        />
                      </div>
                      {form.formState.errors.fullName && (
                        <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          className="pl-10"
                          {...form.register('email')}
                        />
                      </div>
                      {form.formState.errors.email && (
                        <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="024XXXXXXX"
                          className="pl-10"
                          {...form.register('phone')}
                        />
                      </div>
                      {form.formState.errors.phone && (
                        <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Campus *</Label>
                      <Select
                        value={form.watch('campus')}
                        onValueChange={(value: 'nyankpala' | 'tamale') => form.setValue('campus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select campus" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CAMPUSES.NYANKPALA}>
                            {CAMPUS_INFO[CAMPUSES.NYANKPALA].name}
                          </SelectItem>
                          <SelectItem value={CAMPUSES.TAMALE}>
                            {CAMPUS_INFO[CAMPUSES.TAMALE].name}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.campus && (
                        <p className="text-sm text-destructive">{form.formState.errors.campus.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="busGroupName">Proposed Bus Group Name *</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="busGroupName"
                        placeholder="e.g., Express Travels, Kwame TTFPP Buses"
                        className="pl-10"
                        {...form.register('busGroupName')}
                      />
                    </div>
                    {form.formState.errors.busGroupName && (
                      <p className="text-sm text-destructive">{form.formState.errors.busGroupName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience (Optional)</Label>
                    <Textarea
                      id="experience"
                      placeholder="Tell us about any previous experience organizing bus trips..."
                      rows={3}
                      {...form.register('experience')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Why do you want to become an organizer? *</Label>
                    <div className="relative">
                      <Textarea
                        id="reason"
                        placeholder="Explain why you want to organize bus trips for UDS students..."
                        rows={4}
                        {...form.register('reason')}
                      />
                    </div>
                    {form.formState.errors.reason && (
                      <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit Application
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ApplyOrganizer;


