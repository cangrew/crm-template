#!/usr/bin/env bash
# Run the pgTAP RLS / policy suite against the local Supabase database.
# Requires Docker and the Supabase CLI (installed as a dev dependency).
set -euo pipefail

cd "$(dirname "$0")/../.."

if ! docker info >/dev/null 2>&1; then
  echo "error: Docker is not running. Start Docker, then 'pnpm exec supabase start'." >&2
  exit 1
fi

if ! pnpm exec supabase status >/dev/null 2>&1; then
  echo "Local Supabase stack not running; starting it..."
  pnpm exec supabase start
fi

exec pnpm exec supabase test db
