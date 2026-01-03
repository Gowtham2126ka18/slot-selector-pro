import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isDepartmentHead: boolean;
  departmentId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDepartmentHead, setIsDepartmentHead] = useState(false);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
    return !!data;
  };

  const checkDepartmentHeadRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('department_head_credentials')
      .select('department_id, is_enabled')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .maybeSingle();

    if (error) {
      console.error('Error checking department head role:', error);
      return { isDH: false, deptId: null };
    }
    return { isDH: !!data, deptId: data?.department_id || null };
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer role checks with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(async () => {
            const adminResult = await checkAdminRole(session.user.id);
            setIsAdmin(adminResult);
            
            if (!adminResult) {
              const dhResult = await checkDepartmentHeadRole(session.user.id);
              setIsDepartmentHead(dhResult.isDH);
              setDepartmentId(dhResult.deptId);
            } else {
              setIsDepartmentHead(false);
              setDepartmentId(null);
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setIsDepartmentHead(false);
          setDepartmentId(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const adminResult = await checkAdminRole(session.user.id);
        setIsAdmin(adminResult);
        
        if (!adminResult) {
          const dhResult = await checkDepartmentHeadRole(session.user.id);
          setIsDepartmentHead(dhResult.isDH);
          setDepartmentId(dhResult.deptId);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsDepartmentHead(false);
    setDepartmentId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isDepartmentHead,
        departmentId,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
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
