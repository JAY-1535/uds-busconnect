import { useState, useEffect } from 'react';
import { Plus, Phone, MapPin, Pencil, Trash2, Loader2, UserCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CAMPUSES, CAMPUS_INFO, CampusType } from '@/lib/constants';
import type { Tables } from '@/integrations/supabase/types';

type Representative = Tables<'representatives'>;

const Representatives = () => {
  const { toast } = useToast();
  const [reps, setReps] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    campus: CAMPUSES.NYANKPALA as CampusType,
    station_assignment: '',
    is_active: true,
  });

  useEffect(() => {
    fetchReps();
  }, []);

  const fetchReps = async () => {
    try {
      const { data, error } = await supabase
        .from('representatives')
        .select('*')
        .order('campus', { ascending: true });

      if (error) throw error;
      setReps(data || []);
    } catch (error) {
      console.error('Error fetching reps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRep) {
        const { error } = await supabase
          .from('representatives')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            campus: formData.campus,
            station_assignment: formData.station_assignment,
            is_active: formData.is_active,
          })
          .eq('id', editingRep.id);

        if (error) throw error;
        toast({ title: 'Representative updated successfully!' });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('representatives')
          .insert({
            ...formData,
            user_id: user.id,
          });

        if (error) throw error;
        toast({ title: 'Representative added successfully!' });
      }

      setIsDialogOpen(false);
      setEditingRep(null);
      resetForm();
      fetchReps();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save representative';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (rep: Representative) => {
    setEditingRep(rep);
    setFormData({
      full_name: rep.full_name,
      phone: rep.phone,
      campus: rep.campus as CampusType,
      station_assignment: rep.station_assignment || '',
      is_active: rep.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this representative?')) return;

    try {
      const { error } = await supabase
        .from('representatives')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Representative removed.' });
      fetchReps();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove representative';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      campus: CAMPUSES.NYANKPALA,
      station_assignment: '',
      is_active: true,
    });
  };

  const activeReps = reps.filter(r => r.is_active);
  const nyankpalaReps = reps.filter(r => r.campus === CAMPUSES.NYANKPALA);
  const tamaleReps = reps.filter(r => r.campus === CAMPUSES.TAMALE);

  if (loading) {
    return (
      <DashboardLayout title="Representatives" navigation={<AdminNavigation />}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Representatives" navigation={<AdminNavigation />}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Reps"
            value={reps.length}
            icon={<UserCheck className="w-5 h-5" />}
          />
          <StatsCard
            title="Nyankpala Reps"
            value={nyankpalaReps.length}
            icon={<MapPin className="w-5 h-5" />}
          />
          <StatsCard
            title="Tamale Reps"
            value={tamaleReps.length}
            icon={<MapPin className="w-5 h-5" />}
          />
        </div>

        {/* Add Button */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingRep(null); resetForm(); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Representative
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRep ? 'Edit Representative' : 'Add New Representative'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="024XXXXXXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campus">Campus *</Label>
                  <Select
                    value={formData.campus}
                    onValueChange={(value) => setFormData({ ...formData, campus: value as CampusType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CAMPUSES.NYANKPALA}>Nyankpala Campus</SelectItem>
                      <SelectItem value={CAMPUSES.TAMALE}>Tamale Campus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="station">Station Assignment</Label>
                  <Input
                    id="station"
                    value={formData.station_assignment}
                    onChange={(e) => setFormData({ ...formData, station_assignment: e.target.value })}
                    placeholder="e.g., Tamale Central Station"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <Button type="submit" className="w-full">
                  {editingRep ? 'Update' : 'Add'} Representative
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Representatives List */}
        <div className="grid gap-4 md:grid-cols-2">
          {reps.map((rep) => (
            <Card key={rep.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{rep.full_name}</h3>
                      <Badge variant={rep.is_active ? 'default' : 'secondary'}>
                        {rep.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{rep.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {CAMPUS_INFO[rep.campus as CampusType]?.shortName || rep.campus}
                      </Badge>
                      {rep.station_assignment && (
                        <span className="text-sm text-muted-foreground">
                          @ {rep.station_assignment}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(rep)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rep.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reps.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <UserCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Representatives Yet</h3>
              <p className="text-muted-foreground">Add representatives to manage bus stations.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Representatives;


