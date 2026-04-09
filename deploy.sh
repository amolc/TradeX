#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
ADMIN_FRONTEND_DIR="$ROOT_DIR/admin-frontend"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not installed or not available in PATH."
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is not installed or not available in PATH."
  exit 1
fi

build_app() {
  local app_dir="$1"

  if [ ! -f "$app_dir/package.json" ]; then
    echo "Missing package.json in $app_dir"
    exit 1
  fi

  cd "$app_dir"
  npm install
  npm run build
}

build_app "$FRONTEND_DIR"
build_app "$ADMIN_FRONTEND_DIR"

cd "$ROOT_DIR"
git add -A

if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

COMMIT_MESSAGE="${1:-}"

if [ -z "$COMMIT_MESSAGE" ]; then
  read -r -p "Enter commit message: " COMMIT_MESSAGE
fi

if [ -z "$COMMIT_MESSAGE" ]; then
  echo "Commit message cannot be empty."
  exit 1
fi

git commit -m "$COMMIT_MESSAGE"

echo "Deployment build and commit completed."
