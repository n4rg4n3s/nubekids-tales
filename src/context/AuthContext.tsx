// src/context/AuthContext.tsx
// Contexto global de autenticación.
//
// Internamente usa useAuth() para toda la lógica.
// Expone exactamente la misma interfaz que useAuth() retorna,
// para que App.tsx pueda acceder a: user, session, profile, loading,
// isAuthenticated, signIn, signUp, signInWithGoogle, signOut, error.

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthContext } from './authContextValue';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // useAuth contiene toda la lógica: inicialización, listener, acciones
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
