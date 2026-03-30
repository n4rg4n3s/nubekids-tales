/**
 * Supabase Client Singleton
 * 
 * IMPORTANTE: Este es el ÚNICO lugar donde se debe crear el cliente de Supabase.
 * Todos los demás archivos deben importar desde aquí para evitar el warning
 * "Multiple GoTrueClient instances detected".
 * 
 * Uso:
 * import { supabase } from '@/lib/supabase';
 * 
 * El cliente es null si las variables de entorno no están configuradas.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// VARIABLES DE ENTORNO
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ============================================================================
// CLIENTE SINGLETON
// ============================================================================

/**
 * Cliente de Supabase singleton.
 * Null si las variables de entorno no están configuradas.
 */
export const supabase: SupabaseClient | null =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
            },
        })
        : null;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verifica si Supabase está configurado correctamente.
 */
export function isSupabaseConfigured(): boolean {
    return supabase !== null;
}

/**
 * Lanza error si Supabase no está configurado.
 * Útil para funciones que requieren Supabase obligatoriamente.
 */
export function requireSupabase(): SupabaseClient {
    if (!supabase) {
        throw new Error(
            'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
        );
    }
    return supabase;
}

/**
 * Log de configuración (solo en desarrollo)
 */
if (import.meta.env.DEV) {
    if (supabase) {
        console.log('✅ Supabase client initialized');
    } else {
        console.warn('⚠️ Supabase client not configured (missing env vars)');
    }
}