/**
 * AuthContext.tsx
 * Contexto global de autenticación.
 *
 * FIX (Fase 9 bugfix):
 * - El listener onAuthStateChange detecta SIGNED_IN cuando Supabase
 *   procesa el #access_token= del hash en la URL (flujo OAuth sin Router).
 * - Se limpia el hash de la URL tras autenticarse para no exponerlo.
 * - getSession() al inicio hidrata el estado si ya había sesión activa.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getUserRole, type UserRole } from '../services/authService';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── 1. Hidratar estado con sesión existente ──────────────────
    // Esto también procesa el #access_token= del hash si existe
    // (Supabase lo detecta en getSession cuando hay un hash válido).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        // Limpiar el hash de la URL (no exponer access_token en barra)
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        getUserRole(session.user.id).then(setRole);
      }
      setLoading(false);
    });

    // ── 2. Listener de cambios de auth ───────────────────────────
    // Se dispara con SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] evento:', event);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Limpiar hash si viene de OAuth redirect
          if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          const userRole = await getUserRole(session.user.id);
          setRole(userRole);
        } else {
          setRole(null);
        }

        // Solo marcar loading=false una vez que tengamos la primera respuesta
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // El listener onAuthStateChange disparará SIGNED_OUT automáticamente
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}