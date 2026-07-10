/**
 * promptSanitizer.ts
 * Sanitizado de prompts externos (tenant) antes de inyectarlos en agentes.
 *
 * El baseSystemPrompt del tenant es entrada NO confiable: se limpia y se
 * limita en longitud. Los guardrails inviolables se añaden SIEMPRE después
 * de él (ver narrativeAgent), de modo que no pueda re-instruir al modelo.
 */

const MAX_TENANT_PROMPT_LENGTH = 1500;
const LINE_FEED = 10;
const DELETE_CHAR = 127;

function isControlChar(code: number): boolean {
    return (code < 32 && code !== LINE_FEED) || code === DELETE_CHAR;
}

function stripControlChars(text: string): string {
    let result = '';
    for (const char of text) {
        result += isControlChar(char.charCodeAt(0)) ? ' ' : char;
    }
    return result;
}

export function sanitizeTenantSystemPrompt(prompt: string | undefined | null): string {
    if (!prompt) return '';

    return stripControlChars(prompt)
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, MAX_TENANT_PROMPT_LENGTH);
}
