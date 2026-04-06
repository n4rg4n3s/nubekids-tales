// src/components/auth/SignUpPage.tsx
// Registration page — neobrutalist design

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { TenantConfig } from '../../types';
import LegalLinks from '../LegalLinks';

const INK_BLACK = '#1E293B';

interface SignUpPageProps {
  tenantConfig: TenantConfig;
  onSignUp: (email: string, password: string, displayName: string) => Promise<void>;
  onSwitchToLogin: () => void;
  error: string | null;
  loading?: boolean;
  /** Email pre-rellenado desde query param customer_email (flujo B2B → B2C) */
  initialEmail?: string;
}

export default function SignUpPage({
  tenantConfig,
  onSignUp,
  onSwitchToLogin,
  error,
  loading = false,
  initialEmail,
}: SignUpPageProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const colors = tenantConfig.brandColors;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!displayName.trim()) {
      setLocalError('El nombre es obligatorio');
      return;
    }

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSignUp(email.trim(), password, displayName.trim());
      setSuccess(true);
    } catch {
      // Error handled by parent via error prop
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || loading;
  const displayError = localError || error;

  if (success) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ backgroundColor: colors.background }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div
            className="bg-white rounded-2xl p-8 text-center"
            style={{
              border: `4px solid ${INK_BLACK}`,
              boxShadow: `8px 8px 0px ${INK_BLACK}`,
            }}
          >
            <div className="text-5xl mb-4">✉️</div>
            <h2
              className="text-2xl font-black mb-3"
              style={{ color: colors.primary }}
            >
              ¡Revisa tu email!
            </h2>
            <p
              className="text-sm mb-6"
              style={{ color: `${INK_BLACK}99` }}
            >
              Te hemos enviado un enlace de confirmación a <strong>{email}</strong>.
              Haz clic en el enlace para activar tu cuenta.
            </p>
            <button
              onClick={onSwitchToLogin}
              className="px-6 py-3 rounded-xl font-bold text-base text-white transition-all"
              style={{
                backgroundColor: colors.primary,
                border: `3px solid ${INK_BLACK}`,
                boxShadow: `4px 4px 0px ${INK_BLACK}`,
              }}
            >
              Ir a Iniciar sesión
            </button>
          </div>

          <LegalLinks
            className="mt-5 px-4"
            linkColor={colors.primary}
          />
        </motion.div>
      </div>
    );
  }

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
        <div
          className="bg-white rounded-2xl p-8"
          style={{
            border: `4px solid ${INK_BLACK}`,
            boxShadow: `8px 8px 0px ${INK_BLACK}`,
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">✨</div>
            <h1
              className="text-2xl md:text-3xl font-black"
              style={{
                fontFamily: "'Fredoka', sans-serif",
                color: colors.primary,
              }}
            >
              Crear cuenta
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: `${INK_BLACK}99` }}
            >
              Regístrate para crear cuentos mágicos
            </p>
          </div>

          {/* Banner de conversión B2B → B2C */}
          {initialEmail && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 px-4 py-3 rounded-lg text-sm"
              style={{
                backgroundColor: `${colors.primary}15`,
                border: `2px solid ${colors.primary}40`,
                color: INK_BLACK,
              }}
            >
              🎁 Hemos pre-rellenado tu email. Solo necesitas elegir una contraseña.
            </motion.div>
          )}

          {/* Error */}
          {displayError && (
            <div
              className="mb-6 px-4 py-3 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                border: '2px solid #DC2626',
              }}
            >
              {displayError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: INK_BLACK }}>
                Nombre
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
                required
                disabled={isDisabled}
                className="w-full px-4 py-3 rounded-lg text-base outline-none transition-all disabled:opacity-60"
                style={{ border: `3px solid ${INK_BLACK}`, color: INK_BLACK }}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: INK_BLACK }}>
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
                  // Destacar visualmente si viene pre-rellenado
                  backgroundColor: initialEmail ? `${colors.primary}08` : 'white',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: INK_BLACK }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                disabled={isDisabled}
                className="w-full px-4 py-3 rounded-lg text-base outline-none transition-all disabled:opacity-60"
                style={{ border: `3px solid ${INK_BLACK}`, color: INK_BLACK }}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: INK_BLACK }}>
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
                minLength={6}
                disabled={isDisabled}
                className="w-full px-4 py-3 rounded-lg text-base outline-none transition-all disabled:opacity-60"
                style={{ border: `3px solid ${INK_BLACK}`, color: INK_BLACK }}
              />
            </div>

            <button
              type="submit"
              disabled={isDisabled || !email.trim() || !password.trim() || !displayName.trim()}
              className="w-full px-5 py-3 rounded-xl font-bold text-lg text-white transition-all disabled:opacity-60"
              style={{
                backgroundColor: colors.primary,
                border: `3px solid ${INK_BLACK}`,
                boxShadow: `4px 4px 0px ${INK_BLACK}`,
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translate(2px, 2px)';
                e.currentTarget.style.boxShadow = `2px 2px 0px ${INK_BLACK}`;
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = `4px 4px 0px ${INK_BLACK}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = `4px 4px 0px ${INK_BLACK}`;
              }}
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          {/* Switch to Login */}
          <p className="text-center text-sm mt-6" style={{ color: `${INK_BLACK}99` }}>
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-bold underline transition-colors"
              style={{ color: colors.primary }}
            >
              Inicia sesión
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
