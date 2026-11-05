#!/usr/bin/env bash
set -euo pipefail

if node -e 'const n=require("net");const s=n.connect(3000,"127.0.0.1",()=>{s.end();process.exit(0)});s.on("error",()=>process.exit(1));setTimeout(()=>process.exit(1),1000)'; then
  echo "dev server already listening on port 3000"
  exit 0
fi

exec yarn dev --hostname 0.0.0.0 --port 3000
