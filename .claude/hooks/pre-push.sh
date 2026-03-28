#!/bin/bash
# Quality gate: pre-push guardrail enforcement
# Heavier checks that must pass before code leaves the machine

set -e

echo "🚀 Running pre-push guardrail checks..."

# ============================================
# RED LINE 5: Build must pass
# ============================================
echo "Building..."
BUILD_OUTPUT=$(npx next build 2>&1) || {
  echo "❌ RED LINE: Build failed. Fix before pushing."
  echo "$BUILD_OUTPUT" | tail -20
  exit 1
}
echo "✅ Build passed."

# ============================================
# RED LINE 4: Never force push main
# ============================================
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  echo "⚠️  Pushing to $CURRENT_BRANCH. Make sure this is intentional."
fi

# ============================================
# GREEN LINE 11: Sidebar links have pages
# ============================================
if git diff HEAD~1..HEAD --name-only 2>/dev/null | grep -q 'Sidebar.tsx'; then
  echo "⚠️  Sidebar was modified in recent commit — verify all links have working pages."
fi

# ============================================
# GREEN LINE 12: No raw Supabase in API routes
# ============================================
RAW_SUPABASE_COUNT=$(grep -r 'supabase\.from(' src/app/api/ --include='*.ts' 2>/dev/null | wc -l || true)
if [ "$RAW_SUPABASE_COUNT" -gt 0 ]; then
  echo "⚠️  Found $RAW_SUPABASE_COUNT raw Supabase queries in API routes. Should use Prisma."
fi

echo "✅ Pre-push checks passed. Ship it! 🚢"
