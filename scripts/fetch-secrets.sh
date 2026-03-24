#!/bin/bash
set -e

# Usage: ./scripts/fetch-secrets.sh <environment>
# Environment: staging | production

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Error: Environment parameter required (staging or production)"
  exit 1
fi

# Determine the secret ARN based on environment
if [ "$ENVIRONMENT" = "production" ]; then
  SECRET_NAME="mono-front-production-secrets"
elif [ "$ENVIRONMENT" = "staging" ]; then
  SECRET_NAME="mono-front-staging-secrets"
else
  echo "Error: Invalid environment. Use 'staging' or 'production'"
  exit 1
fi

echo "Fetching secrets from AWS Secrets Manager: $SECRET_NAME"

# Fetch the secret value from AWS Secrets Manager
SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --query SecretString \
  --output text)

# Export each key-value pair as an environment variable
# Only export NEXT_PUBLIC_* variables for build-time use
echo "$SECRET_JSON" | jq -r 'to_entries | .[] | select(.key | startswith("NEXT_PUBLIC_")) | "\(.key)=\(.value)"' >> $GITHUB_ENV

echo "✅ Secrets fetched and exported to GITHUB_ENV"

