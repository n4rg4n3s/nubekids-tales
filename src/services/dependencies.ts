/**
 * dependencies.ts
 * Dependencias centralizadas para todos los agentes.
 * Patrón inspirado en el RAG Agent de referencia.
 */

import type { GoogleGenAI } from '@google/genai';
import type {
    AgeGroup,
    PedagogyProfile,
    TenantConfig,
    RagChunk,
    Genre,
    Language,
} from '../types';

/**
 * Contexto de sesión que se pasa a todos los agentes.
 * Contiene toda la información necesaria para generar el cuento.
 */
export interface SessionContext {
    // Tenant
    tenantConfig: TenantConfig;

    // Protagonista
    heroName: string;
    heroDescription: string | null;
    heroPhoto: string | null;
    /** Rasgos de carácter (ids del catálogo) — modulan narrativa, no añaden objetivos */
    heroPersonality: string[];

    // Objeto mágico
    itemImage: string | null;
    itemDescription: string;

    // Configuración
    ageGroup: AgeGroup;
    language: Language;
    genre: Genre;

    // Pedagogía
    pedagogyProfile: PedagogyProfile;
}

/**
 * Clase que gestiona las dependencias compartidas entre agentes.
 * Incluye el cliente de Gemini, contexto de sesión y cache de RAG.
 */
export class AgentDependencies {
    // Cliente de Gemini
    private _geminiClient: GoogleGenAI | null = null;

    // Contexto de sesión actual
    session: SessionContext | null = null;

    // Cache de chunks RAG para la sesión actual
    ragChunks: RagChunk[] = [];

    /**
     * Obtiene el cliente de Gemini.
     * Lanza error si no está inicializado.
     */
    get geminiClient(): GoogleGenAI {
        if (!this._geminiClient) {
            throw new Error('Gemini client not initialized. Call initialize() first.');
        }
        return this._geminiClient;
    }

    /**
     * Verifica si el cliente está inicializado.
     */
    get isInitialized(): boolean {
        return this._geminiClient !== null;
    }

    /**
     * Inicializa el cliente de Gemini con la API key.
     */
    async initialize(apiKey: string): Promise<void> {
        if (this._geminiClient) return;
        const { GoogleGenAI } = await import('@google/genai');
        this._geminiClient = new GoogleGenAI({ apiKey });
    }

    /**
     * Establece el contexto de sesión desde los datos del Setup.
     */
    setSession(context: SessionContext): void {
        this.session = context;
    }

    /**
     * Obtiene el contexto de sesión.
     * Lanza error si no está establecido.
     */
    getSession(): SessionContext {
        if (!this.session) {
            throw new Error('Session context not set. Call setSession() first.');
        }
        return this.session;
    }

    /**
     * Limpia el estado al terminar una generación.
     */
    cleanup(): void {
        this.session = null;
        this.ragChunks = [];
    }

    /**
     * Reinicia completamente las dependencias.
     */
    reset(): void {
        this._geminiClient = null;
        this.session = null;
        this.ragChunks = [];
    }
}

// Singleton para uso global en la aplicación
export const agentDeps = new AgentDependencies();
