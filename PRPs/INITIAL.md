# INITIAL.md — Fase 1: Refactor hacia Multitenancy

## FEATURE:

Reestructurar el codebase actual de "Magic Sneakers" (single-tenant) para soportar multitenancy.
Esto incluye:
- Ampliar `types.ts` con los nuevos data models (TenantConfig, AgeGroup, PedagogyProfile, AgentBrief)
- Crear el sistema de configuración de verticales (shoe-store, fashion-store, direct-b2c)
- Implementar el tenant loader que lee de query params
- Renombrar todas las referencias de "shoe" a "item" (genérico)
- Adaptar Setup.tsx para labels dinámicos según el tenant
- Extraer utilidades (pdfExport, imageUtils) de App.tsx

## CONTEXT:

El codebase actual (V1) está en `src/` con esta estructura:
```
src/
├── App.tsx                 # Orquestador principal (contiene PDF export inline)
├── types.ts                # Interfaces actuales (Persona con shoeImageBase64)
├── Setup.tsx               # UI de configuración (hardcodea "shoes")
├── Book.tsx                # Contenedor del libro
├── Panel.tsx               # Renderizado de página
├── ApiKeyDialog.tsx        # Modal de API Key
├── useApiKey.ts            # Hook de localStorage
├── LoadingFX.tsx           # Efectos de carga
└── services/
    └── geminiService.ts    # Llamadas a Gemini API
```

Los documentos de referencia completos están en:
- `nubekids_PRD_v2.md` — Product Requirements Document con verticales, Age Groups, y user stories
- `nubekids_PRP_v2.md` — Product Requirements Prompt con data models, pseudocódigo y tasks
- `nubekids_DD_Design_Document.md` — Design Document con paleta, tipografía y componentes UI

## DOCUMENTATION:

- Gemini SDK JS: https://www.npmjs.com/package/@google/genai
- Referencia de types.ts actuales: ver `nubekids_PRP_v2.md` sección "Data Models"
- Configs de tenant: ver `nubekids_PRP_v2.md` sección "Configuración de Verticales"

## OTHER CONSIDERATIONS:

### Gotchas Críticos
1. **Renombrar shoeImageBase64 → itemImageBase64** debe hacerse en UN SOLO commit atómico
   para no romper referencias. Afecta: types.ts, geminiService.ts, App.tsx, Setup.tsx.

2. **tenantLoader.ts** en V1 usa un switch local con imports. En V2 será un fetch a API.
   Diseñar la interfaz del loader para que el cambio sea transparente (async siempre).

3. **Los colores de marca del tenant** deben inyectarse como CSS variables, no hardcodearse.
   Setup.tsx y Book.tsx deben leer `tenantConfig.brandColors`.

4. **El campo item_model** debe pre-rellenarse desde `?item=` query param Y ser editable
   si `tenantConfig.allowUserEditItem = true`. Si false, readonly.

5. **No romper la funcionalidad actual.** La vertical shoe-store con config default debe
   comportarse exactamente igual que el Magic Sneakers original.

### Orden de Implementación Sugerido
1. types.ts (ampliar con nuevas interfaces)
2. Renombrar shoe → item (commit atómico)
3. Configs de tenant (3 archivos + loader)
4. useTenantConfig hook
5. Adaptar Setup.tsx
6. Extraer pdfExport.ts y imageUtils.ts
7. Tests de verificación
