#!/usr/bin/env bash
# Aplica as migrações em supabase/migrations no projeto remoto.
# Uso: ./scripts/migrate.sh <project-ref>
set -euo pipefail
REF="${1:?Informe o project-ref (Settings > General no Supabase)}"
npx supabase link --project-ref "$REF"
npx supabase db push
echo "Migrações aplicadas."
