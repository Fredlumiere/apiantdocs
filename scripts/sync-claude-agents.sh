#!/usr/bin/env bash
# Sync Claude Code agent suite from Fredlumiere/apiant-claude-agents into this project.
# Idempotent — safe to re-run. Run from project root.
set -euo pipefail

REPO_URL="git@github.com:Fredlumiere/apiant-claude-agents.git"
HTTPS_URL="https://github.com/Fredlumiere/apiant-claude-agents.git"
DEST=".claude/commands"

if [ ! -f CLAUDE.md ]; then
  echo "Error: must be run from project root (CLAUDE.md not found)." >&2
  exit 1
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

if ! git clone --quiet --depth 1 "$REPO_URL" "$TMP" 2>/dev/null; then
  git clone --quiet --depth 1 "$HTTPS_URL" "$TMP"
fi

mkdir -p "$DEST"
cp "$TMP"/commands/*.md "$DEST"/

count=$(ls "$DEST"/*.md 2>/dev/null | wc -l | tr -d ' ')
echo "Synced $count agents into $DEST"
echo "Review with: git status $DEST"
