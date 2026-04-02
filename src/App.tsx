// src/App.tsx
// NubeKids - App principal con validación de token y flujo Auth → Setup → Orchestrator → Book

import { useEffect, useState, useCallback } from 'react';
import { validateToken, getTokenFromUrl } from './services/tokenService';
import type { TenantData, TokenData } from './services/tokenService';
import type { TenantConfig, AgentBrief, ComicFace, B2BSession } from './types';
import Setup from './components/Setup';
import type { SetupData } from './components/Setup';
import Book from './components/Book';
import { loadTenantConfig, getTenantIdFromUrl } from './config/tenantLoader';

// Auth
import { useAuthContext } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import SignUpPage from './components/auth/SignUpPage';
import { AuthCallback } from './components/auth/AuthCallback';

// Créditos
import { CreditBalance } from './components/credits/CreditBalance';
// Stripe
import BuyCredits from './components/credits/BuyCredits';
import CreditsSuccess from './components/credits/CreditsSuccess';
import { consumeCredit } from './services/creditService';

// Sistema multiagente
import { agentDeps } from './services/dependencies';
import type { SessionContext } from './services/dependencies';
import { orchestrate } from './services/agents';
import type { OrchestratorResult } from './services/agents';

// Servicio de generación de imágenes
import { generateStoryImage } from './services/imageGenerationService';

// ── FASE 10: Flujo B2B → B2C ────────────────────────────────────────────────
import { parseB2BParams, clearQueryParams } from './services/queryParamsService';
import { loadItemImage } from './utils/itemImageLoader';
import PostStoryActions from './components/PostStoryActions';

// Mock / Dev
import { DEV_CONFIG, isDevMockMode } from './dev';
import { getMockImages } from './dev';

// Estados de la aplicación
type AppState =
  | 'loading'
  | 'auth'
  | 'auth-callback'     // Procesando vuelta de Google OAuth
  | 'setup'
  | 'orchestrating'
  | 'generating'
  | 'reading'
  | 'post-story'        // Fase 10: CTA post-lectura (crear otro, registrarse)
  | 'promo-unavailable' // Fase 10: tenant B2B sin créditos disponibles
  | 'error'
  | 'no-credits'
  | 'credits-success';

// Mensajes aleatorios para el loading
const LOADING_MESSAGES = {
  orchestrating: [
    '📚 Consultando nuestra biblioteca pedagógica...',
    '🧠 Diseñando un arco narrativo único...',
    '✍️ Escribiendo cada página con cariño...',
    '🎨 Preparando las direcciones artísticas...',
  ],
  generating: [
    '🖌️ Pintando las ilustraciones mágicas...',
    '✨ Añadiendo un toque de magia a cada escena...',
    '🌟 Dando vida a los personajes...',
    '🎭 Creando momentos mágicos...',
  ],
};

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);

  // Auth
  const auth = useAuthContext();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [isAnonymousSession, setIsAnonymousSession] = useState(false);

  // Datos del tenant (desde Supabase si hay token antiguo)
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  // Config completa del tenant (desde tenantLoader)
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

  // ── FASE 10: Sesión B2B anónima via ?tenant= ─────────────────────────────
  const [b2bSession, setB2BSession] = useState<B2BSession | null>(null);

  // Datos del setup completado
  const [setupData, setSetupData] = useState<SetupData | null>(null);

  // Resultado del orchestrator
  const [_agentBrief, setAgentBrief] = useState<AgentBrief | null>(null);
  const [_orchestratorTiming, setOrchestratorTiming] = useState<OrchestratorResult['timing'] | null>(null);

  // Páginas generadas para el Book
  const [pages, setPages] = useState<ComicFace[]>([]);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, message: '' });

  // ============================================
  // PROTECCIÓN DE NAVEGACIÓN
  // ============================================
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (appState === 'orchestrating' || appState === 'generating') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [appState]);

  // ============================================
  // FIX OAUTH: Cuando estamos en 'auth-callback' y
  // AuthContext termina de procesar el token, avanzar a 'setup'.
  // ============================================
  useEffect(() => {
    if (appState === 'auth-callback' && !auth.loading && auth.isAuthenticated) {
      console.log('[Auth] OAuth completado, avanzando a setup...');
      setAppState('setup');
    }
  }, [appState, auth.loading, auth.isAuthenticated]);

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  useEffect(() => {
    // Esperar a que AuthContext termine de cargar
    if (auth.loading) return;

    async function initialize() {
      try {
        if (isDevMockMode()) {
          console.log('🎭 MODO DESARROLLO — Datos mock activos — Sin llamadas a Gemini');
        } else {
          console.log('🚀 MODO PRODUCCIÓN — Generación real con Gemini API');
        }

        // ── FIX: Detectar vuelta del flujo OAuth ─────────────────────────────
        const hasOAuthHash = window.location.hash.includes('access_token');
        const isCallbackPath = window.location.pathname === '/auth/callback';

        if (hasOAuthHash || isCallbackPath) {
          console.log('[Auth] Detectado callback OAuth, limpiando URL...');
          window.history.replaceState({}, '', '/');

          if (auth.isAuthenticated) {
            console.log('[Auth] Usuario ya autenticado, avanzando a setup');
            setAppState('setup');
          } else {
            console.log('[Auth] Esperando a que AuthContext procese el token...');
            setAppState('auth-callback');
          }
          return;
        }

        // ── Check for Stripe success redirect ────────────────────────────────
        const urlParams = new URLSearchParams(window.location.search);
        if (window.location.pathname === '/credits/success' || urlParams.get('session_id')) {
          window.history.replaceState({}, '', '/');
          setAppState('credits-success');
          return;
        }

        // ── FASE 10: Modo B2B anónimo via ?tenant= ───────────────────────────
        const b2bParams = parseB2BParams();

        if (b2bParams) {
          console.log('🏪 [B2B] Detectado link de tenant:', b2bParams.tenant);
          clearQueryParams();

          const config = loadTenantConfig(b2bParams.tenant);
          setTenantConfig(config);
          setIsAnonymousSession(true);

          // Verificar si el tenant tiene créditos disponibles
          // (consulta directa para no consumir aún — solo verificar saldo)
          const { supabase } = await import('./lib/supabase');
          if (!supabase) {
            setError('Error de configuración: Base de datos no disponible.');
            setAppState('error');
            return;
          }
          const { data: creditAccount } = await supabase
            .from('credit_accounts')
            .select('balance')
            .eq('tenant_id', b2bParams.tenant)
            .maybeSingle();

          const tenantBalance = creditAccount?.balance ?? 0;

          if (tenantBalance <= 0) {
            console.warn('[B2B] Tenant sin créditos:', b2bParams.tenant);
            setAppState('promo-unavailable');
            return;
          }

          console.log('[B2B] Tenant con saldo:', tenantBalance, 'créditos');

          // Cargar imagen del producto si es plan Premium
          let itemImageBase64: string | undefined;
          let itemImageUrl: string | undefined;

          if (b2bParams.item_image) {
            console.log('[B2B] Descargando imagen del producto...');
            const imageResult = await loadItemImage(b2bParams.item_image);

            if (imageResult.base64) {
              itemImageBase64 = imageResult.base64;
              console.log('[B2B] ✅ Imagen cargada via', imageResult.loadMethod);
            } else if (imageResult.loadMethod === 'url-only') {
              itemImageUrl = imageResult.url;
              console.warn('[B2B] ⚠️ Solo URL disponible — el wizard mostrará la imagen pero no se enviará a Gemini');
            } else {
              console.warn('[B2B] ❌ No se pudo cargar la imagen del producto');
            }
          }

          // Construir sesión B2B
          const session: B2BSession = {
            tenantId: b2bParams.tenant,
            tenantConfig: config,
            itemName: b2bParams.item,
            itemImageBase64,
            itemImageUrl,
            customerEmail: b2bParams.customer_email,
            ref: b2bParams.ref,
            storyGenerated: false,
          };

          setB2BSession(session);

          // Inicializar Gemini
          const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (geminiKey) {
            agentDeps.initialize(geminiKey);
            console.log('🔑 Gemini API inicializada');
          } else if (!isDevMockMode()) {
            setError('Error de configuración: API Key no disponible.');
            setAppState('error');
            return;
          }

          setAppState('setup');
          return;
        }

        // ── Modo B2B con token (sistema antiguo — backward compat) ───────────
        const tokenCode = getTokenFromUrl();

        if (tokenCode) {
          setIsAnonymousSession(true);
          const result = await validateToken(tokenCode);

          if (result.valid && result.tenant && result.token) {
            console.log('🔍 tenantData.tenantId =', result.tenant.tenantId);
            setTenantData(result.tenant);
            setTokenData(result.token);
            const config = loadTenantConfig(result.tenant.tenantId);
            setTenantConfig(config);
          } else {
            setError(result.error || 'Token inválido o expirado');
            setAppState('error');
            return;
          }
        } else {
          // ── Modo B2C directo ────────────────────────────────────────────────
          const tenantId = getTenantIdFromUrl();
          const config = loadTenantConfig(tenantId);
          setTenantConfig(config);

          if (!auth.isAuthenticated) {
            setAppState('auth');
            return;
          }
        }

        // ── Inicializar Gemini con variable de entorno ────────────────────────
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (geminiKey) {
          agentDeps.initialize(geminiKey);
          console.log('🔑 Gemini API inicializada desde variable de entorno');
        } else if (!isDevMockMode()) {
          console.error('❌ VITE_GEMINI_API_KEY no configurada');
          setError('Error de configuración: API Key no disponible. Contacta al administrador.');
          setAppState('error');
          return;
        }

        setAppState('setup');
      } catch (err) {
        console.error('Error inicializando:', err);
        setError('Error al cargar la aplicación');
        setAppState('error');
      }
    }

    initialize();
  }, [auth.loading, auth.isAuthenticated]);

  // Construir SessionContext desde SetupData
  const buildSessionContext = useCallback((data: SetupData, config: TenantConfig): SessionContext => {
    return {
      tenantConfig: config,
      heroName: data.heroName,
      heroDescription: data.heroDescription,
      heroPhoto: data.heroPhoto,
      itemImage: data.itemImage,
      itemDescription: data.itemDescription,
      ageGroup: data.ageGroup,
      language: data.language,
      genre: data.genre,
      pedagogyProfile: data.pedagogy,
    };
  }, []);

  // ============================================
  // GENERACIÓN DE IMÁGENES
  // ============================================
  const generateImages = useCallback(async (
    brief: AgentBrief,
    setupDataRef: SetupData
  ): Promise<ComicFace[]> => {
    const totalPages = brief.storyBeats.length;
    const generatedPages: ComicFace[] = [];

    console.log(`🎨 [App] Generando ${totalPages} imágenes...`);

    for (let i = 0; i < totalPages; i++) {
      const beat = brief.storyBeats[i];
      const visualPrompt = brief.visualDirections[i] || beat.scene;

      setGenerationProgress({
        current: i + 1,
        total: totalPages,
        message: LOADING_MESSAGES.generating[i % LOADING_MESSAGES.generating.length],
      });

      let imageUrl: string;

      if (isDevMockMode()) {
        const mockImages = await getMockImages(totalPages);
        imageUrl = mockImages[i];
        await new Promise(resolve => setTimeout(resolve, DEV_CONFIG.MOCK_IMAGE_DELAY_MS));
      } else {
        console.log(`🎨 [App] Generando imagen ${i + 1}/${totalPages}...`);

        const imageResult = await generateStoryImage(
          {
            visualPrompt,
            heroPhoto: setupDataRef.heroPhoto || undefined,
            itemImage: setupDataRef.itemImage || undefined,
            heroDescription: setupDataRef.heroDescription || undefined,
            pageIndex: i,
          },
          agentDeps
        );

        if (imageResult.success && imageResult.imageBase64) {
          imageUrl = `data:image/png;base64,${imageResult.imageBase64}`;
          console.log(`   ✅ Imagen ${i + 1} generada exitosamente (${imageResult.durationMs}ms)`);
        } else {
          console.error(`   ❌ Error generando imagen ${i + 1}:`, imageResult.error);
          const mockImages = await getMockImages(totalPages);
          imageUrl = mockImages[i];
        }
      }

      generatedPages.push({
        id: `page-${i}`,
        type: 'story',
        imageUrl,
        narrative: beat,
        choices: beat.choices || [],
        isLoading: false,
        pageIndex: i,
      });
    }

    console.log(`🎨 [App] Generación de imágenes completada`);
    return generatedPages;
  }, []);

  // Handler cuando el usuario completa el Setup
  const handleStartAdventure = useCallback(async (data: SetupData) => {
    if (!tenantConfig) {
      setError('Configuración del tenant no disponible');
      setAppState('error');
      return;
    }

    if (!agentDeps.isInitialized) {
      setError('Gemini API no inicializada. Verifica la configuración.');
      setAppState('error');
      return;
    }

    // ── Resolver fuente de crédito ────────────────────────────────────────
    // Prioridad: sesión B2B anónima (Fase 10) > token antiguo > usuario B2C
    const creditTenantId = b2bSession?.tenantId ?? tenantData?.tenantId;
    const creditUserId = auth.user?.id;

    // Verificar y consumir 1 crédito ANTES de generar
    const creditConsumed = await consumeCredit(creditTenantId, creditUserId);
    if (!creditConsumed) {
      setAppState('no-credits');
      return;
    }

    setSetupData(data);
    setAppState('orchestrating');

    try {
      // FASE 1: Orchestrate (RAG + Narrative + Storytelling + Visual Brief)
      const sessionContext = buildSessionContext(data, tenantConfig);
      console.log('🎭 Iniciando orchestración...');

      const orchestratorResult = await orchestrate(sessionContext, agentDeps);

      if (!orchestratorResult.success || !orchestratorResult.agentBrief) {
        throw new Error(orchestratorResult.error || 'Error en orchestración');
      }

      console.log('✅ Orchestración completada');
      setAgentBrief(orchestratorResult.agentBrief);
      setOrchestratorTiming(orchestratorResult.timing);

      // FASE 2: Generar imágenes
      setAppState('generating');
      console.log('🎨 Iniciando generación de imágenes...');

      const generatedPages = await generateImages(orchestratorResult.agentBrief, data);

      // Marcar cuento generado en sesión B2B
      if (b2bSession) {
        setB2BSession(prev => prev ? { ...prev, storyGenerated: true } : null);
      }

      console.log('✅ Generación completada');
      setPages(generatedPages);
      setAppState('reading');

    } catch (err) {
      console.error('Error en generación:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setAppState('error');
    }
  }, [tenantConfig, b2bSession, tenantData, auth.user, buildSessionContext, generateImages]);

  // Reset / "volver al inicio"
  // En sesión B2B anónima tras generar → ir a post-story (CTA de conversión)
  // En cualquier otro caso → reset completo
  const handleReset = useCallback(() => {
    if (b2bSession?.storyGenerated) {
      // El usuario B2B terminó su cuento gratuito → mostrar CTA
      setAppState('post-story');
      return;
    }

    // Reset normal
    setSetupData(null);
    setAgentBrief(null);
    setPages([]);
    setError(null);
    setGenerationProgress({ current: 0, total: 0, message: '' });
    agentDeps.cleanup();
    setAppState('setup');
  }, [b2bSession]);

  // ============================================
  // RENDER: Loading con protección
  // ============================================
  const renderLoadingScreen = (isOrchestrating: boolean) => {
    if (!tenantConfig || !setupData) return null;

    const messages = isOrchestrating ? LOADING_MESSAGES.orchestrating : LOADING_MESSAGES.generating;

    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: tenantConfig.brandColors.background }}
      >
        <div className="text-center p-8 max-w-md">
          <div className="text-7xl mb-6 animate-bounce">
            {isOrchestrating ? '🎭' : '✨'}
          </div>

          <h2
            className="text-2xl font-display font-bold mb-2"
            style={{ color: tenantConfig.brandColors.primary }}
          >
            {isOrchestrating
              ? `Creando la aventura de ${setupData.heroName}...`
              : `Ilustrando la aventura de ${setupData.heroName}...`
            }
          </h2>

          <p className="text-[#1E293B]/80 mb-6 font-body">
            No cierres esta página, te avisaremos cuando esté listo 🌟
          </p>

          {!isOrchestrating && generationProgress.total > 0 && (
            <div className="mb-6">
              <div
                className="w-full h-3 rounded-full overflow-hidden mb-2"
                style={{ backgroundColor: '#e0e0e0' }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${(generationProgress.current / generationProgress.total) * 100}%`,
                    backgroundColor: tenantConfig.brandColors.primary,
                  }}
                />
              </div>
              <p className="text-sm text-[#1E293B]/60">
                Página {generationProgress.current} de {generationProgress.total}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {messages.map((msg, idx) => (
              <p
                key={idx}
                className="text-sm text-[#1E293B]/60 transition-opacity duration-500"
                style={{
                  opacity: isOrchestrating
                    ? 1
                    : (idx <= Math.floor(generationProgress.current / 3) ? 1 : 0.3)
                }}
              >
                {msg}
              </p>
            ))}
          </div>

          <div
            className="mt-8 px-4 py-3 rounded-lg border-2"
            style={{
              backgroundColor: `${tenantConfig.brandColors.primary}10`,
              borderColor: tenantConfig.brandColors.primary,
            }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: tenantConfig.brandColors.primary }}
            >
              🔒 Tu cuento se está creando de forma segura
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER por estado
  // ============================================

  // Banner de desarrollo
  const renderDevBanner = () => {
    if (!isDevMockMode()) return null;
    return (
      <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-center py-1 text-xs font-medium z-50">
        🎭 MODO DESARROLLO — Datos mock activos — Sin llamadas a Gemini
      </div>
    );
  };

  // ── Loading inicial ──────────────────────────────────────────────────────────
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">✨</div>
          <p className="text-[#8B5CF6] text-xl font-medium">Cargando la magia...</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (appState === 'error') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl border-4 border-[#1E293B] shadow-[6px_6px_0px_#1E293B] max-w-md">
          <div className="text-5xl mb-4">😢</div>
          <p className="text-red-500 text-xl mb-4 font-medium">{error}</p>
          <button
            onClick={handleReset}
            className="inline-block px-6 py-3 bg-[#8B5CF6] text-white font-bold rounded-lg border-3 border-[#1E293B] shadow-[3px_3px_0px_#1E293B] hover:shadow-[1px_1px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // ── Promoción no disponible (tenant B2B sin créditos) ────────────────────────
  if (appState === 'promo-unavailable') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border-4 border-[#1E293B] shadow-[6px_6px_0px_#1E293B] max-w-md">
          <div className="text-5xl mb-4">🎁</div>
          <h2 className="text-2xl font-bold text-[#1E293B] mb-3">
            Promoción no disponible
          </h2>
          <p className="text-[#1E293B]/70 mb-6">
            Esta promoción especial ya no está disponible en este momento.
            ¡Pero puedes crear el cuento mágico de tu peque por tu cuenta!
          </p>
          <button
            onClick={() => {
              // Limpiar sesión B2B y entrar como B2C directo
              setB2BSession(null);
              setIsAnonymousSession(false);
              const config = loadTenantConfig(undefined);
              setTenantConfig(config);
              setAppState('auth');
            }}
            className="w-full px-6 py-3 bg-[#8B5CF6] text-white font-bold rounded-lg border-3 border-[#1E293B] shadow-[3px_3px_0px_#1E293B] hover:shadow-[1px_1px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Crear mi cuento — desde 4,99€
          </button>
        </div>
      </div>
    );
  }

  // ── Auth gate (B2C sin login) ────────────────────────────────────────────────
  if (appState === 'auth' && tenantConfig) {
    return (
      <>
        {renderDevBanner()}
        {authView === 'login' ? (
          <LoginPage
            tenantConfig={tenantConfig}
            onLogin={auth.signIn}
            onGoogleLogin={auth.signInWithGoogle}
            onSwitchToSignUp={() => setAuthView('signup')}
            error={auth.error}
          />
        ) : (
          <SignUpPage
            tenantConfig={tenantConfig}
            onSignUp={auth.signUp}
            onSwitchToLogin={() => setAuthView('login')}
            error={auth.error}
            initialEmail={b2bSession?.customerEmail}
          />
        )}
      </>
    );
  }

  // ── OAuth callback ───────────────────────────────────────────────────────────
  if (appState === 'auth-callback') {
    return <AuthCallback />;
  }

  // ── Setup ────────────────────────────────────────────────────────────────────
  if (appState === 'setup' && tenantConfig) {
    return (
      <>
        {renderDevBanner()}
        {(auth.isAuthenticated || isAnonymousSession) && (
          <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
            <CreditBalance
              tenantId={b2bSession?.tenantId ?? tenantData?.tenantId}
              userId={auth.user?.id}
            />
            <span className="text-xs font-medium" style={{ color: '#1E293B99' }}>
              {auth.profile?.displayName || auth.user?.email}
            </span>
            {/* No mostramos botón "Salir" en sesiones anónimas B2B */}
            {auth.isAuthenticated && (
              <button
                onClick={auth.signOut}
                className="px-3 py-1 text-xs font-bold rounded-lg transition-all"
                style={{
                  backgroundColor: 'white',
                  border: '2px solid #1E293B',
                  color: '#1E293B',
                }}
              >
                Salir
              </button>
            )}
          </div>
        )}
        <Setup
          tenantConfig={tenantConfig}
          initialItemModel={b2bSession?.itemName ?? tokenData?.itemName ?? ''}
          initialItemImage={b2bSession?.itemImageBase64}
          initialItemImageUrl={b2bSession?.itemImageUrl}
          onComplete={handleStartAdventure}
        />
      </>
    );
  }

  // ── Orchestrating ────────────────────────────────────────────────────────────
  if (appState === 'orchestrating') {
    return (
      <>
        {renderDevBanner()}
        {renderLoadingScreen(true)}
      </>
    );
  }

  // ── Generating ───────────────────────────────────────────────────────────────
  if (appState === 'generating') {
    return (
      <>
        {renderDevBanner()}
        {renderLoadingScreen(false)}
      </>
    );
  }

  // ── Reading ──────────────────────────────────────────────────────────────────
  if (appState === 'reading' && tenantConfig && setupData && pages.length > 0) {
    return (
      <>
        {renderDevBanner()}
        <Book
          pages={pages}
          tenantConfig={tenantConfig}
          heroName={setupData.heroName}
          onReset={handleReset}
        />
      </>
    );
  }

  // ── Post-story (Fase 10: CTA de conversión B2B → B2C) ───────────────────────
  if (appState === 'post-story' && tenantConfig && setupData) {
    return (
      <>
        {renderDevBanner()}
        <PostStoryActions
          heroName={setupData.heroName}
          tenantConfig={tenantConfig}
          customerEmail={b2bSession?.customerEmail}
          onCreateAnother={() => {
            setAuthView('signup');
            setAppState('auth');
          }}
          onBackToStory={() => setAppState('reading')}
        />
      </>
    );
  }

  // ── Sin créditos ─────────────────────────────────────────────────────────────
  if (appState === 'no-credits' && tenantConfig) {
    const channel = b2bSession
      ? (b2bSession.tenantConfig.integrationLevel === 'premium' ? 'b2b_premium' : 'b2b_standard')
      : tenantData
        ? (tenantData.integrationLevel === 'premium' ? 'b2b_premium' : 'b2b_standard')
        : 'b2c';

    return (
      <>
        {renderDevBanner()}
        <BuyCredits
          channel={channel}
          userId={auth.user?.id}
          tenantId={b2bSession?.tenantId ?? tenantData?.tenantId}
          onClose={() => setAppState('setup')}
        />
      </>
    );
  }

  // ── Stripe success ───────────────────────────────────────────────────────────
  if (appState === 'credits-success') {
    return (
      <CreditsSuccess
        onContinue={() => setAppState('setup')}
      />
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <p className="text-[#1E293B]">Estado desconocido</p>
    </div>
  );
}

export default App;