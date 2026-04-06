import { useContext } from 'react';
import type { UseAuthReturn } from '../hooks/useAuth';
import { AuthContext } from './authContextValue';

export function useAuthContext(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext debe usarse dentro de <AuthProvider>');
  }

  return ctx;
}
