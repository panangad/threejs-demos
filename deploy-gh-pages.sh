#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This script must be run from inside a Git repository." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "The working tree must be clean before deploying." >&2
  exit 1
fi

remote_url="$(git remote get-url origin 2>/dev/null || true)"
if [[ -z "$remote_url" ]]; then
  echo "No 'origin' remote is configured." >&2
  exit 1
fi

repo_name="$(basename "$remote_url" .git)"
if [[ -z "$repo_name" ]]; then
  repo_name="$(basename "$repo_root")"
fi

repo_path="/${repo_name}/"

npm install --no-audit --no-fund
npm run build -- --configuration=production --base-href "$repo_path"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
cp -R "dist/threejs-demos/." "$tmp_dir/"

if git show-ref --verify --quiet refs/heads/gh-pages; then
  git checkout gh-pages
else
  git checkout --orphan gh-pages
fi

find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -R "$tmp_dir/." .

touch .nojekyll

git add -A
if git diff --cached --quiet; then
  echo "No changes to publish." >&2
  git checkout -f master
  exit 0
fi

git commit -m "Deploy to GitHub Pages"
git push origin gh-pages

git checkout -f master
