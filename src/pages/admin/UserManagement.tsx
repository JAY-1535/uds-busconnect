import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminNavigation } from "@/components/navigation/AdminNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const ADMIN_SECTIONS = [
  { key: "approvals", label: "Trip Approvals" },
  { key: "organizer_applications", label: "Organizer Apps" },
  { key: "users", label: "User Management" },
  { key: "announcements", label: "Announcements" },
  { key: "representatives", label: "Representatives" },
  { key: "reports", label: "Reports" },
  { key: "luggage_tags", label: "Luggage Tags" },
  { key: "damage_claims", label: "Damage Claims" },
];

export default function UserManagement() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<(Profile & { roles: string[]; permissions: string[] })[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => { if (!authLoading && !isAdmin) navigate("/"); }, [authLoading, isAdmin, navigate]);
  useEffect(() => { if (user && isAdmin) fetchUsers(); }, [user, isAdmin]);

  const fetchUsers = async () => {
    const [profilesRes, rolesRes, permsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("admin_permissions").select("*"),
    ]);
    const rolesMap: Record<string, string[]> = {};
    (rolesRes.data || []).forEach(r => { rolesMap[r.user_id] = [...(rolesMap[r.user_id] || []), r.role]; });
    const permsMap: Record<string, string[]> = {};
    (permsRes.data || []).forEach(p => { permsMap[p.user_id] = [...(permsMap[p.user_id] || []), p.section]; });
    setProfiles((profilesRes.data || []).map(p => ({ 
      ...p, 
      roles: rolesMap[p.user_id] || ["student"],
      permissions: permsMap[p.user_id] || [],
    })));
    setLoading(false);
  };

  const grantAdmin = async (userId: string) => {
    const row: TablesInsert<"user_roles"> = { user_id: userId, role: "admin" };
    const { error } = await supabase.from("user_roles").upsert(row, { onConflict: "user_id,role" });
    if (error) {
      toast.error(error.message || "Failed to grant admin");
      return;
    }
    toast.success("Admin access granted");
    fetchUsers();
  };

  const revokeAdmin = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");
    if (error) {
      toast.error(error.message || "Failed to revoke admin");
      return;
    }
    await supabase.from("admin_permissions").delete().eq("user_id", userId);
    toast.success("Admin access revoked");
    fetchUsers();
  };

  const togglePermission = async (userId: string, section: string, enabled: boolean) => {
    if (enabled) {
      const { error } = await supabase.from("admin_permissions").insert({ user_id: userId, section });
      if (error) {
        toast.error(error.message || "Failed to add permission");
        return;
      }
    } else {
      const { error } = await supabase
        .from("admin_permissions")
        .delete()
        .eq("user_id", userId)
        .eq("section", section);
      if (error) {
        toast.error(error.message || "Failed to remove permission");
        return;
      }
    }
    fetchUsers();
  };

  const filtered = profiles.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase()) || 
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout title="User Management" navigation={<AdminNavigation />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">{profiles.length} users</p>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Admin Access</TableHead>
                  <TableHead>Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell className="capitalize">{p.campus || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {p.roles.map(r => (
                          <Badge key={r} variant={r === "admin" ? "default" : r === "organizer" ? "secondary" : "outline"}>
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {p.roles.includes("admin") ? (
                          <Button variant="outline" size="sm" onClick={() => revokeAdmin(p.user_id)}>
                            Revoke Admin
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => grantAdmin(p.user_id)}>
                            Make Admin
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.roles.includes("admin") ? (
                        <div className="grid grid-cols-1 gap-2 min-w-[240px]">
                          <div className="text-xs text-muted-foreground">
                            {p.permissions.length === 0 ? "Super admin (all access)" : "Limited admin"}
                          </div>
                          {ADMIN_SECTIONS.map((s) => {
                            const checked = p.permissions.includes(s.key);
                            return (
                              <label key={s.key} className="flex items-center gap-2 text-xs">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => togglePermission(p.user_id, s.key, Boolean(v))}
                                />
                                <span>{s.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not an admin</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


