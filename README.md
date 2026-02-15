# GTME – Sistema agentico backoffice

Monorepo con backoffice Next.js y servicio de agentes Python para listar y analizar negocios mediante chat.

## Estructura

- **apps/backoffice** – Next.js 15, Auth (Supabase + Google @plinng), Chat, Negocios, Inngest, Drizzle + Supabase
- **apps/agent-service** – FastAPI, LangGraph orquestador, agentes (reputación), skills (SerpAPI, web scan), Vertex AI Gemini, LangSmith
- **packages/shared-types** – Tipos compartidos (opcional)

## Desarrollo local

### Requisitos

- Node 20+, pnpm
- Python 3.11+
- Cuenta Supabase, Google Cloud (Vertex AI), opcional SerpAPI y LangSmith

### 1. Instalar dependencias

```bash
pnpm install
cd apps/agent-service && pip install -r requirements.txt
```

### 2. Variables de entorno

Copiar `.env.example` a `apps/backoffice/.env.local` y `apps/agent-service/.env`. Rellenar al menos:

- **Backoffice**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL` (connection string de Supabase), `ALLOWED_EMAIL_DOMAIN=plinng.com`
- **Agent-service**: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, credenciales (o `GOOGLE_APPLICATION_CREDENTIALS`), opcional `SERPAPI_API_KEY`, `LANGCHAIN_API_KEY`

### 3. Base de datos

En Supabase (o Postgres), ejecutar las migraciones Drizzle:

```bash
cd apps/backoffice && pnpm db:migrate
```

(O aplicar manualmente el SQL en `apps/backoffice/drizzle/`.)

### 4. Arrancar

- Backoffice: `pnpm --filter backoffice dev` (desde la raíz) o `cd apps/backoffice && pnpm dev`
- Agent-service: `cd apps/agent-service && uvicorn app.main:app --reload --port 8000`
- Inngest dev: si usas Inngest Cloud, apuntar el dev server a la URL del backoffice

### 5. Login

En Supabase Dashboard → Authentication → Providers, activar Google y configurar la URL de callback (ej. `http://localhost:3000/auth/callback`). Solo correos `@plinng.com` podrán acceder (configurable con `ALLOWED_EMAIL_DOMAIN`).

## Despliegue (Railway)

1. **Backoffice**
   - Nuevo servicio desde este repo.
   - Root path: `apps/backoffice`.
   - Build: `pnpm install && pnpm build`.
   - Start: `pnpm start`.
   - Variables: todas las de backoffice (Supabase, `DATABASE_URL`, `AGENT_SERVICE_URL` apuntando al agente, `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`, `ALLOWED_EMAIL_DOMAIN`).

2. **Agent-service**
   - Nuevo servicio desde este repo.
   - Dockerfile: usar el de `apps/agent-service/Dockerfile` (build context: `apps/agent-service`).
   - Variables: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, credenciales Vertex, `SERPAPI_API_KEY`, `LANGCHAIN_*`.

3. **Inngest**
   - Registrar la app en Inngest Cloud con la URL pública del backoffice (ej. `https://backoffice.railway.app/api/inngest`).

## Flujo

1. Usuario escribe en el chat del backoffice.
2. Next.js guarda el mensaje, crea un `agent_run` y encola un evento Inngest `agent/run.requested`.
3. Inngest llama al agent-service `POST /run` con el contenido y los últimos mensajes.
4. El orquestador (LangGraph) decide si delegar al agente de reputación (SerpAPI) o responder directamente; sintetiza la respuesta.
5. Inngest recibe la respuesta y actualiza `agent_runs`, escribe el mensaje del asistente y persiste `businesses` y `business_collected_data` en Supabase.
6. El frontend actualiza el chat (polling o recarga) y puede ver los negocios en `/negocios`.
