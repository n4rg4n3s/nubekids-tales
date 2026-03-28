// src/App.tsx
// NubeKids - App principal con validación de token y flujo Setup → Orchestrator → Book

import { useEffect, useState, useCallback } from 'react';
import { validateToken, getTokenFromUrl } from './services/tokenService';
import type { TenantData, TokenData } from './services/tokenService';
import type { TenantConfig, AgentBrief } from './types';
import Setup from './components/Setup';
import type { SetupData } from './components/Setup';
import { loadTenantConfig, getTenantIdFromUrl } from './config/tenantLoader';

// Sistema multiagente
import { agentDeps } from './services/dependencies';
import type { SessionContext } from './services/dependencies';
import { orchestrate } from './services/agents';
import type { OrchestratorResult } from './services/agents';

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

  // API Key de Gemini (necesaria para los agentes)
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
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
        setAppState('generating');

        console.log('✅ AgentBrief generado:', result.agentBrief);
        console.log('⏱️ Timing:', result.timing);
      } else {
        throw new Error(result.error || 'Error desconocido en el orchestrator');
      }
    } catch (err) {
      console.error('❌ Error en orchestrator:', err);
      setError(err instanceof Error ? err.message : 'Error generando el cuento');
      setAppState('error');
    }
  }, [tenantConfig, buildSessionContext]);

  // Handler para reiniciar
  const handleReset = useCallback(() => {
    setSetupData(null);
    setAgentBrief(null);
    setOrchestratorTiming(null);
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
  // RENDER por estado
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
        {renderApiKeyModal()}
        <Setup
          tenantConfig={tenantConfig}
          initialItemModel={tokenData?.itemName || ''}
          onComplete={handleStartAdventure}
        />
      </>
    );
  }

  if (appState === 'orchestrating' && setupData && tenantConfig) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: tenantConfig.brandColors.background }}
      >
        <div className="text-center p-8">
          <div className="text-6xl mb-4 animate-spin">🎭</div>
          <p
            className="text-2xl font-bold mb-2"
            style={{ color: tenantConfig.brandColors.primary }}
          >
            Los expertos están trabajando...
          </p>
          <div className="text-[#1E293B]/60 space-y-1">
            <p>📚 Consultando biblioteca pedagógica...</p>
            <p>🧠 Diseñando el arco narrativo...</p>
            <p>✍️ Escribiendo la historia...</p>
            <p>🎨 Preparando las ilustraciones...</p>
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'generating' && setupData && tenantConfig && agentBrief) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: tenantConfig.brandColors.background }}
      >
        <div className="text-center p-8 max-w-2xl">
          <div className="text-6xl mb-4">✅</div>
          <p
            className="text-2xl font-bold mb-4"
            style={{ color: tenantConfig.brandColors.primary }}
          >
            ¡Brief del cuento generado!
          </p>

          {/* Info del protagonista */}
          <div className="bg-white/80 rounded-xl p-4 mb-4 text-left">
            <p className="font-medium text-[#1E293B]">
              Protagonista: {setupData.heroName} ({setupData.heroAge} años)
            </p>
            <p className="text-[#1E293B]/60">
              Estilo: {setupData.genre} • {setupData.language}
            </p>
          </div>

          {/* Arco narrativo */}
          <div className="bg-white/80 rounded-xl p-4 mb-4 text-left">
            <h3 className="font-bold text-[#8B5CF6] mb-2">🎯 Arco Narrativo</h3>
            <p className="text-[#1E293B] text-sm">{agentBrief.narrativeArc}</p>
          </div>

          {/* Beats generados */}
          <div className="bg-white/80 rounded-xl p-4 mb-4 text-left">
            <h3 className="font-bold text-[#8B5CF6] mb-2">
              📖 {agentBrief.storyBeats.length} Páginas
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {agentBrief.storyBeats.slice(0, 5).map((beat, idx) => (
                <div key={idx} className="text-sm border-l-2 border-[#8B5CF6] pl-2">
                  <span className="font-medium">Pág {idx + 1}:</span>{' '}
                  <span className="text-[#1E293B]/70">
                    {beat.caption?.substring(0, 60) || beat.scene.substring(0, 60)}...
                  </span>
                </div>
              ))}
              {agentBrief.storyBeats.length > 5 && (
                <p className="text-xs text-[#1E293B]/50">
                  + {agentBrief.storyBeats.length - 5} páginas más...
                </p>
              )}
            </div>
          </div>

          {/* Timing */}
          {orchestratorTiming && (
            <div className="bg-green-100 rounded-xl p-3 mb-4 text-left text-sm">
              <p className="font-medium text-green-800">
                ⏱️ Tiempo total: {(orchestratorTiming.totalMs / 1000).toFixed(1)}s
              </p>
              <p className="text-green-700 text-xs">
                RAG: {orchestratorTiming.ragMs}ms •
                Narrativa: {(orchestratorTiming.narrativeMs / 1000).toFixed(1)}s •
                Historia: {(orchestratorTiming.storytellingMs / 1000).toFixed(1)}s •
                Visual: {(orchestratorTiming.visualBriefMs / 1000).toFixed(1)}s
              </p>
            </div>
          )}

          {/* TODO Banner */}
          <div className="bg-yellow-100 rounded-lg border-2 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-800 font-medium">
              ✅ Fase 3B completada - Sistema multiagente funcional
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              Siguiente: Conectar AgentBrief → Generación de imágenes → Book.tsx
            </p>
          </div>

          {/* Botón reiniciar */}
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-[#8B5CF6] text-white font-bold rounded-lg border-3 border-[#1E293B] shadow-[3px_3px_0px_#1E293B] hover:shadow-[1px_1px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Crear otro cuento
          </button>
        </div>
      </div>
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