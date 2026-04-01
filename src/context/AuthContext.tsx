// src/context/AuthContext.tsx
// Contexto global de autenticación.
//
// Internamente usa useAuth() para toda la lógica.
// Expone exactamente la misma interfaz que useAuth() retorna,
// para que App.tsx pueda acceder a: user, session, profile, loading,
// isAuthenticated, signIn, signUp, signInWithGoogle, signOut, error.

import React, { createContext, useContext } from 'react';
import { useAuth, type UseAuthReturn } from '../hooks/useAuth';

// El contexto expone exactamente lo que useAuth() retorna
const AuthContext = createContext<UseAuthReturn | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // useAuth contiene toda la lógica: inicialización, listener, acciones
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}