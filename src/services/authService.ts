// src/services/authService.ts
// Autenticación con Supabase Auth (email + Google OAuth)
//
// Exports requeridos por useAuth.ts:
//   getCurrentSession, getCurrentUser, getUserProfile,
//   signInWithEmail, signUpWithEmail, signInWithGoogle,
//   signOut, onAuthStateChange
//
// FIX OAuth: signInWithGoogle usa redirectTo: window.location.origin
// (sin /auth/callback) porque la app no tiene React Router.
// Supabase devuelve el token en el hash (#access_token=...) y el
// cliente lo procesa automáticamente al cargar la página raíz.

import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

export type UserRole = 'admin' | 'tenant_owner' | 'tenant_member' | 'b2c_user';

// ── Sesión y usuario actuales ───────────────────────────────────────────────

export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// ── Perfil del usuario (tabla profiles) ────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name, avatar_url, tenant_id, created_at')
    .eq('id', userId)
    .maybeSingle(); // maybeSingle evita error 406 si no existe el perfil aún

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    role: data.role as UserRole,
    displayName: data.display_name ?? '',
    avatarUrl: data.avatar_url ?? null,
    tenantId: data.tenant_id ?? null,
    createdAt: data.created_at,
  };
}

// ── Rol del usuario ─────────────────────────────────────────────────────────

export async function getUserRole(userId: string): Promise<UserRole> {
  const profile = await getUserProfile(userId);
  return (profile?.role as UserRole) ?? 'b2c_user';
}

// ── Registro con email ──────────────────────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName },
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
}

// ── Login con email ─────────────────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// ── Login con Google OAuth ──────────────────────────────────────────────────

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // CRÍTICO: redirigir a la RAÍZ, no a /auth/callback.
      // La app usa state machine sin React Router.
      // App.tsx detecta window.location.hash.includes('access_token')
      // y activa el estado 'auth-callback'.
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
}

// ── Logout ──────────────────────────────────────────────────────────────────

export async function signOut() {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── Listener de cambios de auth ─────────────────────────────────────────────
// Devuelve { unsubscribe } para que useAuth.ts pueda limpiar en el return del useEffect

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): { unsubscribe: () => void } {
  if (!supabase) {
    return { unsubscribe: () => { } };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      // Limpiar el hash OAuth de la URL para no exponer el token
      if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      callback(event, session);
    }
  );

  return { unsubscribe: () => subscription.unsubscribe() };
}