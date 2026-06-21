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

# WSL: open Windows default browser after the server starts
if grep -qi microsoft /proc/version 2>/dev/null; then
  (sleep 2 && cmd.exe /c start http://localhost:3000 >/dev/null 2>&1) &
fi

echo ""
echo "  → Open in browser: http://localhost:3000"
echo "  → Admin:           http://localhost:3000/admin"
echo ""

exec npx next dev -H 0.0.0.0
