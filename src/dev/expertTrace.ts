import type {
    AgeGroup,
    Beat,
    ComicFace,
    Genre,
    ItemInteractionMode,
    Language,
    PedagogyProfile,
    RagChunk,
} from '../types';
import type { ExpertNarrativeBrief } from '../services/agents/contracts';
import type { VisualBrief } from '../services/agents/visualBriefAgent';

export type ExpertTraceStatus = 'partial' | 'success' | 'failed';
export type ExpertFailureStage = 'rag' | 'narrative' | 'storytelling' | 'visual' | 'images' | 'unknown';

export interface ExpertTraceTiming {
    ragMs: number;
    narrativeMs: number;
    storytellingMs: number;
    visualBriefMs: number;
    totalMs: number;
}

export interface ExpertTraceSession {
    tenantId: string;
    tenantName: string;
    heroName: string;
    ageGroup: AgeGroup;
    language: Language;
    genre: Genre;
    itemLabel: string;
    itemDescription: string;
    itemInteractionMode: ItemInteractionMode;
    ragCollections: string[];
    pedagogyProfile: PedagogyProfile;
}

export interface ExpertTraceFinalPage {
    id: string;
    type: ComicFace['type'];
    pageIndex: number | null;
    caption: string | null;
    dialogue: string | null;
    choices: string[];
    hasImage: boolean;
}

export interface ExpertPipelineTrace {
    createdAt: string;
    mode: 'mock' | 'real';
    status: ExpertTraceStatus;
    session: ExpertTraceSession;
    ragChunks: Array<Pick<RagChunk, 'id' | 'collection' | 'source' | 'summary' | 'tags'>>;
    expertBrief?: ExpertNarrativeBrief;
    storyBeats?: Beat[];
    visualBriefs: Array<
        Pick<
            VisualBrief,
            'pageIndex' | 'compositionNote' | 'lightingMood' | 'characterDirection' | 'magicItemVisibility' | 'fullPrompt'
        >
    >;
    timing: ExpertTraceTiming;
    finalPages?: ExpertTraceFinalPage[];
    failureStage?: ExpertFailureStage;
    errorMessage?: string;
}

declare global {
    interface Window {
        __NUBEKIDS_EXPERT_TRACE__?: ExpertPipelineTrace;
        __NUBEKIDS_EXPERT_TRACE_HISTORY__?: ExpertPipelineTrace[];
    }
}

const TRACE_LATEST_KEY = 'nubekids:expert-trace:latest';
const TRACE_HISTORY_KEY = 'nubekids:expert-trace:history';
const TRACE_HISTORY_LIMIT = 10;

export function buildFinalPageTrace(pages: ComicFace[]): ExpertTraceFinalPage[] {
    return pages.map((page) => ({
        id: page.id,
        type: page.type,
        pageIndex: page.pageIndex ?? null,
        caption: page.narrative?.caption ?? null,
        dialogue: page.narrative?.dialogue ?? null,
        choices: page.choices ?? [],
        hasImage: Boolean(page.imageUrl),
    }));
}

export function saveExpertTrace(trace: ExpertPipelineTrace): void {
    if (!import.meta.env.DEV || typeof window === 'undefined') {
        return;
    }

    const history = [...(window.__NUBEKIDS_EXPERT_TRACE_HISTORY__ ?? []), trace].slice(-TRACE_HISTORY_LIMIT);

    window.__NUBEKIDS_EXPERT_TRACE__ = trace;
    window.__NUBEKIDS_EXPERT_TRACE_HISTORY__ = history;

    try {
        window.localStorage.setItem(TRACE_LATEST_KEY, JSON.stringify(trace));
        window.localStorage.setItem(TRACE_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.warn('[ExpertTrace] No se pudo persistir en localStorage:', error);
    }

    console.groupCollapsed(
        `🧪 [ExpertTrace] ${trace.session.heroName} | ${trace.session.ageGroup} | ${trace.mode} | ${trace.status}`
    );
    console.log('Sesion:', trace.session);
    console.log('Estado:', trace.status, trace.failureStage ?? '', trace.errorMessage ?? '');
    console.log('RAG chunks:', trace.ragChunks);
    console.log('Expert brief:', trace.expertBrief ?? null);
    console.log('Story beats:', trace.storyBeats ?? []);
    console.log('Visual briefs:', trace.visualBriefs);
    console.log('Final pages:', trace.finalPages ?? []);
    console.log(
        'Acceso rapido:',
        'window.__NUBEKIDS_EXPERT_TRACE__',
        'window.__NUBEKIDS_EXPERT_TRACE_HISTORY__',
        'localStorage["nubekids:expert-trace:latest"]'
    );
    console.groupEnd();
}
