/**
 * authService.ts
 * Autenticación con Supabase Auth (email + Google OAuth)
 *
 * FIX (Fase 9 bugfix):
 * - signInWithGoogle usa redirectTo: window.location.origin (NO /auth/callback)
 *   porque la app no tiene React Router. El cliente Supabase procesa
 *   el #access_token del hash automáticamente al cargar la página raíz.
 */

import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'tenant_owner' | 'tenant_member' | 'b2c_user';

export interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
}

// ── Registro con email ──────────────────────────────────────────
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName },
      // Al registrarse via email, Supabase envía un link de confirmación.
      // Cuando el usuario hace clic, Supabase redirige aquí.
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
}

// ── Login con email ─────────────────────────────────────────────
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// ── Login con Google OAuth ──────────────────────────────────────
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // CRÍTICO: Redirigir a la RAÍZ, no a /auth/callback.
      // La app no tiene React Router, así que /auth/callback no existe.
      // El cliente Supabase detecta el #access_token= en el hash
      // automáticamente al cargar cualquier página del origen.
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
}

// ── Obtener rol del usuario ─────────────────────────────────────
export async function getUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle(); // maybeSingle evita error 406 si no existe el perfil aún

  if (error || !data) return 'b2c_user';
  return data.role as UserRole;
}

// ── Logout ──────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── Sesión actual (para inicialización) ────────────────────────
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}