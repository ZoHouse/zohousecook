#!/usr/bin/env bash
set -euo pipefail

SOURCE="${CONDUCTOR_ROOT_PATH:-$HOME/zo-world/repos/zo.xyz}"
DEST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "→ Conductor setup"
echo "  source: $SOURCE"
echo "  dest:   $DEST"

if [ ! -d "$SOURCE" ]; then
  echo "✗ source repo not found at $SOURCE" >&2
  exit 1
fi

echo "→ syncing .env* files from apps/"
shopt -s nullglob
for env_file in "$SOURCE"/apps/*/.env*; do
  rel="${env_file#$SOURCE/}"
  target="$DEST/$rel"
  mkdir -p "$(dirname "$target")"
  cp "$env_file" "$target"
done
shopt -u nullglob

if [ -f "$SOURCE/.env" ]; then
  cp "$SOURCE/.env" "$DEST/.env"
fi

echo "→ yarn install"
cd "$DEST"
yarn install --frozen-lockfile

echo "✓ setup complete"
