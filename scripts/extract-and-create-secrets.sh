#!/bin/bash
set -e

# Extract secrets from existing .env files and create AWS Secrets Manager secrets
# Account ID: 670664477975
# Region: ap-south-1

ACCOUNT_ID="670664477975"
REGION="ap-south-1"
PROJECT_NAME="mono-front"

echo "🔍 Extracting secrets from existing .env files"
echo "================================================"
echo ""

# Function to extract and merge env vars from multiple files
merge_env_files() {
    local ENV_TYPE=$1
    local OUTPUT_FILE=$2
    
    echo "{" > $OUTPUT_FILE
    
    # Find all env files for this environment
    find apps -name ".env.$ENV_TYPE" -type f | while read envfile; do
        echo "   Reading: $envfile"
        # Extract NEXT_PUBLIC_ and other important vars, convert to JSON
        grep -E '^(NEXT_PUBLIC_|SENTRY_|API_|WEB_|TRIP_|POA_|DATABASE_|SLACK_|OPENAI_|MAPBOX_|PORT|NODE_ENV)' "$envfile" 2>/dev/null | grep -v '^#' | while IFS='=' read -r key value; do
            # Remove quotes if present
            value=$(echo "$value" | sed 's/^"//; s/"$//')
            # Escape special characters for JSON
            value=$(echo "$value" | sed 's/\\/\\\\/g; s/"/\\"/g')
            echo "  \"$key\": \"$value\","
        done
    done >> $OUTPUT_FILE
    
    # Remove trailing comma and close JSON
    sed -i '' '$ s/,$//' $OUTPUT_FILE
    echo "}" >> $OUTPUT_FILE
    
    # Clean up and format JSON
    cat $OUTPUT_FILE | jq -s 'add | with_entries(select(.value != ""))' > "${OUTPUT_FILE}.tmp" 2>/dev/null || {
        # If jq fails, create basic valid JSON
        echo '{}' > "${OUTPUT_FILE}.tmp"
    }
    mv "${OUTPUT_FILE}.tmp" $OUTPUT_FILE
}

# Extract staging secrets
echo "1️⃣  Extracting staging environment variables..."
merge_env_files "staging" "/tmp/staging-secrets.json"
echo ""

# Extract production secrets
echo "2️⃣  Extracting production environment variables..."
merge_env_files "production" "/tmp/production-secrets.json"
echo ""

# Show what was extracted
echo "📋 Extracted Secrets Summary"
echo "============================="
echo ""
echo "Staging secrets:"
jq 'keys | length' /tmp/staging-secrets.json 2>/dev/null || echo "0"
echo " unique keys found"
echo ""
echo "Production secrets:"
jq 'keys | length' /tmp/production-secrets.json 2>/dev/null || echo "0"
echo " unique keys found"
echo ""

# Ask for confirmation
echo "⚠️  Preview of staging secrets:"
jq '.' /tmp/staging-secrets.json 2>/dev/null | head -20
echo ""
echo "... (use 'cat /tmp/staging-secrets.json' to see all)"
echo ""

read -p "Create/update AWS Secrets Manager with these values? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Secrets saved to:"
    echo "   /tmp/staging-secrets.json"
    echo "   /tmp/production-secrets.json"
    exit 1
fi

# Create/update staging secrets
echo ""
echo "3️⃣  Creating/updating staging secrets in AWS..."
aws secretsmanager create-secret \
  --name ${PROJECT_NAME}-staging-secrets \
  --description "Environment variables for ${PROJECT_NAME} staging (from .env.staging files)" \
  --secret-string file:///tmp/staging-secrets.json \
  --region $REGION 2>/dev/null || {
    echo "   Secret exists. Updating..."
    aws secretsmanager put-secret-value \
      --secret-id ${PROJECT_NAME}-staging-secrets \
      --secret-string file:///tmp/staging-secrets.json \
      --region $REGION
  }

STAGING_ARN=$(aws secretsmanager describe-secret \
  --secret-id ${PROJECT_NAME}-staging-secrets \
  --region $REGION \
  --query ARN \
  --output text)

echo "✅ Staging secrets created"
echo ""

# Create/update production secrets
echo "4️⃣  Creating/updating production secrets in AWS..."
aws secretsmanager create-secret \
  --name ${PROJECT_NAME}-production-secrets \
  --description "Environment variables for ${PROJECT_NAME} production (from .env.production files)" \
  --secret-string file:///tmp/production-secrets.json \
  --region $REGION 2>/dev/null || {
    echo "   Secret exists. Updating..."
    aws secretsmanager put-secret-value \
      --secret-id ${PROJECT_NAME}-production-secrets \
      --secret-string file:///tmp/production-secrets.json \
      --region $REGION
  }

PRODUCTION_ARN=$(aws secretsmanager describe-secret \
  --secret-id ${PROJECT_NAME}-production-secrets \
  --region $REGION \
  --query ARN \
  --output text)

echo "✅ Production secrets created"
echo ""

# Extract suffixes and update workflow files
STAGING_SUFFIX=$(echo $STAGING_ARN | grep -oE '[A-Za-z0-9]{6}$')
PRODUCTION_SUFFIX=$(echo $PRODUCTION_ARN | grep -oE '[A-Za-z0-9]{6}$')

echo "5️⃣  Updating workflow files with complete secret ARNs..."
echo "   Staging suffix: $STAGING_SUFFIX"
echo "   Production suffix: $PRODUCTION_SUFFIX"

# Update workflow files if they still have placeholder
sed -i '' "s|secret:mono-front-staging-secrets\"|secret:mono-front-staging-secrets-$STAGING_SUFFIX\"|g" .github/workflows/deploy-staging.yml
sed -i '' "s|secret:mono-front-production-secrets\"|secret:mono-front-production-secrets-$PRODUCTION_SUFFIX\"|g" .github/workflows/deploy.yml
sed -i '' "s|secret:mono-front-staging-secrets\"|secret:mono-front-staging-secrets-$STAGING_SUFFIX\"|g" .github/workflows/demo-environment.yml
sed -i '' "s|secret:mono-front-production-secrets\"|secret:mono-front-production-secrets-$PRODUCTION_SUFFIX\"|g" .github/workflows/demo-environment.yml

# Update script
sed -i '' "s|secret:mono-front-staging-secrets|secret:mono-front-staging-secrets-$STAGING_SUFFIX|g" scripts/generate-task-definition.sh
sed -i '' "s|secret:mono-front-production-secrets|secret:mono-front-production-secrets-$PRODUCTION_SUFFIX|g" scripts/generate-task-definition.sh

echo "✅ Workflow files updated"
echo ""

# Summary
echo "📋 Final Summary"
echo "================"
echo ""
echo "✅ Secrets created from existing .env files!"
echo ""
echo "Staging Secret ARN:"
echo "  $STAGING_ARN"
echo ""
echo "Production Secret ARN:"
echo "  $PRODUCTION_ARN"
echo ""
echo "Secret keys extracted:"
echo "  Staging: $(jq 'keys | length' /tmp/staging-secrets.json) keys"
echo "  Production: $(jq 'keys | length' /tmp/production-secrets.json) keys"
echo ""
echo "✅ All workflow files updated with complete ARNs"
echo ""
echo "⚠️  NEXT STEPS:"
echo ""
echo "1. Review secrets in AWS Console:"
echo "   https://console.aws.amazon.com/secretsmanager/home?region=$REGION"
echo ""
echo "2. You can now DELETE the .env files from the repository:"
echo "   git rm apps/*/.env.production apps/*/.env.staging apps/*/.env.local"
echo "   git commit -m 'Remove environment files (moved to AWS Secrets Manager)'"
echo ""
echo "3. Test deployment to staging"
echo ""

