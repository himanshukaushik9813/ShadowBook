#!/usr/bin/env bash
set -euo pipefail

NETWORK="${1:-fhenix_helium}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
ENV_FILE="$ROOT_DIR/.env"
ENV_EXAMPLE="$ROOT_DIR/.env.example"
FRONTEND_ENV_FILE="$FRONTEND_DIR/.env.local"
FRONTEND_ENV_EXAMPLE="$FRONTEND_DIR/.env.local.example"

usage() {
  cat <<'EOF_USAGE'
Usage:
  ./scripts/bootstrap-and-run.sh [fhenix_helium]

What it does:
  1) Installs root + frontend dependencies
  2) Ensures .env and frontend/.env.local exist (copies from examples if missing)
  3) Validates DEPLOYER_PRIVATE_KEY is set
  4) Compiles + deploys contracts to Fhenix Helium
  5) Optionally seeds the order book if SEED_WALLET_1 is set
  6) Prints deployed contract addresses
  7) Starts the Next.js frontend dev server
EOF_USAGE
}

if [[ "$NETWORK" == "-h" || "$NETWORK" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "$NETWORK" != "fhenix_helium" ]]; then
  echo "Unsupported network: $NETWORK"
  usage
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not installed or not in PATH."
  exit 1
fi

echo "==> Project root: $ROOT_DIR"
cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "==> Creating .env from .env.example"
  cp "$ENV_EXAMPLE" "$ENV_FILE"
fi

if [[ ! -f "$FRONTEND_ENV_FILE" ]]; then
  echo "==> Creating frontend/.env.local from frontend/.env.local.example"
  cp "$FRONTEND_ENV_EXAMPLE" "$FRONTEND_ENV_FILE"
fi

echo "==> Validating required env values"
set +u
source "$ENV_FILE"
set -u

if [[ -z "${DEPLOYER_PRIVATE_KEY:-}" ]]; then
  echo "DEPLOYER_PRIVATE_KEY is missing in $ENV_FILE"
  echo "Set it first, then rerun this script."
  exit 1
fi

if [[ -z "${FHENIX_RPC_URL:-}" ]]; then
  echo "Warning: FHENIX_RPC_URL is empty. Hardhat will use https://api.helium.fhenix.zone"
fi

echo "==> Installing root dependencies"
npm install

echo "==> Installing frontend dependencies"
npm --prefix frontend install

echo "==> Compiling contracts"
npm run compile

echo "==> Deploying to Fhenix Helium"
npm run deploy:helium

if [[ -n "${SEED_WALLET_1:-}" ]]; then
  echo "==> Seeding demo order book"
  npm run seed:helium
fi

echo "==> Deployment file:"
cat "$FRONTEND_DIR/constants/deployment.json"

echo "==> Starting frontend dev server on http://localhost:3000"
npm run frontend:dev
