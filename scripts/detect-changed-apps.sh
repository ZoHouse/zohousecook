#!/bin/bash
set -e

# This script uses Nx to detect which apps have changed
# Usage: ./scripts/detect-changed-apps.sh <base-ref>

BASE_REF=${1:-origin/staging}

echo "Detecting changed apps compared to $BASE_REF..."

# Get affected apps using Nx
AFFECTED_APPS=$(npx nx show projects --affected --base=$BASE_REF --type=app --json 2>/dev/null || echo "[]")

# Parse the JSON output and filter for deployable apps
# Exclude 'pg' as it contains static HTML files
DEPLOYABLE_APPS=$(echo "$AFFECTED_APPS" | jq -r '.[] | select(. != "pg")')

if [ -z "$DEPLOYABLE_APPS" ]; then
  echo "No apps changed"
  echo "[]"
else
  echo "Changed apps detected:"
  echo "$DEPLOYABLE_APPS" | jq -R . | jq -s .
fi

