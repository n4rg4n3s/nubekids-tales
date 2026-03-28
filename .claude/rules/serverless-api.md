---
paths:
  - "api/**/*.ts"
  - "src/services/api/**/*.ts"
  - "functions/**/*.ts"
---

# API Serverless & Backend

## Estrategia de Deploy

```
MVP:  Vercel Edge Functions (o Cloudflare Workers)
      └─ Timeout: 300s (Vercel Pro) — suficiente para pipeline multiagente
      └─ Frontend: Vercel (React SPA)

Escala: Google Cloud Run
        └─ Mismo código en contenedor Docker
        └─ Sin límites de timeout
        └─ Proximidad nativa a Gemini API (mismo cloud)
```

## Principios de Diseño

### Stateless por Defecto
```typescript
// ✅ Todo el estado vive en el cliente o en query params
// La API recibe todo lo necesario en cada request

interface GenerateStoryRequest {
  tenantId: string;
  heroName: string;
  heroPicBase64: string;
  itemPicBase64: string;
  itemModel: string;
  ageGroup: AgeGroup;
  genre: Genre;
  language: Language;
  pedagogyProfile: PedagogyProfile | null;
  friendPicBase64?: string;
  friendItemPicBase64?: string;
}
```

### API Key del Tenant (no del usuario final)
```typescript
// En V1 (MVP): el usuario final pone su propia API key de Gemini
// En V2 (SaaS): el tenant tiene API key propia, gestionada por NubeKids

// Headers de autenticación de tenant:
// Authorization: Bearer <tenant-api-key>
// X-Tenant-Id: shoe-store-acme-001
```

### Endpoints Planificados

| Method | Path | Descripción | Fase |
|--------|------|-------------|------|
| `POST` | `/api/v1/sessions` | Crear sesión de generación | V2 |
| `GET` | `/api/v1/sessions/:id` | Estado de una sesión | V2 |
| `GET` | `/api/v1/tenants/:id/config` | Config del tenant | V2 |
| `POST` | `/api/v1/generate/brief` | Generar AgentBrief (pipeline completo) | V2 |
| `POST` | `/api/v1/generate/page` | Generar una página (beat + imagen) | V2 |
| `GET` | `/health` | Health check | V1 |

### Widget Embebible

```html
<!-- Integración en checkout del tenant -->
<script src="https://cdn.nubekids.io/widget.js"></script>
<nubekids-upsell
  tenant-id="shoe-store-acme-001"
  item-model="Nike Air Max 90 Kids Rojo Talla 32"
  item-category="shoes"
  lang="es"
></nubekids-upsell>
```

El widget es un Web Component que carga la app NubeKids en un iframe
con los parámetros del tenant y el item pre-inyectados.

## Migración Vercel → Cloud Run

```dockerfile
# Dockerfile para Cloud Run (V2)
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
COPY api/ ./api/
EXPOSE 8080
CMD ["node", "api/server.js"]
```

```yaml
# cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: nubekids-api
spec:
  template:
    spec:
      containers:
        - image: gcr.io/nubekids/api
          resources:
            limits:
              memory: 512Mi
              cpu: '1'
          env:
            - name: GEMINI_API_KEY
              valueFrom:
                secretKeyRef:
                  key: gemini-api-key
      timeoutSeconds: 600  # 10 min para pipeline completo
      containerConcurrency: 10
```

## Privacidad — Fotos NO en Backend

```typescript
// Las fotos del niño NUNCA pasan por nuestro backend en V1
// Se envían directamente del navegador a Gemini API
// Nuestro backend solo gestiona: config de tenant, sesiones, metadatos

// Si en V2 necesitamos proxy las llamadas a Gemini:
// - Las imágenes pasan en memoria (no se persisten)
// - Logs NO incluyen base64 de imágenes
// - Sesión se destruye al cerrar el navegador
```

## Anti-Patterns

- ❌ No almacenar fotos de niños en backend ni en logs
- ❌ No asumir que Edge Functions pueden correr indefinidamente — respetar timeouts
- ❌ No poner lógica de negocio que dependa del runtime (Vercel vs Cloud Run)
- ❌ No hardcodear URLs de API — usar variables de entorno
- ❌ No exponer API keys de Gemini en el frontend en producción (solo en MVP con key del usuario)
