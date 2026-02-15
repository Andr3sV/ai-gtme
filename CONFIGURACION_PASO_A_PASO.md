# Configuración paso a paso (guía no técnica)

Esta guía te dice **qué tienes que crear o configurar** y **dónde copiar cada valor** para que el sistema funcione. Hazlo en el orden indicado.

---

## Resumen de lo que vas a configurar

1. **Supabase** – Base de datos y login con Google.
2. **Google Cloud** – Para que el agente use Gemini (IA).
3. **Opcional: SerpAPI** – Para búsquedas de Google (listados de negocios).
4. **Opcional: LangSmith** – Para ver cómo responde el agente (depuración).
5. **Opcional: Inngest** – Para encolar mensajes del chat (si desplegás en internet).

---

## 1. Supabase (base de datos y login)

### 1.1 Crear el proyecto

1. Entrá a [supabase.com](https://supabase.com) e iniciá sesión (o creá una cuenta).
2. Clic en **New project**.
3. Elegí un nombre (ej. `gtme`), una contraseña para la base de datos (guardala en un lugar seguro) y la región más cercana. Clic en **Create new project** y esperá unos minutos.

### 1.2 Obtener las URLs y claves

1. En el menú izquierdo: **Project Settings** (ícono de engranaje).
2. En **API** vas a ver:
   - **Project URL** → lo vas a usar como `NEXT_PUBLIC_SUPABASE_URL`.
   - **anon public** (clave larga) → lo vas a usar como `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **service_role** (clave larga, “secret”) → lo vas a usar como `SUPABASE_SERVICE_ROLE_KEY`. No la compartas.
3. En **Database** → **Connection string** elegí **URI** y copiá la cadena (empieza con `postgresql://`). Esa es tu `DATABASE_URL`. Si te pide contraseña, usá la que pusiste al crear el proyecto.

### 1.3 Activar login con Google

1. En el menú: **Authentication** → **Providers**.
2. Buscá **Google** y activalo (Enable).
3. Vas a necesitar **Client ID** y **Client Secret** de Google:
   - Entrá a [Google Cloud Console](https://console.cloud.google.com/) (si no tenés proyecto, creá uno).
   - **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
   - Tipo: **Web application**. Nombre: por ejemplo “Supabase GTME”.
   - En **Authorized redirect URIs** agregá:  
     `https://TU-PROYECTO.supabase.co/auth/v1/callback`  
     (reemplazá TU-PROYECTO por el nombre de tu proyecto Supabase).
   - Creá y copiá **Client ID** y **Client Secret**.
4. Pegá esos dos valores en Supabase en el proveedor Google y guardá.

### 1.4 Crear las tablas en la base de datos

Las tablas del sistema están definidas en código. Un desarrollador puede ejecutar las migraciones con:

- En la carpeta del backoffice: `pnpm db:migrate` (con `DATABASE_URL` ya configurada).

Si no podés ejecutar eso, se puede aplicar a mano el archivo SQL que está en:

- `apps/backoffice/drizzle/0000_wide_scorpion.sql`

(copiando su contenido en Supabase: **SQL Editor** → New query → pegar → Run).

---

## 2. Google Cloud (Vertex AI / Gemini)

El agente usa Gemini a través de Google Cloud. Necesitás un proyecto y activar la API.

### 2.1 Proyecto y facturación

1. Entrá a [Google Cloud Console](https://console.cloud.google.com/).
2. Si no tenés proyecto: **Select a project** → **New Project** → nombre (ej. `gtme-agentes`) → Create.
3. Facturación: **Billing** → vinculá una cuenta de facturación (Vertex tiene capa gratuita, pero pide tarjeta).

### 2.2 Activar Vertex AI

1. En el buscador de la consola escribí **Vertex AI API**.
2. Entrá a **Vertex AI API** y clic en **Enable**.

### 2.3 Credenciales para el agente (servicio local o servidor)

Para que el **agent-service** (Python) pueda usar Vertex:

**Opción A – En tu computadora (desarrollo):**

1. Instalá [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) y en la terminal ejecutá:  
   `gcloud auth application-default login`  
   e iniciá sesión con tu cuenta de Google.
2. No hace falta crear un archivo JSON; con eso suele alcanzar.

**Opción B – En un servidor (Railway, etc.):**

1. En Google Cloud: **IAM & Admin** → **Service Accounts** → **Create Service Account**.
2. Nombre: por ejemplo `gtme-agent`. Asignale el rol **Vertex AI User** (o el que te indiquen).
3. Creá una **key** (JSON) para esa cuenta y descargá el archivo.
4. En el servidor, configurá la variable de entorno `GOOGLE_APPLICATION_CREDENTIALS` con la **ruta a ese archivo JSON** (o el contenido que use tu plataforma).

### 2.4 Variables que tenés que poner

En el archivo de variables del **agent-service** (o donde configures env):

- **GOOGLE_CLOUD_PROJECT**: el ID del proyecto de Google Cloud (ej. `gtme-agentes`).
- **GOOGLE_CLOUD_LOCATION**: por ejemplo `us-central1`.
- **GOOGLE_APPLICATION_CREDENTIALS**: solo si usás archivo JSON (ruta al archivo en el servidor).

---

## 3. Archivo de variables (.env)

Hay **dos** lugares donde se usan variables: el **backoffice** (Next.js) y el **agent-service** (Python). Podés usar el `.env.example` como plantilla.

### 3.1 Backoffice (Next.js)

Creá un archivo llamado `.env.local` dentro de la carpeta `apps/backoffice/` y poné algo así (reemplazá con tus valores):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=la_clave_anon_que_copiaste
SUPABASE_SERVICE_ROLE_KEY=la_clave_service_role
DATABASE_URL=postgresql://postgres.xxx:TU_PASSWORD@xxx.supabase.com:6543/postgres

# Solo usuarios con este dominio pueden entrar
ALLOWED_EMAIL_DOMAIN=plinng.com

# URL del agente (en local suele ser http://localhost:8000)
AGENT_SERVICE_URL=http://localhost:8000
```

- Si después desplegás en internet y usás Inngest, te darán también `INNGEST_SIGNING_KEY` e `INNGEST_EVENT_KEY` para agregar aquí.

### 3.2 Agent-service (Python)

Creá un archivo llamado `.env` dentro de la carpeta `apps/agent-service/` con algo así:

```env
GOOGLE_CLOUD_PROJECT=tu-proyecto-google
GOOGLE_CLOUD_LOCATION=us-central1
```

Si usás archivo de credenciales en el servidor:

```env
GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/archivo.json
```

Opcional (para búsquedas de negocios):

```env
SERPAPI_API_KEY=tu_clave_serpapi
```

Opcional (para ver trazas del agente):

```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=gtme-agents
LANGCHAIN_API_KEY=tu_clave_langsmith
```

---

## 4. SerpAPI (opcional – búsquedas de Google)

Si querés que el agente pueda “buscar en Google” (por ejemplo para listar negocios):

1. Entrá a [serpapi.com](https://serpapi.com) y creá una cuenta.
2. En el dashboard copiá tu **API Key**.
3. En el `.env` del **agent-service** agregá:  
   `SERPAPI_API_KEY=tu_clave_aqui`

Sin esta clave, el agente seguirá funcionando pero no hará búsquedas reales en Google.

---

## 5. LangSmith (opcional – ver qué hace el agente)

Para ver en una web cómo responde el agente (útiles para depurar):

1. Entrá a [smith.langchain.com](https://smith.langchain.com) y creá una cuenta.
2. Creá un proyecto (ej. `gtme-agents`) y copiá tu **API Key**.
3. En el `.env` del **agent-service** agregá:

```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=gtme-agents
LANGCHAIN_API_KEY=tu_clave_langsmith
```

---

## 6. Inngest (solo si desplegás en internet)

Inngest se usa para procesar los mensajes del chat en segundo plano. En local a veces se puede omitir o usar su modo dev.

1. Entrá a [inngest.com](https://www.inngest.com) y creá una cuenta.
2. Creá una app y conectala con la URL de tu backoffice desplegado (ej. `https://tu-app.railway.app/api/inngest`).
3. Te van a dar:
   - **Signing key** → en el backoffice como `INNGEST_SIGNING_KEY`
   - **Event key** (si la usas) → `INNGEST_EVENT_KEY`

---

## 7. Resumen: qué va en cada archivo

| Dónde | Archivo | Qué poner |
|-------|---------|-----------|
| Backoffice | `apps/backoffice/.env.local` | Supabase URL, anon key, service role key, DATABASE_URL, ALLOWED_EMAIL_DOMAIN, AGENT_SERVICE_URL. Si desplegás: INNGEST_SIGNING_KEY (y opcional INNGEST_EVENT_KEY). |
| Agent-service | `apps/agent-service/.env` | GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION y, si aplica, GOOGLE_APPLICATION_CREDENTIALS. Opcional: SERPAPI_API_KEY, LANGCHAIN_* . |

---

## 8. Orden recomendado para no perderse

1. Crear proyecto en **Supabase** y anotar URL + anon key + service_role + DATABASE_URL.
2. Activar **Google (OAuth)** en Supabase y crear credenciales OAuth en Google Cloud; configurar redirect URI de Supabase.
3. Crear/ejecutar las **tablas** en Supabase (migraciones o SQL a mano).
4. Crear proyecto en **Google Cloud**, activar Vertex AI y configurar credenciales (login en tu PC o service account en servidor).
5. Crear **apps/backoffice/.env.local** y **apps/agent-service/.env** con los valores de los pasos anteriores.
6. (Opcional) SerpAPI y LangSmith si los vas a usar.
7. (Si desplegás) Inngest y agregar sus claves al backoffice.

Si en algún paso no tenés acceso técnico (por ejemplo ejecutar migraciones o desplegar), podés pasarle este documento a alguien de tu equipo que sí lo sea; con esto tiene todo lo que debe configurar y dónde va cada valor.
