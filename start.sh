#!/bin/bash
# Pre-bundled start for memory-constrained hosts (Alwaysdata etc.)
# The main app is fully bundled in dist/index.js (no npm install needed).
# The resolver needs its 2 small deps installed individually to avoid OOM.
echo "Nuvio Live Sports Plugin — zero-install launcher"

# Install resolver deps one-at-a-time (tiny packages, won't OOM)
if [ ! -d "node_modules/big-integer" ]; then
  echo "Installing resolver dependency: big-integer..."
  npm install --no-save --no-audit --no-fund --loglevel=error big-integer 2>/dev/null
fi
if [ ! -d "node_modules/happy-dom" ]; then
  echo "Installing resolver dependency: happy-dom..."
  npm install --no-save --no-audit --no-fund --loglevel=error happy-dom 2>/dev/null
fi

echo "Starting server..."
node dist/index.js
