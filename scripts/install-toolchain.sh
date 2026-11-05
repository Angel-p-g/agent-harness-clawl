#!/usr/bin/env bash
# Install Node.js and pnpm into this repository's .local/ directory.
#
#   ./scripts/install-toolchain.sh
#   source ./scripts/env.sh
#   pnpm install
#
# No sudo, no writes outside the project. Override NODE_VERSION or PNPM_VERSION
# if needed.

set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "$0")/.." && pwd)"
NODE_VERSION="${NODE_VERSION:-v24.22.2}"
PNPM_VERSION="${PNPM_VERSION:-11.28.5}"

case "$(uname -m)" in
  x86_64) NODE_ARCH=x64 ;;
  aarch64 | arm64) NODE_ARCH=arm64 ;;
  *) echo "unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

case "$(uname -s)" in
  Linux) NODE_OS=linux ;;
  Darwin) NODE_OS=darwin ;;
  *) echo "unsupported OS: $(uname -s)" >&2; exit 1 ;;
esac

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

ARCHIVE="node-${NODE_VERSION}-${NODE_OS}-${NODE_ARCH}.tar.xz"
BASE_URL="https://nodejs.org/dist/${NODE_VERSION}"

echo "==> downloading ${ARCHIVE}"
curl -fsSL --retry 3 -o "$TMP_DIR/$ARCHIVE" "$BASE_URL/$ARCHIVE"
curl -fsSL --retry 3 -o "$TMP_DIR/SHASUMS256.txt" "$BASE_URL/SHASUMS256.txt"
(cd "$TMP_DIR" && grep " ${ARCHIVE}\$" SHASUMS256.txt | sha256sum -c -)

echo "==> extracting to .local/node"
rm -rf "$PROJECT_ROOT/.local/node"
mkdir -p "$PROJECT_ROOT/.local/node"
tar -xJf "$TMP_DIR/$ARCHIVE" -C "$PROJECT_ROOT/.local/node" --strip-components=1

mkdir -p "$PROJECT_ROOT/.local/bin" "$PROJECT_ROOT/.local/corepack" "$PROJECT_ROOT/.local/npm-cache" "$PROJECT_ROOT/.local/pnpm"
ln -sfn ../node/bin/node "$PROJECT_ROOT/.local/bin/node"
ln -sfn ../node/bin/npm "$PROJECT_ROOT/.local/bin/npm"
ln -sfn ../node/bin/npx "$PROJECT_ROOT/.local/bin/npx"
ln -sfn ../node/bin/corepack "$PROJECT_ROOT/.local/bin/corepack"

export PATH="$PROJECT_ROOT/.local/bin:$PATH"
export npm_config_cache="$PROJECT_ROOT/.local/npm-cache"

echo "==> installing pnpm@${PNPM_VERSION}"
npm install --prefix "$PROJECT_ROOT/.local/pnpm" --no-audit --no-fund "pnpm@${PNPM_VERSION}"
ln -sfn ../pnpm/node_modules/.bin/pnpm "$PROJECT_ROOT/.local/bin/pnpm"
ln -sfn ../pnpm/node_modules/.bin/pnpx "$PROJECT_ROOT/.local/bin/pnpx"

echo "==> done"
echo "node $(node --version) | npm $(npm --version) | pnpm $(pnpm --version)"
echo "run: source ./scripts/env.sh"
