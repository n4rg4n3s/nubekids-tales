// src/services/authService.ts
// Authentication service wrapping Supabase Auth singleton

import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, requireSupabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
}

// ============================================================================
// SIGN UP
// ============================================================================

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: User | null }> {
  const client = requireSupabase();

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName },
    },
  });

  if (error) throw error;
  return { user: data.user };
}

// ============================================================================
// SIGN IN
// ============================================================================

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null }> {
  const client = requireSupabase();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return { user: data.user, session: data.session };
}

// ============================================================================
// GOOGLE OAUTH
// ============================================================================

export async function signInWithGoogle(): Promise<void> {
  const client = requireSupabase();

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}

// ============================================================================
// SIGN OUT
// ============================================================================

export async function signOut(): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

// ============================================================================
// SESSION
// ============================================================================

export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data.user;
}

// ============================================================================
// PROFILE (from public.profiles table)
// ============================================================================

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name, avatar_url, tenant_id')
    .eq('id', userId)
    .single();

  if (error) {
    // Profile might not exist yet if trigger hasn't fired
    console.warn('Could not fetch user profile:', error.message);
    return null;
  }

  return {
    id: data.id,
    role: data.role as UserRole,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    tenantId: data.tenant_id,
  };
}

// ============================================================================
// AUTH STATE LISTENER
// ============================================================================

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { unsubscribe: () => void } {
  if (!supabase) {
    return { unsubscribe: () => {} };
  }

  const { data } = supabase.auth.onAuthStateChange(callback);
  return { unsubscribe: () => data.subscription.unsubscribe() };
}
