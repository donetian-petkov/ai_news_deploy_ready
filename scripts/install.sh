#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f ".env" ]]; then
  cp ".env.example" ".env"
  echo "Created .env from .env.example"
fi

missing_secrets=()
for key in AUTH_TOKEN_SECRET KEY_ENCRYPTION_SECRET; do
  value="$(grep -E "^${key}=" .env 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '\"' | tr -d "'" || true)"
  if [[ -z "${value}" || "${value}" == change-me* ]]; then
    missing_secrets+=("${key}")
  fi
done

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npm run prisma:generate

echo "Applying database migrations..."
npm run prisma:migrate

echo "Building apps..."
npm run build

echo
echo "Install complete."
echo
echo "Next steps:"
echo "1) This script assumes README Step 2 (.env configuration) is already done."
if [[ ${#missing_secrets[@]} -gt 0 ]]; then
  echo "   Missing/placeholder secrets detected:"
  for key in "${missing_secrets[@]}"; do
    echo "   - ${key}"
  done
  echo "   Set these in .env before starting services."
fi
cat <<'EOF'
2) Start services:
   npm run start:server
EOF
cat <<'EOF'

Optional fallback:
- You can set provider API keys in .env (OPENAI/ANTHROPIC/OPENROUTER),
- or sign in from the UI and save provider keys per account.
EOF
