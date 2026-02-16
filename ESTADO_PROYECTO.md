# Estado del proyecto GTME

Documento de avance y decisiones técnicas hasta la fecha. Complementa `README.md` y `CONFIGURACION_PASO_A_PASO.md`.

---

## Resumen

- **Backoffice**: Next.js 15, Supabase (auth + DB), Drizzle, chat con conversaciones y mensajes.
- **Agent-service**: FastAPI, orquestador LangGraph, Vertex AI (Gemini 2.5 Flash), skills (SerpAPI, web scan), agente de reputación.
- El chat del backoffice llama directamente al agent-service (`POST /run`); no se usa Inngest para encolar mensajes en desarrollo local.

---

## Lo implementado hasta ahora

### Backoffice (Next.js)

- **UI**: Layout con sidebar, páginas Login, Chat, Negocios (lista y detalle). Estilos con Tailwind v4 (`@import "tailwindcss"`, `@source`).
- **Auth**: Login con Google vía Supabase; middleware restringe rutas a usuarios autenticados; dominio permitido configurable (`ALLOWED_EMAIL_DOMAIN`).
- **Chat**: Lista de conversaciones, mensajes por conversación, input para enviar. Mensaje optimista, burbuja “Pensando…” mientras responde el agente, manejo de errores (p. ej. 502).
- **API del chat**: La ruta `api/chat` siempre llama a `executeAgentRun` (agent-service). No se usa Inngest en este flujo.
- **Negocios**: Listado y detalle de negocios desde la base de datos.

### Agent-service (FastAPI)

- **Endpoints**: `POST /run` (ejecutar orquestador con mensaje y contexto), `GET /health`.
- **Orquestador**: LangGraph; delega al agente de reputación cuando aplica; usa Vertex AI (Gemini) para respuestas.
- **Modelo**: Gemini 2.5 Flash (`gemini-2.5-flash`) en Vertex AI.
- **Credenciales**: Se lee la ruta del JSON de cuenta de servicio desde `GOOGLE_APPLICATION_CREDENTIALS` en `.env`. Esa ruta se carga en Settings y se usa para crear credenciales con `service_account.Credentials.from_service_account_file()` y pasarlas explícitamente a `ChatVertexAI(credentials=...)`. Así no se depende de que la variable de entorno esté bien propagada en el proceso (p. ej. con uvicorn --reload).
- **Config**: `.env` se carga desde el directorio del agent-service (no del cwd). Settings usa ese mismo `.env` por ruta absoluta.
- **Arranque**: Script `run.sh` activa el venv si existe, opcionalmente exporta `GOOGLE_APPLICATION_CREDENTIALS` desde `.env` (expandiendo `~`) y arranca uvicorn con `--reload`.

### Dependencias y configuración

- **agent-service**: `python-dotenv` en `requirements.txt`. Venv recomendado en `apps/agent-service/.venv`.
- **backoffice**: Tailwind v4; componentes UI necesarios (accordion, avatar, breadcrumb, dropdown, scroll-area, textarea, etc.).

---

## Cómo arrancar en local

1. **Backoffice**
   ```bash
   pnpm install
   pnpm --filter backoffice dev
   # o: cd apps/backoffice && pnpm dev
   ```

2. **Agent-service**
   ```bash
   cd apps/agent-service
   pip install -r requirements.txt   # preferible dentro de .venv
   ./run.sh
   ```
   El servicio queda en `http://127.0.0.1:8000`. El backoffice debe tener `AGENT_SERVICE_URL` apuntando a esa URL (p. ej. `http://localhost:8000`).

3. **Variables de entorno**
   - Backoffice: `apps/backoffice/.env.local` (Supabase, `DATABASE_URL`, `AGENT_SERVICE_URL`, `ALLOWED_EMAIL_DOMAIN`, etc.).
   - Agent-service: `apps/agent-service/.env` (ver `.env.example`). Imprescindible: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `GOOGLE_APPLICATION_CREDENTIALS` con la ruta al JSON de la cuenta de servicio (p. ej. `~/Documents/donotdelete/mi-cuenta.json`).

---

## Decisión: credenciales Vertex por archivo

Se optó por pasar las credenciales directamente al cliente Vertex AI en lugar de depender solo de la variable de entorno `GOOGLE_APPLICATION_CREDENTIALS` porque, con uvicorn en modo `--reload`, a veces el proceso worker no tenía la variable bien definida y aparecía “Your default credentials were not found”. Al leer la ruta desde el `.env` (Settings) y hacer `Credentials.from_service_account_file(path)` + `ChatVertexAI(credentials=...)`, el comportamiento es estable. La ruta sigue viniendo de configuración (`.env`), no está hardcodeada; no se considera mala práctica.

---

## Referencias

- **Configuración detallada**: `CONFIGURACION_PASO_A_PASO.md`
- **Visión general y despliegue**: `README.md`
