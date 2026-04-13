#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -n "${NEWS_NODE_BIN:-}" ]]; then
  export PATH="${NEWS_NODE_BIN}:$PATH"
elif [[ -d "$HOME/.nvm/versions/node/v22.11.0/bin" ]]; then
  export PATH="$HOME/.nvm/versions/node/v22.11.0/bin:$PATH"
fi

export XDG_CACHE_HOME="${XDG_CACHE_HOME:-/tmp/.cache}"
export PRISMA_ENGINES_CACHE_DIR="${PRISMA_ENGINES_CACHE_DIR:-$XDG_CACHE_HOME/prisma}"

mkdir -p "$XDG_CACHE_HOME" "$PRISMA_ENGINES_CACHE_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not available on PATH." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not available on PATH." >&2
  exit 1
fi
