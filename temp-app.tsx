// src/App.tsx
// NubeKids - App principal con validación de token y flujo Setup → Orchestrator → Book

import { useEffect, useState, useCallback } from 'react';
import { validateToken, getTokenFromUrl } from './services/tokenService';
import type { TenantData, TokenData } from './services/tokenService';
import type { TenantConfig, AgentBrief, ComicFace } from './types';
import Setup from './components/Setup';
import type { SetupData } from './components/Setup';
import Book from './components/Book';
import { loadTenantConfig, getTenantIdFromUrl } from './config/tenantLoader';

// Sistema multiagente
import { agentDeps } from './services/dependencies';
import type { SessionContext } from './services/dependencies';
import { orchestrate } from './services/agents';
import type { OrchestratorResult } from './services/agents';

// Mock / Dev
import { DEV_CONFIG, isDevMockMode } from './dev';
import { getMockImages } from './dev';

// Estados de la aplicación
type AppState = 'loading' | 'setup' | 'orchestrating' | 'generating' | 'reading' | 'error';

// Mapa de edad del wizard → AgeGroup
function mapAgeRangeToAgeGroup(ageRange: string): 'tiny' | 'little' | 'reader' {
  switch (ageRange) {
    case '3-4':
      return 'tiny';
    case '5-6':
      return 'little';
    case '7-8':
    case '9-10':
      return 'reader';
    default:
      return 'little';
  }
}

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

  // Datos del tenant (desde Supabase si hay token)
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  // Config completa del tenant (desde tenantLoader)
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

  // Datos del setup completado
  const [setupData, setSetupData] = useState<SetupData | null>(null);

  // Resultado del orchestrator
  const [agentBrief, setAgentBrief] = useState<AgentBrief | null>(null);
  const [orchestratorTiming, setOrchestratorTiming] = useState<OrchestratorResult['timing'] | null>(null);

  // Páginas generadas para el Book
  const [pages, setPages] = useState<ComicFace[]>([]);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, message: '' });

  // API Key de Gemini (necesaria para los agentes)
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // ============================================
  // PROTECCIÓN DE NAVEGACIÓN
  // ============================================
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Solo bloquear durante generación activa
      if (appState === 'orchestrating' || appState === 'generating') {
        e.preventDefault();
        e.returnValue = ''; // Chrome requiere esto
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [appState]);

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  useEffect(() => {
    async function initialize() {
      try {
        // Log del modo actual
        if (isDevMockMode()) {
          console.log('🎭 MODO DESARROLLO — Datos mock activos — Sin llamadas a Gemini');
        } else {
          console.log('🚀 MODO PRODUCCIÓN — Generación real con Gemini API');
        }

        const tokenCode = getTokenFromUrl();

        if (tokenCode) {
          // MODO B2B CON TOKEN: validar token desde Supabase
          const result = await validateToken(tokenCode);

          if (result.valid && result.tenant && result.token) {
            setTenantData(result.tenant);
            setTokenData(result.token);

            // Cargar config completa del tenant desde archivos locales
            const config = loadTenantConfig(result.tenant.tenantId);
            setTenantConfig(config);
          } else {
            setError(result.error || 'Token inválido o expirado');
            setAppState('error');
            return;
          }
        } else {
          // MODO SIN TOKEN: usar ?tenant= param o default B2C
          const tenantId = getTenantIdFromUrl();
          const config = loadTenantConfig(tenantId);
          setTenantConfig(config);
        }

        // Verificar si hay API key guardada
        const savedApiKey = localStorage.getItem('gemini_api_key');
        if (savedApiKey) {
          setApiKey(savedApiKey);
          agentDeps.initialize(savedApiKey);
        } else {
          setShowApiKeyInput(true);
        }

        setAppState('setup');
      } catch (err) {
        console.error('Error inicializando:', err);
        setError('Error al cargar la aplicación');
        setAppState('error');
      }
    }

    initialize();
  }, []);

  // Handler para guardar API Key
  const handleApiKeySubmit = useCallback((key: string) => {
    if (key.trim()) {
      localStorage.setItem('gemini_api_key', key.trim());
      setApiKey(key.trim());
      agentDeps.initialize(key.trim());
      setShowApiKeyInput(false);
    }
  }, []);

  // Construir SessionContext desde SetupData
  const buildSessionContext = useCallback((data: SetupData, config: TenantConfig): SessionContext => {
    return {
      tenantConfig: config,
      heroName: data.heroName,
      heroDescription: data.heroDescription,
      heroPhoto: data.heroPhoto,
      itemImage: data.itemImage,
      itemDescription: data.itemDescription,
      ageGroup: mapAgeRangeToAgeGroup(data.heroAge),
      language: data.language,
      genre: data.genre,
      pedagogyProfile: data.pedagogy,
    };
  }, []);

  // ============================================
  // GENERACIÓN DE IMÁGENES
  // ============================================
  const generateImages = useCallback(async (brief: AgentBrief): Promise<ComicFace[]> => {
    const totalPages = brief.storyBeats.length;
    const generatedPages: ComicFace[] = [];

    for (let i = 0; i < totalPages; i++) {
      const beat = brief.storyBeats[i];

      setGenerationProgress({
        current: i + 1,
        total: totalPages,
        message: LOADING_MESSAGES.generating[i % LOADING_MESSAGES.generating.length],
      });

      let imageUrl: string;

      if (isDevMockMode()) {
        // Modo mock: usar imágenes placeholder
        const mockImages = getMockImages(totalPages);
        imageUrl = mockImages[i];
        // Simular delay
        await new Promise(resolve => setTimeout(resolve, DEV_CONFIG.MOCK_IMAGE_DELAY_MS));
      } else {
        // Modo producción: generar con Gemini
        // TODO: Implementar llamada real a imageGenerationService
        // Por ahora usar placeholder también en producción
        const mockImages = getMockImages(totalPages);
        imageUrl = mockImages[i];
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
      setShowApiKeyInput(true);
      return;
    }

    console.log('🚀 Starting adventure with:', data);
    setSetupData(data);
    setAppState('orchestrating');

    try {
      // Construir contexto de sesión
      const sessionContext = buildSessionContext(data, tenantConfig);
      agentDeps.setSession(sessionContext);

      // Ejecutar el pipeline multiagente
      const result = await orchestrate(sessionContext, agentDeps);

      if (result.success && result.agentBrief) {
        setAgentBrief(result.agentBrief);
        setOrchestratorTiming(result.timing);

        console.log('✅ AgentBrief generado:', result.agentBrief);
        console.log('⏱️ Timing:', result.timing);

        // Pasar a generación de imágenes
        setAppState('generating');

        const generatedPages = await generateImages(result.agentBrief);
        setPages(generatedPages);

        // ¡Listo para leer!
        setAppState('reading');
      } else {
        throw new Error(result.error || 'Error desconocido en el orchestrator');
      }
    } catch (err) {
      console.error('❌ Error en orchestrator:', err);
      setError(err instanceof Error ? err.message : 'Error generando el cuento');
      setAppState('error');
    }
  }, [tenantConfig, buildSessionContext, generateImages]);

  // Handler para reiniciar
  const handleReset = useCallback(() => {
    setSetupData(null);
    setAgentBrief(null);
    setOrchestratorTiming(null);
    setPages([]);
    setGenerationProgress({ current: 0, total: 0, message: '' });
    setError(null);
    agentDeps.cleanup();
    setAppState('setup');
  }, []);

  // ============================================
  // RENDER: Modal de API Key
  // ============================================
  const renderApiKeyModal = () => {
    if (!showApiKeyInput) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl border-4 border-[#1E293B] shadow-[6px_6px_0px_#1E293B] p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🔑</div>
            <h2 className="text-2xl font-bold text-[#1E293B]">API Key de Gemini</h2>
            <p className="text-[#1E293B]/60 mt-2">
              Necesitamos tu API Key para crear la magia
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const input = form.elements.namedItem('apiKey') as HTMLInputElement;
              handleApiKeySubmit(input.value);
            }}
          >
            <input
              type="password"
              name="apiKey"
              placeholder="AIza..."
              className="w-full px-4 py-3 text-lg border-3 border-[#1E293B] rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              autoFocus
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-[#8B5CF6] text-white font-bold text-lg rounded-lg border-3 border-[#1E293B] shadow-[4px_4px_0px_#1E293B] hover:shadow-[2px_2px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Guardar y continuar
            </button>
          </form>

          <p className="text-xs text-[#1E293B]/40 mt-4 text-center">
            Tu API Key se guarda localmente en tu navegador
          </p>
        </div>
      </div>
    );
  };

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
          {/* Animación principal */}
          <div className="text-7xl mb-6 animate-bounce">
            {isOrchestrating ? '🎭' : '✨'}
          </div>

          {/* Título principal */}
          <h2
            className="text-2xl font-display font-bold mb-2"
            style={{ color: tenantConfig.brandColors.primary }}
          >
            {isOrchestrating
              ? `Creando la aventura de ${setupData.heroName}...`
              : `Ilustrando la aventura de ${setupData.heroName}...`
            }
          </h2>

          {/* Mensaje tranquilizador */}
          <p className="text-[#1E293B]/80 mb-6 font-body">
            No cierres esta página, te avisaremos cuando esté listo 🌟
          </p>

          {/* Progreso */}
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

          {/* Pasos animados */}
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

          {/* Aviso de seguridad */}
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

  if (appState === 'setup' && tenantConfig) {
    return (
      <>
        {renderDevBanner()}
        {renderApiKeyModal()}
        <Setup
          tenantConfig={tenantConfig}
          initialItemModel={tokenData?.itemName || ''}
          onComplete={handleStartAdventure}
        />
      </>
    );
  }

  if (appState === 'orchestrating') {
    return (
      <>
        {renderDevBanner()}
        {renderLoadingScreen(true)}
      </>
    );
  }

  if (appState === 'generating') {
    return (
      <>
        {renderDevBanner()}
        {renderLoadingScreen(false)}
      </>
    );
  }

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

  // Fallback
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <p className="text-[#1E293B]">Estado desconocido</p>
    </div>
  );
}

export default App;
