#!/usr/bin/env bash
# Arranca el agent-service. Usa el venv si existe.
set -e
cd "$(dirname "$0")"

# Exportar GOOGLE_APPLICATION_CREDENTIALS desde .env (ruta absoluta, expandir ~) para que
# esté disponible antes de que arranque Python y no dependa del orden de imports.
if [[ -f .env ]]; then
  creds=$(grep -E '^GOOGLE_APPLICATION_CREDENTIALS=' .env | cut -d= -f2- | sed "s/^['\"]//;s/['\"]$//" | tr -d ' ')
  if [[ -n "$creds" ]]; then
    creds="${creds/#\~/$HOME}"
    export GOOGLE_APPLICATION_CREDENTIALS="$creds"
  fi
fi

if [[ -d .venv ]]; then
  exec .venv/bin/python -m uvicorn app.main:app --reload --port 8000
else
  exec python3 -m uvicorn app.main:app --reload --port 8000
fi
