// src/components/auth/AuthCallback.tsx
// OAuth callback handler — loading screen while Supabase processes the redirect

import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface AuthCallbackProps {
  onComplete: () => void;
}

/**
 * Shown after Google OAuth redirect.
 * Supabase client auto-detects the session from the URL hash.
 * The AuthProvider's onAuthStateChange listener will fire SIGNED_IN,
 * and the App.tsx will transition to 'setup'.
 * 
 * This component is just a visual bridge for the brief moment
 * between redirect and session detection.
 */
export default function AuthCallback({ onComplete }: AuthCallbackProps) {
  useEffect(() => {
    // Give Supabase a moment to process the callback
    const timeout = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="text-6xl mb-4 animate-bounce">🔐</div>
        <p className="text-[#8B5CF6] text-xl font-medium">
          Verificando tu cuenta...
        </p>
        <p className="text-[#1E293B]/60 text-sm mt-2">
          Un momento, estamos preparando todo
        </p>
      </motion.div>
    </div>
  );
}
