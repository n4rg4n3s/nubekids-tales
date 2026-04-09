// src/App.tsx
// NubeKids - App principal con validación de token y flujo Auth → Setup → Orchestrator → Book

import { useEffect, useState, useCallback, Suspense, lazy, startTransition } from 'react';
import type { TenantData, TokenData } from './services/tokenService';
import type { TenantConfig, AgentBrief, ComicFace, B2BSession } from './types';
import type { SetupData } from './components/Setup';
import { DEV_CONFIG, isDevMockMode } from './dev/mockConfig';
import { buildFinalPageTrace, saveExpertTrace } from './dev/expertTrace';
import type { ExpertPipelineTrace } from './dev/expertTrace';

// Auth
import { useAuthContext } from './context/useAuthContext';

// Sistema multiagente
import type { SessionContext } from './services/dependencies';
import type { OrchestratorResult } from './services/agents';

const Setup = lazy(() => import('./components/Setup'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const SignUpPage = lazy(() => import('./components/auth/SignUpPage'));
const Book = lazy(() => import('./components/Book'));
const PostStoryActions = lazy(() => import('./components/PostStoryActions'));
const BuyCredits = lazy(() => import('./components/credits/BuyCredits'));
const BuyCreditsB2B = lazy(() => import('./components/credits/BuyCreditsB2B'));
const CreditsSuccess = lazy(() => import('./components/credits/CreditsSuccess'));
const CreditBalance = lazy(() =>
  import('./components/credits/CreditBalance').then((module) => ({
    default: module.CreditBalance,
  }))
);
const AuthCallback = lazy(() =>
  import('./components/auth/AuthCallback').then((module) => ({
    default: module.AuthCallback,
  }))
);

type GenerationModules = {
  agentDeps: (typeof import('./services/dependencies'))['agentDeps'];
  orchestrate: (typeof import('./services/agents'))['orchestrate'];
  generateStoryImage: (typeof import('./services/imageGenerationService'))['generateStoryImage'];
};

type TokenServiceModule = typeof import('./services/tokenService');
type CreditServiceModule = typeof import('./services/creditService');
type TenantLoaderModule = typeof import('./config/tenantLoader');
type QueryParamsServiceModule = typeof import('./services/queryParamsService');
type ItemImageLoaderModule = typeof import('./utils/itemImageLoader');
type MockBriefModule = Pick<typeof import('./dev/mockAgentBrief'), 'getMockBrief'>;
type MockImagesModule = Pick<typeof import('./dev/mockImages'), 'getMockImages'>;

let generationModulesPromise: Promise<GenerationModules> | null = null;
let tokenServicePromise: Promise<TokenServiceModule> | null = null;
let creditServicePromise: Promise<CreditServiceModule> | null = null;
let supabaseModulePromise: Promise<typeof import('./lib/supabase')> | null = null;
let tenantLoaderPromise: Promise<TenantLoaderModule> | null = null;
let queryParamsServicePromise: Promise<QueryParamsServiceModule> | null = null;
let itemImageLoaderPromise: Promise<ItemImageLoaderModule> | null = null;
let mockBriefModulePromise: Promise<MockBriefModule> | null = null;
let mockImagesModulePromise: Promise<MockImagesModule> | null = null;

function loadGenerationModules(): Promise<GenerationModules> {
  if (!generationModulesPromise) {
    generationModulesPromise = Promise.all([
      import('./services/dependencies'),
      import('./services/agents'),
      import('./services/imageGenerationService'),
    ]).then(([dependenciesModule, agentsModule, imageModule]) => ({
      agentDeps: dependenciesModule.agentDeps,
      orchestrate: agentsModule.orchestrate,
      generateStoryImage: imageModule.generateStoryImage,
    }));
  }

  return generationModulesPromise;
}

function loadTokenService(): Promise<TokenServiceModule> {
  if (!tokenServicePromise) {
    tokenServicePromise = import('./services/tokenService');
  }

  return tokenServicePromise;
}

function loadCreditService(): Promise<CreditServiceModule> {
  if (!creditServicePromise) {
    creditServicePromise = import('./services/creditService');
  }

  return creditServicePromise;
}

function loadSupabaseModule(): Promise<typeof import('./lib/supabase')> {
  if (!supabaseModulePromise) {
    supabaseModulePromise = import('./lib/supabase');
  }

  return supabaseModulePromise;
}

function loadTenantLoader(): Promise<TenantLoaderModule> {
  if (!tenantLoaderPromise) {
    tenantLoaderPromise = import('./config/tenantLoader');
  }

  return tenantLoaderPromise;
}

function loadQueryParamsService(): Promise<QueryParamsServiceModule> {
  if (!queryParamsServicePromise) {
    queryParamsServicePromise = import('./services/queryParamsService');
  }

  return queryParamsServicePromise;
}

function loadItemImageLoader(): Promise<ItemImageLoaderModule> {
  if (!itemImageLoaderPromise) {
    itemImageLoaderPromise = import('./utils/itemImageLoader');
  }

  return itemImageLoaderPromise;
}

function loadMockBriefModule(): Promise<MockBriefModule> {
  if (!mockBriefModulePromise) {
    mockBriefModulePromise = import('./dev/mockAgentBrief').then(({ getMockBrief }) => ({
      getMockBrief,
    }));
  }

  return mockBriefModulePromise;
}

function loadMockImagesModule(): Promise<MockImagesModule> {
  if (!mockImagesModulePromise) {
    mockImagesModulePromise = import('./dev/mockImages').then(({ getMockImages }) => ({
      getMockImages,
    }));
  }

  return mockImagesModulePromise;
}

function getTokenCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('token');
}

function ChunkFallback() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">✨</div>
        <p className="text-[#8B5CF6] text-lg font-medium">Cargando módulo...</p>
      </div>
    </div>
  );
}

function formatGenerationError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('monthly spending cap') ||
    message.includes('"code":429')
  ) {
    return 'La validación en modo real está bloqueada por cuota de Gemini/AI Studio agotada (429 RESOURCE_EXHAUSTED). No es un fallo del pipeline: hay que reactivar o ampliar el gasto del proyecto antes de seguir.';
  }

  return message;
}

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
  | 'credits-success'
  | 'buy-credits-b2b';

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
  const { ensureInitialized } = auth;
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [isAnonymousSession, setIsAnonymousSession] = useState(false);

  // Datos del tenant (desde Supabase si hay token B2B one-time)
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  // Config completa del tenant.
  // - Demo/B2C local: tenantLoader
  // - B2B real por token: adaptador desde datos reales del tenant
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

  // ── Sesión B2B demo/testing via ?tenant=...&demo=1 ──────────────────────
  const [b2bSession, setB2BSession] = useState<B2BSession | null>(null);

  // Datos del setup completado
  const [setupData, setSetupData] = useState<SetupData | null>(null);

  // Resultado del orchestrator
  const [, setAgentBrief] = useState<AgentBrief | null>(null);
  const [, setOrchestratorTiming] = useState<OrchestratorResult['timing'] | null>(null);

  // Páginas generadas para el Book
  const [pages, setPages] = useState<ComicFace[]>([]);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, message: '' });

  const getB2BStandalonePlan = (): 'standard' | 'premium' => {
    if (typeof window === 'undefined') return 'standard';
    const plan = new URLSearchParams(window.location.search).get('plan');
    return plan === 'premium' ? 'premium' : 'standard';
  };

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

  useEffect(() => {
    if (appState === 'auth' || appState === 'auth-callback') {
      void ensureInitialized();
    }
  }, [appState, ensureInitialized]);

  useEffect(() => {
    if (appState === 'auth' && !auth.loading && auth.isAuthenticated) {
      setAppState('setup');
    }
  }, [appState, auth.loading, auth.isAuthenticated]);

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  useEffect(() => {
    if (appState !== 'loading') {
      return;
    }

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

        // ── Pantalla dedicada de packs B2B ──────────────────────────────────
        if (window.location.pathname === '/buy-credits-b2b') {
          setAppState('buy-credits-b2b');
          return;
        }

        // ── Modo B2B real via ?token=... (one-time) ─────────────────────────
        const tokenCode = getTokenCodeFromUrl();

        if (tokenCode) {
          setIsAnonymousSession(true);
          const tokenService = await loadTokenService();
          const result = await tokenService.validateToken(tokenCode);

          if (result.valid && result.tenant && result.token && result.tenantConfig) {
            console.log('🔐 [B2B] Token one-time válido para tenant:', result.tenant.tenantId);
            setTenantData(result.tenant);
            setTokenData(result.token);
            setTenantConfig(result.tenantConfig);
          } else {
            if (result.code === 'no_credits') {
              setAppState('promo-unavailable');
              return;
            }

            setError(result.error || 'Token inválido o expirado');
            setAppState('error');
            return;
          }
        } else {
          // ── FASE 10: Modo B2B demo/testing via ?tenant=...&demo=1 ─────────
          const queryParamsService = await loadQueryParamsService();
          const b2bParams = queryParamsService.parseB2BParams();

          if (b2bParams) {
            console.log('🧪 [B2B Demo] Detectado link demo de tenant:', b2bParams.tenant);
            queryParamsService.clearQueryParams();

            const tenantLoader = await loadTenantLoader();
            const config = tenantLoader.loadTenantConfig(b2bParams.tenant);
            setTenantConfig(config);
            setIsAnonymousSession(true);

            // Verificar si el tenant tiene créditos disponibles
            // (consulta directa para no consumir aún — solo verificar saldo)
            const { supabase } = await loadSupabaseModule();
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
              const itemImageLoader = await loadItemImageLoader();
              const imageResult = await itemImageLoader.loadItemImage(b2bParams.item_image);

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

            setAppState('setup');
            return;
          }
        }

        // ── Modo B2C directo ────────────────────────────────────────────────
        if (!tokenCode) {
          const tenantLoader = await loadTenantLoader();
          const tenantId = tenantLoader.getTenantIdFromUrl();
          const config = tenantLoader.loadTenantConfig(tenantId);
          setTenantConfig(config);

          if (!auth.isAuthenticated) {
            setAppState('auth');
            return;
          }
        }

        // ── Validar configuración de Gemini sin cargar aún la pila de generación ──
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!geminiKey && !isDevMockMode()) {
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
  }, [appState, auth.loading, auth.isAuthenticated]);

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
    const isMockMode = isDevMockMode();
    const generationModules = !isMockMode ? await loadGenerationModules() : null;
    let fallbackImagesPromise: Promise<string[]> | null = null;

    const getFallbackImages = async () => {
      if (!fallbackImagesPromise) {
        const mockImagesModule = await loadMockImagesModule();
        fallbackImagesPromise = mockImagesModule.getMockImages(totalPages);
      }
      return fallbackImagesPromise;
    };

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

      if (isMockMode) {
        const mockImages = await getFallbackImages();
        imageUrl = mockImages[i];
        await new Promise(resolve => setTimeout(resolve, DEV_CONFIG.MOCK_IMAGE_DELAY_MS));
      } else {
        console.log(`🎨 [App] Generando imagen ${i + 1}/${totalPages}...`);

        const imageResult = await generationModules!.generateStoryImage(
          {
            visualPrompt,
            heroPhoto: setupDataRef.heroPhoto || undefined,
            itemImage: setupDataRef.itemImage || undefined,
            heroDescription: setupDataRef.heroDescription || undefined,
            pageIndex: i,
          },
          generationModules!.agentDeps
        );

        if (imageResult.success && imageResult.imageBase64) {
          imageUrl = `data:image/png;base64,${imageResult.imageBase64}`;
          console.log(`   ✅ Imagen ${i + 1} generada exitosamente (${imageResult.durationMs}ms)`);
        } else {
          console.error(`   ❌ Error generando imagen ${i + 1}:`, imageResult.error);
          const mockImages = await getFallbackImages();
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

    const isMockMode = isDevMockMode();
    const generationModules = !isMockMode ? await loadGenerationModules() : null;
    const mockBriefModule = isMockMode ? await loadMockBriefModule() : null;
    if (generationModules && !generationModules.agentDeps.isInitialized) {
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiKey) {
        setError('Gemini API no inicializada. Verifica la configuración.');
        setAppState('error');
        return;
      }

      await generationModules.agentDeps.initialize(geminiKey);
      console.log('🔑 Gemini API inicializada bajo demanda');
    }

    // ── Resolver fuente de crédito ────────────────────────────────────────
    // Prioridad: token B2B one-time > sesión demo B2B > usuario B2C
    if (tokenData?.token) {
      const tokenService = await loadTokenService();
      const tokenConsumption = await tokenService.consumeB2BToken(tokenData.token);
      if (!tokenConsumption.success) {
        if (tokenConsumption.code === 'no_credits') {
          setAppState('promo-unavailable');
          return;
        }

        setError(tokenConsumption.error || 'No se pudo validar el enlace de esta promoción');
        setAppState('error');
        return;
      }
    } else {
      const creditTenantId = b2bSession?.tenantId;
      const creditUserId = auth.user?.id;
      const creditService = await loadCreditService();
      const creditConsumed = await creditService.consumeCredit(creditTenantId, creditUserId);
      if (!creditConsumed) {
        setAppState('no-credits');
        return;
      }
    }

    setSetupData(data);
    setAppState('orchestrating');

    try {
      let currentDebugTrace: ExpertPipelineTrace | null = null;

      // FASE 1: Orchestrate (RAG + Narrative + Storytelling + Visual Brief)
      const sessionContext = buildSessionContext(data, tenantConfig);
      console.log('🎭 Iniciando orchestración...');

      const orchestratorResult: OrchestratorResult = isMockMode
        ? {
            success: true,
            agentBrief: mockBriefModule!.getMockBrief(10),
            timing: {
              ragMs: 0,
              narrativeMs: 0,
              storytellingMs: 0,
              visualBriefMs: 0,
              totalMs: 0,
            },
          }
        : await generationModules!.orchestrate(sessionContext, generationModules!.agentDeps);

      currentDebugTrace = orchestratorResult.debugTrace ?? null;

      if (import.meta.env.DEV && currentDebugTrace) {
        saveExpertTrace({
          ...currentDebugTrace,
          createdAt: new Date().toISOString(),
          mode: isMockMode ? 'mock' : currentDebugTrace.mode,
        });
      }

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

      if (import.meta.env.DEV && orchestratorResult.debugTrace) {
        saveExpertTrace({
          ...orchestratorResult.debugTrace,
          createdAt: new Date().toISOString(),
          mode: isMockMode ? 'mock' : 'real',
          status: 'success',
          finalPages: buildFinalPageTrace(generatedPages),
        });
      }

      // Marcar cuento generado en sesión B2B
      if (b2bSession) {
        setB2BSession(prev => prev ? { ...prev, storyGenerated: true } : null);
      }
      if (tokenData) {
        setTokenData(prev => prev ? { ...prev, isUsed: true } : null);
      }

      console.log('✅ Generación completada');
      startTransition(() => {
        setPages(generatedPages);
        setAppState('reading');
      });

    } catch (err) {
      console.error('Error en generación:', err);
      setError(formatGenerationError(err));
      setAppState('error');
    }
  }, [tenantConfig, b2bSession, tokenData, auth.user, buildSessionContext, generateImages]);

  // Reset / "volver al inicio"
  // En sesión B2B anónima tras generar → ir a post-story (CTA de conversión)
  // En cualquier otro caso → reset completo
  const handleReset = useCallback((source: string = 'unknown') => {
    console.warn('[App] handleReset invoked', {
      source,
      appState,
      hasB2BStory: Boolean(b2bSession?.storyGenerated),
      tokenUsed: Boolean(tokenData?.isUsed),
      pages: pages.length,
      hasSetupData: Boolean(setupData),
    });

    if (b2bSession?.storyGenerated || tokenData?.isUsed) {
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
    if (generationModulesPromise) {
      void generationModulesPromise.then(({ agentDeps }) => {
        agentDeps.cleanup();
      });
    }
    setAppState('setup');
  }, [appState, b2bSession, tokenData, pages.length, setupData]);

  // ============================================
  // RENDER: Loading con protección
  // ============================================
  const renderLoadingScreen = (isOrchestrating: boolean) => {
    if (!tenantConfig || !setupData) return null;

    const messages = isOrchestrating ? LOADING_MESSAGES.orchestrating : LOADING_MESSAGES.generating;

    return (
      <div
        className="fixed inset-0 z-40 flex w-full items-center justify-center overflow-y-auto px-4 py-6 sm:px-6"
        style={{
          minHeight: '100dvh',
          backgroundColor: tenantConfig.brandColors.background,
        }}
      >
        <div className="w-full max-w-md shrink-0 text-center p-8 sm:p-10">
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

          <p className="mb-6 flex items-center justify-center gap-2 font-body font-semibold text-red-600">
            <span aria-hidden="true">⚠️</span>
            <span>No cierres esta página, te avisaremos cuando esté listo</span>
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
            onClick={() => handleReset('error-screen-button')}
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
              setTokenData(null);
              setTenantData(null);
              setIsAnonymousSession(false);
              void loadTenantLoader().then((tenantLoader) => {
                const config = tenantLoader.loadTenantConfig(undefined);
                setTenantConfig(config);
                setAppState('auth');
              });
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
        <Suspense fallback={<ChunkFallback />}>
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
              initialEmail={b2bSession?.customerEmail ?? tokenData?.customerEmail}
            />
          )}
        </Suspense>
      </>
    );
  }

  // ── OAuth callback ───────────────────────────────────────────────────────────
  if (appState === 'auth-callback') {
    return (
      <Suspense fallback={<ChunkFallback />}>
        <AuthCallback />
      </Suspense>
    );
  }

  // ── Setup ────────────────────────────────────────────────────────────────────
  if (appState === 'setup' && tenantConfig) {
    return (
      <>
        {renderDevBanner()}
        {(auth.isAuthenticated || isAnonymousSession) && (
          <div className="fixed top-3 left-3 right-3 z-40 flex items-start justify-between gap-2 md:top-4 md:left-auto md:right-4 md:justify-end">
            <Suspense fallback={null}>
              <CreditBalance
                tenantId={b2bSession?.tenantId ?? tenantData?.tenantId}
                userId={auth.user?.id}
              />
            </Suspense>
            <div className="flex items-center gap-2 ml-auto">
              <span className="hidden md:block text-xs font-medium" style={{ color: '#1E293B99' }}>
                {auth.profile?.displayName || auth.user?.email}
              </span>
              {/* No mostramos botón "Salir" en sesiones anónimas B2B */}
              {auth.isAuthenticated && (
                <button
                  onClick={auth.signOut}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
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
          </div>
        )}
        <Suspense fallback={<ChunkFallback />}>
          <Setup
            tenantConfig={tenantConfig}
            initialItemModel={b2bSession?.itemName ?? tokenData?.itemName ?? ''}
            initialItemImage={b2bSession?.itemImageBase64}
            initialItemImageUrl={b2bSession?.itemImageUrl}
            onComplete={handleStartAdventure}
          />
        </Suspense>
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
        <Suspense fallback={<ChunkFallback />}>
          <Book
            pages={pages}
            tenantConfig={tenantConfig}
            heroName={setupData.heroName}
            ageGroup={setupData.ageGroup}
            onReset={handleReset}
          />
        </Suspense>
      </>
    );
  }

  // ── Post-story (Fase 10: CTA de conversión B2B → B2C) ───────────────────────
  if (appState === 'post-story' && tenantConfig && setupData) {
    return (
      <>
        {renderDevBanner()}
        <Suspense fallback={<ChunkFallback />}>
          <PostStoryActions
            heroName={setupData.heroName}
            tenantConfig={tenantConfig}
            customerEmail={b2bSession?.customerEmail ?? tokenData?.customerEmail}
            onCreateAnother={() => {
              setAuthView('signup');
              setAppState('auth');
            }}
            onBackToStory={() => setAppState('reading')}
          />
        </Suspense>
      </>
    );
  }

  // ── Sin créditos ─────────────────────────────────────────────────────────────
  if (appState === 'no-credits' && tenantConfig) {
    const channel = tokenData && tenantData
      ? (tenantData.integrationLevel === 'premium' ? 'b2b_premium' : 'b2b_standard')
      : b2bSession
      ? (b2bSession.tenantConfig.integrationLevel === 'premium' ? 'b2b_premium' : 'b2b_standard')
      : tenantData
        ? (tenantData.integrationLevel === 'premium' ? 'b2b_premium' : 'b2b_standard')
        : 'b2c';

    return (
      <>
        {renderDevBanner()}
        <Suspense fallback={<ChunkFallback />}>
          <BuyCredits
            channel={channel}
            userId={auth.user?.id}
            tenantId={b2bSession?.tenantId ?? tenantData?.tenantId}
            onClose={() => setAppState('setup')}
          />
        </Suspense>
      </>
    );
  }

  // ── Catálogo B2B standalone ────────────────────────────────────────────────
  if (appState === 'buy-credits-b2b') {
    return (
      <Suspense fallback={<ChunkFallback />}>
        <BuyCreditsB2B
          tenantId={auth.profile?.tenantId ?? tenantData?.tenantId ?? b2bSession?.tenantId}
          defaultPlan={getB2BStandalonePlan()}
          onClose={() => {
            window.location.href = '/b2b.html';
          }}
        />
      </Suspense>
    );
  }

  // ── Stripe success ───────────────────────────────────────────────────────────
  if (appState === 'credits-success') {
    return (
      <Suspense fallback={<ChunkFallback />}>
        <CreditsSuccess
          onContinue={() => setAppState('setup')}
        />
      </Suspense>
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
