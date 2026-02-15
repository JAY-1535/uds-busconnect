import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'student' | 'organizer' | 'admin';
  requiredAdminSection?: string;
}

export const ProtectedRoute = ({ children, requiredRole, requiredAdminSection }: ProtectedRouteProps) => {
  const { user, loading, role, isAdmin, isOrganizer, adminPermissions } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setIsChecking(false);
    }
  }, [loading]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }

  if (requiredRole) {
    let hasAccess = false;
    
    if (requiredRole === 'admin') {
      hasAccess = isAdmin;
    } else if (requiredRole === 'organizer') {
      hasAccess = isAdmin || isOrganizer;
    } else if (requiredRole === 'student') {
      hasAccess = true; // All logged-in users can access student routes
    }
    
    if (!hasAccess) {
      if (requiredRole === 'organizer') {
        return <Navigate to="/apply-organizer" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  if (requiredRole === 'admin' && requiredAdminSection) {
    // If admin has specific permissions, enforce them. No permissions => full access (super admin).
    if (adminPermissions.length > 0 && !adminPermissions.includes(requiredAdminSection)) {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};



