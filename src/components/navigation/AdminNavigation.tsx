import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  CheckCircle, 
  Users, 
  Megaphone, 
  UserCheck, 
  BarChart3, 
  Tag, 
  AlertTriangle,
  UserPlus,
} from "lucide-react";

export const AdminNavigation = () => {
  const { adminPermissions } = useAuth();
  const hasLimitedAccess = adminPermissions.length > 0;
  const can = (section: string) => !hasLimitedAccess || adminPermissions.includes(section);

  return (
    <>
      <NavLink to="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>
        Dashboard
      </NavLink>
      {can("approvals") && (
        <NavLink to="/admin/approvals" icon={<CheckCircle className="h-4 w-4" />}>
          Trip Approvals
        </NavLink>
      )}
      {can("organizer_applications") && (
        <NavLink to="/admin/organizer-applications" icon={<UserPlus className="h-4 w-4" />}>
          Organizer Apps
        </NavLink>
      )}
      {can("users") && (
        <NavLink to="/admin/users" icon={<Users className="h-4 w-4" />}>
          User Management
        </NavLink>
      )}
      {can("announcements") && (
        <NavLink to="/admin/announcements" icon={<Megaphone className="h-4 w-4" />}>
          Announcements
        </NavLink>
      )}
      {can("representatives") && (
        <NavLink to="/admin/representatives" icon={<UserCheck className="h-4 w-4" />}>
          Representatives
        </NavLink>
      )}
      {can("reports") && (
        <NavLink to="/admin/reports" icon={<BarChart3 className="h-4 w-4" />}>
          Reports
        </NavLink>
      )}
      {can("luggage_tags") && (
        <NavLink to="/admin/luggage-tags" icon={<Tag className="h-4 w-4" />}>
          Luggage Tags
        </NavLink>
      )}
      {can("damage_claims") && (
        <NavLink to="/admin/damage-claims" icon={<AlertTriangle className="h-4 w-4" />}>
          Damage Claims
        </NavLink>
      )}
    </>
  );
};



