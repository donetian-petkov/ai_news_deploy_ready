#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f ".env" ]]; then
  cp ".env.example" ".env"
  echo "Created .env from .env.example"
fi

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npm run prisma:generate

echo "Applying database migrations..."
npm run prisma:migrate

echo "Building apps..."
npm run build

cat <<'EOF'
Install complete.

Next steps:
1) Edit .env and set:
   - AUTH_TOKEN_SECRET
   - KEY_ENCRYPTION_SECRET
   - provider API keys (optional fallback)
2) Start services:
   npm run start
EOF
