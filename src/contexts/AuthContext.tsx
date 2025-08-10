'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastAccessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      lastAccessTokenRef.current = session?.access_token ?? null;
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        const nextToken = nextSession?.access_token ?? null;
        const nextUserId = nextSession?.user?.id ?? null;
        const currentUserId = user?.id ?? null;

        // Only update context if something meaningful changed (prevents refetches on focus)
        const tokenChanged = nextToken !== lastAccessTokenRef.current;
        const userChanged = nextUserId !== currentUserId;
        
        if (!tokenChanged && !userChanged) {
          return;
        }

        lastAccessTokenRef.current = nextToken;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Prefer local sign out to avoid server errors when session is already invalid (e.g., Vercel focus/resume)
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error && error.message && !/session_not_found/i.test(error.message)) {
      // Try global as a fallback, but ignore session_not_found
      const { error: globalErr } = await supabase.auth.signOut({ scope: 'global' });
      if (globalErr && !/session_not_found/i.test(globalErr.message)) {
        console.error('Sign out error:', globalErr);
      }
    }
    // Clear local auth state regardless
    setSession(null);
    setUser(null);
    lastAccessTokenRef.current = null;
    if (typeof window !== 'undefined') {
      try {
        // Clear any one-time flags (e.g., watchlist loaded)
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith('watchlist_loaded_')) sessionStorage.removeItem(k);
        });
      } catch {}
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
