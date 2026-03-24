#!/bin/bash
set -e

# Usage: ./scripts/generate-task-definition.sh <template_path> <environment> <output_path> [app_name]
# Example: ./scripts/generate-task-definition.sh aws/task-definition-template.json staging output.json admin

TEMPLATE_PATH=$1
ENVIRONMENT=$2
OUTPUT_PATH=$3
APP_NAME=$4

if [ -z "$TEMPLATE_PATH" ] || [ -z "$ENVIRONMENT" ] || [ -z "$OUTPUT_PATH" ]; then
  echo "Error: Missing required parameters"
  echo "Usage: ./scripts/generate-task-definition.sh <template_path> <environment> <output_path> [app_name]"
  exit 1
fi

# Determine the secret ARN based on environment
if [ "$ENVIRONMENT" = "production" ]; then
  SECRET_ARN="arn:aws:secretsmanager:ap-south-1:670664477975:secret:mono-front-production-secrets"
elif [ "$ENVIRONMENT" = "staging" ]; then
  SECRET_ARN="arn:aws:secretsmanager:ap-south-1:670664477975:secret:mono-front-staging-secrets"
else
  echo "Error: Invalid environment. Use 'staging' or 'production'"
  exit 1
fi

echo "Generating task definition from template..."
echo "Template: $TEMPLATE_PATH"
echo "Environment: $ENVIRONMENT"
echo "Output: $OUTPUT_PATH"
echo "App: ${APP_NAME:-default}"
echo "Secret ARN: $SECRET_ARN"

# Fetch the secret keys from AWS Secrets Manager
SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ARN" \
  --query SecretString \
  --output text)

# Generate secrets array for task definition
SECRETS_ARRAY=$(echo "$SECRET_JSON" | jq -r 'to_entries | map({name: .key, valueFrom: "'"$SECRET_ARN"':\(.key)::"}) | .')

# Read template and inject secrets
jq --argjson secrets "$SECRETS_ARRAY" \
  '.containerDefinitions[0].secrets = $secrets' \
  "$TEMPLATE_PATH" > "$OUTPUT_PATH"

echo "✅ Task definition generated: $OUTPUT_PATH"

