import { createContext } from 'react';
import type { UseAuthReturn } from '../hooks/useAuth';

export const AuthContext = createContext<UseAuthReturn | null>(null);
