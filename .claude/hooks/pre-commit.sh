#!/bin/bash
# Quality gate: pre-commit guardrail enforcement
# RED LINE and YELLOW LINE checks from .claude/docs/guardrails.md

set -e
ERRORS=0
WARNINGS=0

echo "🔒 Running guardrail checks..."

# ============================================
# RED LINE 1: Never expose secrets
# ============================================
ENV_FILES=$(git diff --cached --name-only | grep -E '\.env($|\.)' || true)
if [ -n "$ENV_FILES" ]; then
  echo "❌ RED LINE: .env file staged for commit. Never commit secrets."
  echo "   Files: $ENV_FILES"
  ERRORS=$((ERRORS + 1))
fi

# Check for hardcoded secrets patterns in staged changes
SECRET_PATTERNS=$(git diff --cached --diff-filter=ACM -- '*.ts' '*.tsx' | grep -E '^\+.*(sk_live|pk_live|sk_test|RAZORPAY_KEY|OPENAI_API_KEY|SUPABASE_SERVICE_ROLE|password\s*=\s*["\x27][^"\x27]+["\x27])' || true)
if [ -n "$SECRET_PATTERNS" ]; then
  echo "❌ RED LINE: Possible hardcoded secret detected in staged changes."
  echo "   Move to environment variables."
  ERRORS=$((ERRORS + 1))
fi

# ============================================
# RED LINE 3: Never break auth boundaries
# ============================================
# Check if customer routes are being gated behind admin auth
CUSTOMER_AUTH_LEAK=$(git diff --cached --diff-filter=ACM -- 'src/app/cafe/order/**' | grep -c 'ZoPassportGate\|AdminShell\|requireAuth' || true)
if [ "$CUSTOMER_AUTH_LEAK" -gt 0 ]; then
  echo "❌ RED LINE: Admin auth detected in customer route (/cafe/order/*)."
  echo "   Customer routes must use CustomerAuthGate, never admin auth."
  ERRORS=$((ERRORS + 1))
fi

# ============================================
# GREEN LINE 12: Every API route uses Prisma
# ============================================
RAW_SUPABASE=$(git diff --cached --diff-filter=ACM -- 'src/app/api/**' | grep -c '^\+.*supabase\.from(' || true)
if [ "$RAW_SUPABASE" -gt 0 ]; then
  echo "❌ GREEN LINE: Raw Supabase query in API route. Use Prisma instead."
  echo "   supabase.from() is only for Realtime subscriptions in components."
  ERRORS=$((ERRORS + 1))
fi

# ============================================
# GREEN LINE 13: No 'any' types
# ============================================
ANY_TYPES=$(git diff --cached --diff-filter=ACM -- '*.ts' '*.tsx' | grep -cE '^\+.*:\s*any\b' || true)
if [ "$ANY_TYPES" -gt 2 ]; then
  echo "⚠️  YELLOW: $ANY_TYPES 'any' types added. Define proper types instead."
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================
# YELLOW LINE 8: Payment code changes
# ============================================
PAYMENT_CHANGES=$(git diff --cached --name-only | grep -E 'payments|order-calculator|razorpay' || true)
if [ -n "$PAYMENT_CHANGES" ]; then
  echo "⚠️  YELLOW LINE: Payment code modified. Double-check price math (paise!) and signature validation."
  echo "   Files: $PAYMENT_CHANGES"
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================
# YELLOW LINE 7: Shared component changes
# ============================================
SHARED_CHANGES=$(git diff --cached --name-only | grep -E '(Sidebar\.tsx|admin-shell\.tsx|Header\.tsx|prisma\.ts|layout\.tsx|globals\.css)$' || true)
if [ -n "$SHARED_CHANGES" ]; then
  echo "⚠️  YELLOW LINE: Shared component modified — changes ripple across the entire app."
  echo "   Files: $SHARED_CHANGES"
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================
# YELLOW LINE 6: Schema changes
# ============================================
SCHEMA_CHANGES=$(git diff --cached --name-only | grep 'schema.prisma' || true)
if [ -n "$SCHEMA_CHANGES" ]; then
  echo "⚠️  YELLOW LINE: Prisma schema modified. Remember: npx prisma generate before build."
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================
# Cleanup: console.log
# ============================================
CONSOLE_LOGS=$(git diff --cached --diff-filter=ACM -- '*.ts' '*.tsx' | grep -c '^\+.*console\.log(' || true)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
  echo "⚠️  $CONSOLE_LOGS console.log() found. Remove before shipping to production."
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================
# Summary
# ============================================
echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "🚫 $ERRORS RED LINE violation(s) found. Commit blocked."
  echo "   Fix these before committing. See .claude/docs/guardrails.md"
  exit 1
fi

if [ "$WARNINGS" -gt 0 ]; then
  echo "⚠️  $WARNINGS warning(s). Review before pushing."
fi

echo "✅ Guardrail checks passed."
