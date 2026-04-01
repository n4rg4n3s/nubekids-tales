// src/components/auth/AuthCallback.tsx
// Pantalla de "procesando login" que se muestra mientras App.tsx
// espera a que useAuth() detecte el SIGNED_IN del hash OAuth.
//
// No necesita props ni lógica activa:
// - authService.ts limpia el hash en onAuthStateChange(SIGNED_IN)
// - useAuth.ts actualiza isAuthenticated = true
// - App.tsx (useEffect) detecta ese cambio y pasa a 'setup'

export function AuthCallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FDFBF7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        fontFamily: 'Nunito, sans-serif',
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: '64px',
          height: '64px',
          border: '4px solid #E2E8F0',
          borderTopColor: '#8B5CF6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />

      <p style={{ fontSize: '18px', fontWeight: 600, color: '#1E293B', margin: 0 }}>
        Entrando a la magia...
      </p>

      <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
        Verificando tu cuenta
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}