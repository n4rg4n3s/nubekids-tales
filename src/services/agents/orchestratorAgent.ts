/**
 * orchestratorAgent.ts
 * ORCHESTRATOR AGENT
 *
 * Coordina el pipeline completo ANTES de generar páginas.
 * Ejecuta los agentes en secuencia estricta:
 * RAG → Narrative → Storytelling → Visual Brief
 *
 * Output: AgentBrief que guiará toda la generación posterior.
 */

import type { AgentBrief } from '../../types';
import type { AgentDependencies, SessionContext } from '../dependencies';
import { queryRag } from '../ragService';
import * as narrativeAgent from './narrativeAgent';
import * as storytellingAgent from './storytellingAgent';
import * as visualBriefAgent from './visualBriefAgent';
import type { ExpertFailureStage, ExpertPipelineTrace } from '../../dev/expertTrace';

// ============================================
// TYPES
// ============================================

export interface OrchestratorResult {
    success: boolean;
    agentBrief?: AgentBrief;
    debugTrace?: ExpertPipelineTrace;
    error?: string;
    timing: {
        ragMs: number;
        narrativeMs: number;
        storytellingMs: number;
        visualBriefMs: number;
        totalMs: number;
    };
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Orquesta el pipeline completo de generación del brief.
 * IMPORTANTE: Los agentes se ejecutan SECUENCIALMENTE (no en paralelo).
 */
export async function orchestrate(
    session: SessionContext,
    deps: AgentDependencies
): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const timing = {
        ragMs: 0,
        narrativeMs: 0,
        storytellingMs: 0,
        visualBriefMs: 0,
        totalMs: 0,
    };
    let failureStage: ExpertFailureStage = 'unknown';
    const debugTrace: ExpertPipelineTrace = {
        createdAt: new Date().toISOString(),
        mode: 'real',
        status: 'partial',
        session: {
            tenantId: session.tenantConfig.tenantId,
            tenantName: session.tenantConfig.tenantName,
            heroName: session.heroName,
            ageGroup: session.ageGroup,
            language: session.language,
            genre: session.genre,
            itemLabel: session.tenantConfig.itemLabel,
            itemDescription: session.itemDescription,
            itemInteractionMode: session.tenantConfig.itemInteractionMode,
            ragCollections: session.tenantConfig.ragCollections,
            pedagogyProfile: session.pedagogyProfile,
        },
        ragChunks: [],
        visualBriefs: [],
        timing,
    };

    console.log('🎭 [Orchestrator] Iniciando pipeline multiagente...');
    console.log(`🎭 [Orchestrator] Héroe: ${session.heroName}, Edad: ${session.ageGroup}`);

    try {
        // ═══════════════════════════════════════════
        // PASO 1: Consultar RAG
        // ═══════════════════════════════════════════
        failureStage = 'rag';
        console.log('📚 [Orchestrator] Paso 1/4: Consultando RAG...');
        const ragStart = Date.now();

        deps.ragChunks = await queryRag({
            ageGroup: session.ageGroup,
            pedagogy: session.pedagogyProfile,
            collections: session.tenantConfig.ragCollections,
        }, deps);

        timing.ragMs = Date.now() - ragStart;
        debugTrace.ragChunks = deps.ragChunks.map((chunk) => ({
            id: chunk.id,
            collection: chunk.collection,
            source: chunk.source,
            summary: chunk.summary,
            tags: chunk.tags,
        }));
        console.log(`   → ${deps.ragChunks.length} chunks encontrados (${timing.ragMs}ms)`);

        // ═══════════════════════════════════════════
        // PASO 2: Narrative Agent (Arco narrativo)
        // ═══════════════════════════════════════════
        failureStage = 'narrative';
        console.log('🧠 [Orchestrator] Paso 2/4: Generando arco narrativo...');
        const narrativeStart = Date.now();

        const expertBrief = await narrativeAgent.generateArc(
            {
                heroName: session.heroName,
                friendName: undefined, // TODO: Extraer del contexto si existe
                itemLabel: session.tenantConfig.itemLabel,
                itemInteractionMode: session.tenantConfig.itemInteractionMode,
                itemDescription: session.itemDescription,
                ageGroup: session.ageGroup,
                pedagogyProfile: session.pedagogyProfile,
                baseSystemPrompt: session.tenantConfig.baseSystemPrompt,
                storeName: session.tenantConfig.storeName,
            },
            deps
        );

        timing.narrativeMs = Date.now() - narrativeStart;
        debugTrace.expertBrief = expertBrief;
        console.log(`   → Objetivo: "${expertBrief.pedagogicalObjective}" (${timing.narrativeMs}ms)`);

        // ═══════════════════════════════════════════
        // PASO 3: Storytelling Agent (Beats)
        // ═══════════════════════════════════════════
        failureStage = 'storytelling';
        console.log('✍️ [Orchestrator] Paso 3/4: Generando beats...');
        const storytellingStart = Date.now();

        const storyBeats = await storytellingAgent.generateBeats(
            {
                expertBrief,
                ageGroup: session.ageGroup,
                pedagogyProfile: session.pedagogyProfile,
                language: session.language,
                genre: session.genre,
                heroName: session.heroName,
                friendName: undefined, // TODO: Extraer del contexto si existe
                itemLabel: session.tenantConfig.itemLabel,
                itemInteractionMode: session.tenantConfig.itemInteractionMode,
                itemDescription: session.itemDescription,
                totalPages: 10,
            },
            deps
        );

        timing.storytellingMs = Date.now() - storytellingStart;
        debugTrace.storyBeats = storyBeats;
        console.log(`   → ${storyBeats.length} beats generados (${timing.storytellingMs}ms)`);

        // ═══════════════════════════════════════════
        // PASO 4: Visual Brief Agent (Prompts de imagen)
        // ═══════════════════════════════════════════
        failureStage = 'visual';
        console.log('🎨 [Orchestrator] Paso 4/4: Generando briefs visuales...');
        const visualStart = Date.now();

        const visualBriefs = await visualBriefAgent.generateBriefs(
            {
                storyBeats,
                expertBrief,
                ageGroup: session.ageGroup,
                genre: session.genre,
                itemLabel: session.tenantConfig.itemLabel,
                itemInteractionMode: session.tenantConfig.itemInteractionMode,
                itemDescription: session.itemDescription,
                heroName: session.heroName,
                heroDescription: session.heroDescription || undefined,
                friendName: undefined,
                friendDescription: undefined,
            },
            deps
        );

        timing.visualBriefMs = Date.now() - visualStart;
        debugTrace.visualBriefs = visualBriefs.map((brief) => ({
            pageIndex: brief.pageIndex,
            compositionNote: brief.compositionNote,
            lightingMood: brief.lightingMood,
            characterDirection: brief.characterDirection,
            magicItemVisibility: brief.magicItemVisibility,
            fullPrompt: brief.fullPrompt,
        }));
        console.log(`   → ${visualBriefs.length} briefs visuales generados (${timing.visualBriefMs}ms)`);

        // ═══════════════════════════════════════════
        // COMPILAR AgentBrief
        // ═══════════════════════════════════════════
        const agentBrief: AgentBrief = {
            narrativeArc: expertBrief.storyArcSummary,
            storyBeats,
            visualDirections: visualBriefs.map(vb => vb.fullPrompt),
        };

        timing.totalMs = Date.now() - startTime;
        debugTrace.status = 'partial';

        console.log('✅ [Orchestrator] Pipeline completado exitosamente');
        console.log(`   → Tiempo total: ${timing.totalMs}ms`);
        console.log(`   → Desglose: RAG=${timing.ragMs}ms, Narrative=${timing.narrativeMs}ms, Storytelling=${timing.storytellingMs}ms, Visual=${timing.visualBriefMs}ms`);

        return {
            success: true,
            agentBrief,
            debugTrace,
            timing,
        };

    } catch (error) {
        timing.totalMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        debugTrace.status = 'failed';
        debugTrace.failureStage = failureStage;
        debugTrace.errorMessage = errorMessage;

        console.error('❌ [Orchestrator] Error en pipeline:', errorMessage);

        return {
            success: false,
            debugTrace,
            error: errorMessage,
            timing,
        };
    }
}

/**
 * Valida que el SessionContext tenga todos los datos necesarios.
 */
export function validateSessionContext(session: SessionContext): string[] {
    const errors: string[] = [];

    if (!session.heroName?.trim()) {
        errors.push('Falta el nombre del protagonista');
    }

    if (!session.ageGroup) {
        errors.push('Falta el grupo de edad');
    }

    if (!session.tenantConfig) {
        errors.push('Falta la configuración del tenant');
    }

    if (!session.language) {
        errors.push('Falta el idioma');
    }

    if (!session.genre) {
        errors.push('Falta el género visual');
    }

    return errors;
}
