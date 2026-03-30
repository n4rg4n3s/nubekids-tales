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

// ============================================
// TYPES
// ============================================

export interface OrchestratorResult {
    success: boolean;
    agentBrief?: AgentBrief;
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

    console.log('🎭 [Orchestrator] Iniciando pipeline multiagente...');
    console.log(`🎭 [Orchestrator] Héroe: ${session.heroName}, Edad: ${session.ageGroup}`);

    try {
        // ═══════════════════════════════════════════
        // PASO 1: Consultar RAG
        // ═══════════════════════════════════════════
        console.log('📚 [Orchestrator] Paso 1/4: Consultando RAG...');
        const ragStart = Date.now();

        deps.ragChunks = await queryRag({
            ageGroup: session.ageGroup,
            pedagogy: session.pedagogyProfile,
            collections: session.tenantConfig.ragCollections,
            maxChunks: 5,
        }, import.meta.env.VITE_GEMINI_API_KEY);

        timing.ragMs = Date.now() - ragStart;
        console.log(`   → ${deps.ragChunks.length} chunks encontrados (${timing.ragMs}ms)`);

        // ═══════════════════════════════════════════
        // PASO 2: Narrative Agent (Arco narrativo)
        // ═══════════════════════════════════════════
        console.log('🧠 [Orchestrator] Paso 2/4: Generando arco narrativo...');
        const narrativeStart = Date.now();

        const narrativeArc = await narrativeAgent.generateArc(
            {
                heroName: session.heroName,
                friendName: undefined, // TODO: Extraer del contexto si existe
                itemLabel: session.tenantConfig.itemLabel,
                itemDescription: session.itemDescription,
                ageGroup: session.ageGroup,
                pedagogyProfile: session.pedagogyProfile,
                baseSystemPrompt: session.tenantConfig.baseSystemPrompt,
                storeName: session.tenantConfig.storeName,
            },
            deps
        );

        timing.narrativeMs = Date.now() - narrativeStart;
        console.log(`   → Objetivo: "${narrativeArc.pedagogicalObjective}" (${timing.narrativeMs}ms)`);

        // ═══════════════════════════════════════════
        // PASO 3: Storytelling Agent (Beats)
        // ═══════════════════════════════════════════
        console.log('✍️ [Orchestrator] Paso 3/4: Generando beats...');
        const storytellingStart = Date.now();

        const storyBeats = await storytellingAgent.generateBeats(
            {
                narrativeArc: narrativeArc.narrativeArcSummary,
                ageGroup: session.ageGroup,
                language: session.language,
                genre: session.genre,
                heroName: session.heroName,
                friendName: undefined, // TODO: Extraer del contexto si existe
                itemLabel: session.tenantConfig.itemLabel,
                itemDescription: session.itemDescription,
                totalPages: 10,
            },
            deps
        );

        timing.storytellingMs = Date.now() - storytellingStart;
        console.log(`   → ${storyBeats.length} beats generados (${timing.storytellingMs}ms)`);

        // ═══════════════════════════════════════════
        // PASO 4: Visual Brief Agent (Prompts de imagen)
        // ═══════════════════════════════════════════
        console.log('🎨 [Orchestrator] Paso 4/4: Generando briefs visuales...');
        const visualStart = Date.now();

        const visualBriefs = await visualBriefAgent.generateBriefs(
            {
                storyBeats,
                genre: session.genre,
                itemLabel: session.tenantConfig.itemLabel,
                itemDescription: session.itemDescription,
                heroName: session.heroName,
                heroDescription: session.heroDescription || undefined,
                friendName: undefined,
                friendDescription: undefined,
            },
            deps
        );

        timing.visualBriefMs = Date.now() - visualStart;
        console.log(`   → ${visualBriefs.length} briefs visuales generados (${timing.visualBriefMs}ms)`);

        // ═══════════════════════════════════════════
        // COMPILAR AgentBrief
        // ═══════════════════════════════════════════
        const agentBrief: AgentBrief = {
            narrativeArc: narrativeArc.narrativeArcSummary,
            storyBeats,
            visualDirections: visualBriefs.map(vb => vb.fullPrompt),
        };

        timing.totalMs = Date.now() - startTime;

        console.log('✅ [Orchestrator] Pipeline completado exitosamente');
        console.log(`   → Tiempo total: ${timing.totalMs}ms`);
        console.log(`   → Desglose: RAG=${timing.ragMs}ms, Narrative=${timing.narrativeMs}ms, Storytelling=${timing.storytellingMs}ms, Visual=${timing.visualBriefMs}ms`);

        return {
            success: true,
            agentBrief,
            timing,
        };

    } catch (error) {
        timing.totalMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.error('❌ [Orchestrator] Error en pipeline:', errorMessage);

        return {
            success: false,
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