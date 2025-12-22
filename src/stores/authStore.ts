import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

export type AppRole = 'super_admin' | 'owner' | 'manager' | 'cashier' | 'accountant' | 'warehouse';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  language: 'uz' | 'ru' | 'en';
  theme: 'light' | 'dark';
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setRoles: (roles: AppRole[]) => void;
  setLoading: (loading: boolean) => void;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      roles: [],
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setRoles: (roles) => set({ roles }),
      setLoading: (isLoading) => set({ isLoading }),
      
      hasRole: (role) => get().roles.includes(role),
      hasAnyRole: (roles) => roles.some(role => get().roles.includes(role)),
      
      clear: () => set({
        user: null,
        session: null,
        profile: null,
        roles: [],
        isAuthenticated: false,
      }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        // Only persist non-sensitive data
        profile: state.profile,
      }),
    }
  )
);
