#!/usr/bin/env bash
set -euo pipefail

patterns=(
  "next start -p 3000"
  "next dev -p 3000"
  "node dist/server.js"
  "tsx watch src/server.ts"
)

stopped=0
for pattern in "${patterns[@]}"; do
  if pgrep -f "$pattern" >/dev/null 2>&1; then
    pkill -f "$pattern" || true
    stopped=1
  fi
done

if [[ $stopped -eq 1 ]]; then
  echo "Stopped local AI News processes."
else
  echo "No local AI News processes were running."
fi
