import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore, type AppRole } from '@/stores/authStore';

export const useAuth = () => {
  const {
    user,
    session,
    profile,
    roles,
    isLoading,
    isAuthenticated,
    setUser,
    setSession,
    setProfile,
    setRoles,
    setLoading,
    clear,
  } = useAuthStore();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile({
          ...data,
          language: data.language as 'uz' | 'ru' | 'en',
          theme: data.theme as 'light' | 'dark',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [setProfile]);

  const fetchRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      if (data) {
        const userRoles = data.map(r => r.role as AppRole);
        setRoles(userRoles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, [setRoles]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch profile and roles with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoles(session.user.id);
          }, 0);
        } else {
          clear();
        }

        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser, setLoading, fetchProfile, fetchRoles, clear]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clear();
  }, [clear]);

  return {
    user,
    session,
    profile,
    roles,
    isLoading,
    isAuthenticated,
    signOut,
  };
};
