// src/components/auth/LoginPage.tsx
// Login page with email/password + Google OAuth — neobrutalist design

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { TenantConfig } from '../../types';
import LegalLinks from '../LegalLinks';

const INK_BLACK = '#1E293B';

interface LoginPageProps {
  tenantConfig: TenantConfig;
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onSwitchToSignUp: () => void;
  error: string | null;
  loading?: boolean;
}

export default function LoginPage({
  tenantConfig,
  onLogin,
  onGoogleLogin,
  onSwitchToSignUp,
  error,
  loading = false,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = tenantConfig.brandColors;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setIsSubmitting(true);
    try {
      await onGoogleLogin();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || loading;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: colors.background }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div
          className="bg-white rounded-2xl p-8"
          style={{
            border: `4px solid ${INK_BLACK}`,
            boxShadow: `8px 8px 0px ${INK_BLACK}`,
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">📚</div>
            <h1
              className="text-2xl md:text-3xl font-black"
              style={{
                fontFamily: "'Fredoka', sans-serif",
                color: colors.primary,
              }}
            >
              {tenantConfig.tenantName}
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: `${INK_BLACK}99` }}
            >
              Inicia sesión para crear cuentos mágicos
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                border: '2px solid #DC2626',
              }}
            >
              {error}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleClick}
            disabled={isDisabled}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl font-bold text-base transition-all disabled:opacity-60"
            style={{
              backgroundColor: 'white',
              border: `3px solid ${INK_BLACK}`,
              boxShadow: `4px 4px 0px ${INK_BLACK}`,
              color: INK_BLACK,
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'translate(2px, 2px)';
              target.style.boxShadow = `2px 2px 0px ${INK_BLACK}`;
            }}
            onMouseUp={(e) => {
              const target = e.currentTarget;
              target.style.transform = '';
              target.style.boxShadow = `4px 4px 0px ${INK_BLACK}`;
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              target.style.transform = '';
              target.style.boxShadow = `4px 4px 0px ${INK_BLACK}`;
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Iniciar sesión con Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: `${INK_BLACK}20` }} />
            <span className="text-xs font-medium" style={{ color: `${INK_BLACK}60` }}>
              o con email
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: `${INK_BLACK}20` }} />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-bold mb-1.5"
                style={{ color: INK_BLACK }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={isDisabled}
                className="w-full px-4 py-3 rounded-lg text-base outline-none transition-all disabled:opacity-60"
                style={{
                  border: `3px solid ${INK_BLACK}`,
                  color: INK_BLACK,
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-bold mb-1.5"
                style={{ color: INK_BLACK }}
              >
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={isDisabled}
                className="w-full px-4 py-3 rounded-lg text-base outline-none transition-all disabled:opacity-60"
                style={{
                  border: `3px solid ${INK_BLACK}`,
                  color: INK_BLACK,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isDisabled || !email.trim() || !password.trim()}
              className="w-full px-5 py-3 rounded-xl font-bold text-lg text-white transition-all disabled:opacity-60"
              style={{
                backgroundColor: colors.primary,
                border: `3px solid ${INK_BLACK}`,
                boxShadow: `4px 4px 0px ${INK_BLACK}`,
              }}
              onMouseDown={(e) => {
                const target = e.currentTarget;
                target.style.transform = 'translate(2px, 2px)';
                target.style.boxShadow = `2px 2px 0px ${INK_BLACK}`;
              }}
              onMouseUp={(e) => {
                const target = e.currentTarget;
                target.style.transform = '';
                target.style.boxShadow = `4px 4px 0px ${INK_BLACK}`;
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget;
                target.style.transform = '';
                target.style.boxShadow = `4px 4px 0px ${INK_BLACK}`;
              }}
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Switch to Sign Up */}
          <p
            className="text-center text-sm mt-6"
            style={{ color: `${INK_BLACK}99` }}
          >
            ¿No tienes cuenta?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="font-bold underline transition-colors"
              style={{ color: colors.primary }}
            >
              Regístrate gratis
            </button>
          </p>
        </div>

        <LegalLinks
          className="mt-5 px-4"
          linkColor={colors.primary}
        />
      </motion.div>
    </div>
  );
}
