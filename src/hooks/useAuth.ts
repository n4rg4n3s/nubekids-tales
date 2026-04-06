// src/hooks/useAuth.ts
// React hook for authentication state management

import { useState, useEffect, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

type AuthServiceModule = typeof import('../services/authService');

let authServicePromise: Promise<AuthServiceModule> | null = null;

function loadAuthService(): Promise<AuthServiceModule> {
  if (!authServicePromise) {
    authServicePromise = import('../services/authService');
  }

  return authServicePromise;
}

function hasSupabaseConfig(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

function shouldBootstrapAuthOnLoad(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const hasTokenFlow = params.has('token');
  const hasB2BDemoFlow = params.get('demo') === '1' && params.has('tenant');
  const hasOAuthHash = window.location.hash.includes('access_token');
  const isCallbackPath = window.location.pathname === '/auth/callback';

  if (hasOAuthHash || isCallbackPath) {
    return true;
  }

  return !hasTokenFlow && !hasB2BDemoFlow;
}

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  ensureInitialized: () => Promise<void>;
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
  const initializedRef = useRef(false);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const mountedRef = useRef(false);

  const fetchProfile = useCallback(async (
    userId: string,
    authService?: AuthServiceModule
  ) => {
    try {
      const service = authService ?? await loadAuthService();
      const userProfile = await service.getUserProfile(userId);
      setProfile(userProfile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    }
  }, []);

  const ensureInitialized = useCallback(async () => {
    if (!hasSupabaseConfig()) {
      setLoading(false);
      return;
    }

    if (initializedRef.current) {
      return;
    }

    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    initPromiseRef.current = (async () => {
      const authService = await loadAuthService();

      try {
        if (mountedRef.current) {
          setLoading(true);
        }

        const [currentSession, currentUser] = await Promise.all([
          authService.getCurrentSession().catch(() => null),
          authService.getCurrentUser().catch(() => null),
        ]);

        if (!mountedRef.current) return;

        setSession(currentSession);
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id, authService).catch(() => null);
        } else {
          setProfile(null);
        }

        if (!subscriptionRef.current) {
          subscriptionRef.current = await authService.onAuthStateChange(async (event, newSession) => {
            if (!mountedRef.current) return;

            setSession(newSession);
            const nextUser = newSession?.user ?? null;
            setUser(nextUser);

            if (nextUser) {
              await fetchProfile(nextUser.id, authService);
            } else {
              setProfile(null);
            }

            if (event === 'SIGNED_OUT') {
              setUser(null);
              setSession(null);
              setProfile(null);
            }
          });
        }

        initializedRef.current = true;
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        initPromiseRef.current = null;
      }
    })();

    return initPromiseRef.current;
  }, [fetchProfile]);

  useEffect(() => {
    mountedRef.current = true;

    if (!hasSupabaseConfig()) {
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    if (shouldBootstrapAuthOnLoad()) {
      void ensureInitialized();
    } else {
      setLoading(false);
    }

    return () => {
      mountedRef.current = false;
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [ensureInitialized]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await ensureInitialized();
      const authService = await loadAuthService();
      await authService.signInWithEmail(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
      throw err;
    }
  }, [ensureInitialized]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setError(null);
    try {
      await ensureInitialized();
      const authService = await loadAuthService();
      await authService.signUpWithEmail(email, password, displayName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la cuenta';
      setError(message);
      throw err;
    }
  }, [ensureInitialized]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await ensureInitialized();
      const authService = await loadAuthService();
      await authService.signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error con Google';
      setError(message);
      throw err;
    }
  }, [ensureInitialized]);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await ensureInitialized();
      const authService = await loadAuthService();
      await authService.signOut();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cerrar sesión';
      setError(message);
      throw err;
    }
  }, [ensureInitialized]);

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    session,
    profile,
    loading,
    ensureInitialized,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    error,
    clearError,
  };
}
