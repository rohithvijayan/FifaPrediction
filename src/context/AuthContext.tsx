'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthUser {
  uid: string;
  email: string | undefined;
  displayName: string;
  getIdToken: () => Promise<string>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Maps a Supabase user/session to our unified AuthUser type
  const mapSessionUser = (sessionUser: SupabaseUser): AuthUser => {
    return {
      uid: sessionUser.id,
      email: sessionUser.email,
      displayName: sessionUser.user_metadata?.name || 'Player',
      getIdToken: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || '';
      },
    };
  };

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSessionUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // 2. Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(mapSessionUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name,
        },
      },
    });

    if (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
