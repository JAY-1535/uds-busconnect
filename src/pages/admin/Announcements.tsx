import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminNavigation } from "@/components/navigation/AdminNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function Announcements() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Tables<"announcements">[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", target_type: "all", campus: "" });

  useEffect(() => { if (!authLoading && !isAdmin) navigate("/"); }, [authLoading, isAdmin, navigate]);
  useEffect(() => { if (user && isAdmin) fetchAnnouncements(); }, [user, isAdmin]);

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.message) { toast.error("Fill required fields"); return; }
    await supabase.from("announcements").insert({
      title: form.title,
      message: form.message,
      target_type: form.target_type,
      sender_id: user!.id,
      campus: (form.campus || null) as "nyankpala" | "tamale" | null,
    });
    toast.success("Announcement sent!");
    setDialogOpen(false);
    setForm({ title: "", message: "", target_type: "all", campus: "" });
    fetchAnnouncements();
  };

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <DashboardLayout title="Announcements" navigation={<AdminNavigation />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h2 className="text-2xl font-bold">Announcements</h2><p className="text-muted-foreground">Broadcast messages to users</p></div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Announcement</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Message *</Label><Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} /></div>
                <div><Label>Target</Label><Select value={form.target_type} onValueChange={v => setForm({ ...form, target_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Users</SelectItem><SelectItem value="campus">Specific Campus</SelectItem></SelectContent></Select></div>
                {form.target_type === "campus" && <div><Label>Campus</Label><Select value={form.campus} onValueChange={v => setForm({ ...form, campus: v })}><SelectTrigger><SelectValue placeholder="Select campus" /></SelectTrigger><SelectContent><SelectItem value="nyankpala">Nyankpala</SelectItem><SelectItem value="tamale">Tamale</SelectItem></SelectContent></Select></div>}
                <Button onClick={handleCreate} className="w-full">Send Announcement</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-4">
          {announcements.map(a => (
            <Card key={a.id}>
              <CardHeader><CardTitle>{a.title}</CardTitle><p className="text-sm text-muted-foreground">{format(new Date(a.created_at), "MMM d, yyyy h:mm a")} - {a.target_type === "all" ? "All Users" : `${a.campus} campus`}</p></CardHeader>
              <CardContent><p>{a.message}</p></CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}



