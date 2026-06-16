#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

if [ -f "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  source "$HOME/.nvm/nvm.sh"
fi

# Stop any stale dev server still holding port 3000
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
  lsof -ti:3000 | xargs -r kill -9 2>/dev/null || true
fi

rm -rf .next
rm -rf "${TMPDIR:-/tmp}/bmmapp-next"
exec npx next dev
