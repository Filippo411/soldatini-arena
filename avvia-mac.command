#!/bin/bash
# Avvia Soldatini Arena sul tuo Mac (serve Node.js: https://nodejs.org)
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js non è installato. Scaricalo da https://nodejs.org (versione LTS), installalo e riprova."
  echo ""
  read -n 1 -s -r -p "Premi un tasto per chiudere"
  exit 1
fi
(sleep 1; open http://localhost:3000) &
node server.js
