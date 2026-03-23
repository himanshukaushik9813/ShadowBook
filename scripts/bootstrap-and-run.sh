#!/usr/bin/env bash
set -euo pipefail

NETWORK="${1:-sepolia}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
ENV_FILE="$ROOT_DIR/.env"
ENV_EXAMPLE="$ROOT_DIR/.env.example"
FRONTEND_ENV_FILE="$FRONTEND_DIR/.env.local"
FRONTEND_ENV_EXAMPLE="$FRONTEND_DIR/.env.local.example"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/bootstrap-and-run.sh [sepolia|arb-sepolia]

What it does:
  1) Installs root + frontend dependencies
  2) Ensures .env and frontend/.env.local exist (copies from examples if missing)
  3) Validates DEPLOYER_PRIVATE_KEY is set
  4) Compiles + deploys contract to selected testnet
  5) Prints deployment info
  6) Starts Next.js frontend dev server
EOF
}

if [[ "$NETWORK" == "-h" || "$NETWORK" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "$NETWORK" != "sepolia" && "$NETWORK" != "arb-sepolia" ]]; then
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

if [[ "$NETWORK" == "sepolia" && -z "${SEPOLIA_RPC_URL:-}" ]]; then
  echo "Warning: SEPOLIA_RPC_URL is empty. Hardhat will use its default public RPC."
fi

if [[ "$NETWORK" == "arb-sepolia" && -z "${ARBITRUM_SEPOLIA_RPC_URL:-}" ]]; then
  echo "Warning: ARBITRUM_SEPOLIA_RPC_URL is empty. Hardhat will use its default public RPC."
fi

echo "==> Installing root dependencies"
npm install

echo "==> Installing frontend dependencies"
npm --prefix frontend install

echo "==> Compiling contracts"
npm run compile

if [[ "$NETWORK" == "sepolia" ]]; then
  echo "==> Deploying to Sepolia"
  npm run deploy:sepolia
else
  echo "==> Deploying to Arbitrum Sepolia"
  npm run deploy:arb-sepolia
fi

echo "==> Deployment file:"
cat "$FRONTEND_DIR/constants/deployment.json"

echo "==> Starting frontend dev server on http://localhost:3000"
npm run frontend:dev

