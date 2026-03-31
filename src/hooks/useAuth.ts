// src/hooks/useAuth.ts
// React hook for authentication state management

import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';
import {
  getCurrentSession,
  getCurrentUser,
  getUserProfile,
  signInWithEmail as authSignIn,
  signUpWithEmail as authSignUp,
  signInWithGoogle as authGoogleSignIn,
  signOut as authSignOut,
  onAuthStateChange,
} from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile when user changes
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const userProfile = await getUserProfile(userId);
      setProfile(userProfile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    }
  }, []);

  // Initialize: check existing session
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function initialize() {
      try {
        // Llamadas independientes para que un fallo no bloquee la otra
        const currentSession = await getCurrentSession().catch(() => null);
        const currentUser = await getCurrentUser().catch(() => null);

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id).catch(() => null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initialize();

    // Listen for auth state changes (login, logout, token refresh)
    const { unsubscribe } = onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      if (newUser) {
        await fetchProfile(newUser.id);
      } else {
        setProfile(null);
      }

      // On sign-out, clear everything
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [fetchProfile]);

  // Actions
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await authSignIn(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setError(null);
    try {
      await authSignUp(email, password, displayName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la cuenta';
      setError(message);
      throw err;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await authGoogleSignIn();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error con Google';
      setError(message);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await authSignOut();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cerrar sesión';
      setError(message);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    error,
    clearError,
  };
}
