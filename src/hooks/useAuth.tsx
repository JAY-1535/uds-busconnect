import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  campus: 'nyankpala' | 'tamale' | null;
  student_id: string | null;
  student_class: string | null;
  emergency_contact: string | null;
}

interface UserRole {
  role: 'student' | 'organizer' | 'admin';
  campus: 'nyankpala' | 'tamale' | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: UserRole[];
  role: 'student' | 'organizer' | 'admin' | null;
  adminPermissions: string[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isOrganizer: boolean;
  isStudent: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [adminPermissions, setAdminPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      setProfile(null);
      setRoles([]);
      setAdminPermissions([]);

      // Load all user-linked data in parallel to reduce post-login wait time.
      const [profileRes, rolesRes, permissionsRes] = await Promise.allSettled([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('user_roles')
          .select('role, campus')
          .eq('user_id', userId),
        supabase
          .from('admin_permissions')
          .select('section')
          .eq('user_id', userId),
      ]);

      if (profileRes.status === 'fulfilled') {
        const profileData = profileRes.value.data;
        if (profileData) {
          setProfile(profileData as UserProfile);
        }
      }

      if (rolesRes.status === 'fulfilled') {
        const rolesData = rolesRes.value.data;
        setRoles((rolesData || []) as UserRole[]);
      } else {
        setRoles([]);
      }

      if (permissionsRes.status === 'fulfilled') {
        const permissionsData = permissionsRes.value.data;
        setAdminPermissions((permissionsData || []).map((p) => p.section));
      } else {
        setAdminPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setLoading(true);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Important: don't mark auth as "ready" until role/profile are loaded.
          // Otherwise ProtectedRoute can redirect an organizer/admin to public pages.
          fetchUserData(session.user.id)
            .finally(() => setLoading(false));
          return;
        }

        setProfile(null);
        setRoles([]);
        setAdminPermissions([]);

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRoles([]);
          setAdminPermissions([]);
        }

        setLoading(false);
      }
    );

    // THEN check for existing session
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id)
          .finally(() => setLoading(false));
        return;
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setAdminPermissions([]);
  };

  const isAdmin = roles.some(r => r.role === 'admin');
  const isOrganizer = roles.some(r => r.role === 'organizer');
  const isStudent = roles.some(r => r.role === 'student');
  
  // Primary role (admin > organizer > student)
  const role: 'student' | 'organizer' | 'admin' | null = isAdmin 
    ? 'admin' 
    : isOrganizer 
      ? 'organizer' 
      : isStudent 
        ? 'student' 
        : null;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      roles,
      role,
      adminPermissions,
      loading,
      signUp,
      signIn,
      signOut,
      isAdmin,
      isOrganizer,
      isStudent,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

