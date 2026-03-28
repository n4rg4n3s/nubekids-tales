// src/App.tsx
// NubeKids - App principal con sistema de mock para desarrollo rápido

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

// Generación de imágenes
import { generateAllImages } from './services/imageGenerationService';

// Sistema de desarrollo/mock
import { DEV_CONFIG, isDevMockMode, getMockBrief, getMockImages } from './dev';

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

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);

  // Datos del tenant
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

  // Datos del setup
  const [setupData, setSetupData] = useState<SetupData | null>(null);

  // Resultado del orchestrator
  const [agentBrief, setAgentBrief] = useState<AgentBrief | null>(null);
  const [orchestratorTiming, setOrchestratorTiming] = useState<OrchestratorResult['timing'] | null>(null);

  // Páginas del libro
  const [pages, setPages] = useState<ComicFace[]>([]);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });

  // API Key
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // ============================================
  // LOG DEV MODE
  // ============================================
  useEffect(() => {
    if (isDevMockMode()) {
      console.log('🧪 [DEV] Modo MOCK activado - No se llamará a Gemini');
      console.log('🧪 [DEV] Para usar el flujo real, cambia USE_MOCK_DATA a false en src/dev/mockConfig.ts');
    }
  }, []);

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  useEffect(() => {
    async function initialize() {
      try {
        const tokenCode = getTokenFromUrl();

        if (tokenCode) {
          const result = await validateToken(tokenCode);
          if (result.valid && result.tenant && result.token) {
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
          const tenantId = getTenantIdFromUrl();
          const config = loadTenantConfig(tenantId);
          setTenantConfig(config);
        }

        // Solo verificar API key si NO estamos en modo mock
        if (!isDevMockMode()) {
          const savedApiKey = localStorage.getItem('gemini_api_key');
          if (savedApiKey) {
            setApiKey(savedApiKey);
            agentDeps.initialize(savedApiKey);
          } else {
            setShowApiKeyInput(true);
          }
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

  // ============================================
  // HANDLERS
  // ============================================

  const handleApiKeySubmit = useCallback((key: string) => {
    if (key.trim()) {
      localStorage.setItem('gemini_api_key', key.trim());
      setApiKey(key.trim());
      agentDeps.initialize(key.trim());
      setShowApiKeyInput(false);
    }
  }, []);

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
  // FLUJO MOCK (Desarrollo rápido)
  // ============================================
  const runMockFlow = useCallback(async (data: SetupData) => {
    console.log('🧪 [DEV] Ejecutando flujo MOCK...');

    setAppState('orchestrating');

    // Simular delay del orchestrator
    await new Promise(resolve => setTimeout(resolve, DEV_CONFIG.MOCK_ORCHESTRATOR_DELAY_MS));

    // Obtener brief mock
    const mockBrief = getMockBrief(10);
    setAgentBrief(mockBrief);
    setOrchestratorTiming({
      ragMs: 50,
      narrativeMs: 500,
      storytellingMs: 500,
      visualBriefMs: 400,
      totalMs: DEV_CONFIG.MOCK_ORCHESTRATOR_DELAY_MS,
    });

    console.log('🧪 [DEV] AgentBrief mock cargado');

    // Generar imágenes mock
    setAppState('generating');
    setGenerationProgress({ current: 0, total: mockBrief.storyBeats.length });

    const mockImageUrls = await getMockImages(
      mockBrief.storyBeats.length,
      DEV_CONFIG.MOCK_IMAGE_DELAY_MS,
      (current, total) => setGenerationProgress({ current, total })
    );

    // Construir páginas
    const bookPages: ComicFace[] = mockBrief.storyBeats.map((beat, idx) => ({
      id: `page-${idx}`,
      type: idx === 0 ? 'cover' : idx === mockBrief.storyBeats.length - 1 ? 'back_cover' : 'story',
      imageUrl: mockImageUrls[idx],
      narrative: beat,
      choices: beat.choices || [],
      isLoading: false,
      pageIndex: idx,
      isDecisionPage: (beat.choices?.length ?? 0) > 0,
    }));

    setPages(bookPages);
    setAppState('reading');

    console.log('🧪 [DEV] Flujo mock completado - Libro listo');
  }, []);

  // ============================================
  // FLUJO REAL (Producción)
  // ============================================
  const runRealFlow = useCallback(async (data: SetupData, config: TenantConfig) => {
    console.log('🚀 Ejecutando flujo REAL...');

    if (!agentDeps.isInitialized) {
      setShowApiKeyInput(true);
      return;
    }

    setAppState('orchestrating');

    try {
      // FASE 1: Orchestrator
      const sessionContext = buildSessionContext(data, config);
      agentDeps.setSession(sessionContext);

      const result = await orchestrate(sessionContext, agentDeps);

      if (!result.success || !result.agentBrief) {
        throw new Error(result.error || 'Error desconocido en el orchestrator');
      }

      setAgentBrief(result.agentBrief);
      setOrchestratorTiming(result.timing);
      console.log('✅ AgentBrief generado:', result.agentBrief);

      // FASE 2: Generar imágenes
      setAppState('generating');
      setGenerationProgress({ current: 0, total: result.agentBrief.visualDirections.length });

      const imageResults = await generateAllImages(
        result.agentBrief.visualDirections,
        data.heroPhoto,
        data.itemImage,
        data.heroDescription || undefined,
        agentDeps,
        (current, total) => setGenerationProgress({ current: current + 1, total })
      );

      // FASE 3: Construir páginas
      const bookPages: ComicFace[] = result.agentBrief.storyBeats.map((beat, idx) => {
        const imageResult = imageResults[idx];
        return {
          id: `page-${idx}`,
          type: idx === 0 ? 'cover' : idx === result.agentBrief!.storyBeats.length - 1 ? 'back_cover' : 'story',
          imageUrl: imageResult?.success && imageResult.imageBase64
            ? `data:image/png;base64,${imageResult.imageBase64}`
            : undefined,
          narrative: beat,
          choices: beat.choices || [],
          isLoading: false,
          pageIndex: idx,
          isDecisionPage: (beat.choices?.length ?? 0) > 0,
        };
      });

      setPages(bookPages);
      setAppState('reading');
      console.log('📖 Libro generado con', bookPages.length, 'páginas');

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Error generando el cuento');
      setAppState('error');
    }
  }, [buildSessionContext]);

  // ============================================
  // HANDLER PRINCIPAL
  // ============================================
  const handleStartAdventure = useCallback(async (data: SetupData) => {
    if (!tenantConfig) {
      setError('Configuración del tenant no disponible');
      setAppState('error');
      return;
    }

    console.log('🎬 Iniciando aventura:', data.heroName);
    setSetupData(data);

    if (isDevMockMode()) {
      await runMockFlow(data);
    } else {
      await runRealFlow(data, tenantConfig);
    }
  }, [tenantConfig, runMockFlow, runRealFlow]);

  const handleReset = useCallback(() => {
    setSetupData(null);
    setAgentBrief(null);
    setOrchestratorTiming(null);
    setPages([]);
    setGenerationProgress({ current: 0, total: 0 });
    setError(null);
    agentDeps.cleanup();
    setAppState('setup');
  }, []);

  // ============================================
  // RENDER: Modal API Key
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
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER: Dev Mode Banner
  // ============================================
  const renderDevBanner = () => {
    if (!isDevMockMode()) return null;

    return (
      <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-center py-1 text-sm font-medium z-50">
        🧪 MODO DESARROLLO — Datos mock activos — Sin llamadas a Gemini
      </div>
    );
  };

  // ============================================
  // RENDER POR ESTADO
  // ============================================

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
            className="inline-block px-6 py-3 bg-[#8B5CF6] text-white font-bold rounded-lg border-3 border-[#1E293B] shadow-[3px_3px_0px_#1E293B]"
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
        <div className={isDevMockMode() ? 'pt-8' : ''}>
          <Setup
            tenantConfig={tenantConfig}
            initialItemModel={tokenData?.itemName || ''}
            onComplete={handleStartAdventure}
          />
        </div>
      </>
    );
  }

  if (appState === 'orchestrating' && tenantConfig) {
    return (
      <>
        {renderDevBanner()}
        <div
          className={`min-h-screen flex items-center justify-center ${isDevMockMode() ? 'pt-8' : ''}`}
          style={{ backgroundColor: tenantConfig.brandColors.background }}
        >
          <div className="text-center p-8">
            <div className="text-6xl mb-4 animate-spin">🎭</div>
            <p
              className="text-2xl font-bold mb-2"
              style={{ color: tenantConfig.brandColors.primary }}
            >
              {isDevMockMode() ? 'Cargando datos mock...' : 'Los expertos están trabajando...'}
            </p>
            {!isDevMockMode() && (
              <div className="text-[#1E293B]/60 space-y-1">
                <p>📚 Consultando biblioteca pedagógica...</p>
                <p>🧠 Diseñando el arco narrativo...</p>
                <p>✍️ Escribiendo la historia...</p>
                <p>🎨 Preparando las ilustraciones...</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  if (appState === 'generating' && tenantConfig) {
    const progressPercent = generationProgress.total > 0
      ? Math.round((generationProgress.current / generationProgress.total) * 100)
      : 0;

    return (
      <>
        {renderDevBanner()}
        <div
          className={`min-h-screen flex items-center justify-center ${isDevMockMode() ? 'pt-8' : ''}`}
          style={{ backgroundColor: tenantConfig.brandColors.background }}
        >
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">🎨</div>
            <p
              className="text-2xl font-bold mb-4"
              style={{ color: tenantConfig.brandColors.primary }}
            >
              {isDevMockMode() ? 'Cargando imágenes...' : 'Dibujando las ilustraciones...'}
            </p>

            <div className="w-full bg-white/50 rounded-full h-4 border-2 border-[#1E293B] overflow-hidden mb-4">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: tenantConfig.brandColors.primary,
                }}
              />
            </div>

            <p className="text-[#1E293B]/60">
              Página {generationProgress.current} de {generationProgress.total}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (appState === 'reading' && tenantConfig && pages.length > 0 && setupData) {
    return (
      <>
        {renderDevBanner()}
        <div className={isDevMockMode() ? 'pt-8' : ''}>
          <Book
            pages={pages}
            tenantConfig={tenantConfig}
            heroName={setupData.heroName}
            onReset={handleReset}
          />
        </div>
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