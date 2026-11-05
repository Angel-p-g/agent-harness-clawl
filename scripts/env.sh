#!/usr/bin/env bash
# Source this file to use the project-local Node.js and pnpm:
#
#   . ./scripts/env.sh
#
# Everything lives under .local/ so the system toolchain is untouched.

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]:-$0}")/.." && pwd)"

case ":$PATH:" in
  *":$PROJECT_ROOT/.local/bin:"*) ;;
  *) export PATH="$PROJECT_ROOT/.local/bin:$PATH" ;;
esac

export npm_config_cache="$PROJECT_ROOT/.local/npm-cache"
export npm_config_userconfig="$PROJECT_ROOT/.npmrc"
export PNPM_HOME="$PROJECT_ROOT/.local/pnpm"
export COREPACK_HOME="$PROJECT_ROOT/.local/corepack"

echo "dsh-mini: node $(node --version), npm $(npm --version), pnpm $(pnpm --version)"
