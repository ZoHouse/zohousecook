#!/bin/bash
set -e

# Create basic AWS Secrets Manager secrets with placeholder values
# You can update these later with actual values

ACCOUNT_ID="670664477975"
REGION="ap-south-1"
PROJECT_NAME="mono-front"

echo "🔒 Creating AWS Secrets Manager Secrets"
echo "========================================"
echo ""

# Create basic secrets JSON
BASIC_SECRETS='{
  "NEXT_PUBLIC_ZO_CLIENT_KEY": "CHANGE_ME",
  "NEXT_PUBLIC_ZOSTEL_SUPPORT_NUMBER": "+1234567890",
  "NEXT_PUBLIC_ZO_TRIPS_SUPPORT_NUMBER": "+1234567890",
  "NEXT_PUBLIC_ZOSTEL_BASE_URL": "https://zostel.com",
  "NEXT_PUBLIC_ZOSTEL_CLIENT_ID": "CHANGE_ME",
  "NEXT_PUBLIC_ZO_API_BASE_URL": "https://api.zo.xyz",
  "NEXT_PUBLIC_ZOSTEL_API_BASE_URL": "https://api.zostel.com",
  "NEXT_PUBLIC_GTM_ID": "GTM-XXXXXXX",
  "NEXT_PUBLIC_META_PIXEL_ZOSTEL": "123456789",
  "NEXT_PUBLIC_META_PIXEL_ZO_TRIPS": "987654321",
  "NEXT_PUBLIC_SENTRY_DSN": "https://example@sentry.io/123456",
  "SENTRY_DSN": "https://example@sentry.io/123456",
  "NEXT_PUBLIC_ROBOTS_ENABLED": "false",
  "NEXT_PUBLIC_GOOGLE_MAPS_KEY": "CHANGE_ME",
  "NEXT_PUBLIC_MOENGAGE_APP_ID": "CHANGE_ME",
  "NEXT_PUBLIC_MOENGAGE_CLUSTER_ID": "dc_5"
}'

# Create staging secrets
echo "1️⃣  Creating staging secrets..."
aws secretsmanager create-secret \
  --name ${PROJECT_NAME}-staging-secrets \
  --description "Environment variables for ${PROJECT_NAME} staging" \
  --secret-string "$BASIC_SECRETS" \
  --region $REGION 2>/dev/null || {
    echo "   Secret already exists. Updating..."
    aws secretsmanager put-secret-value \
      --secret-id ${PROJECT_NAME}-staging-secrets \
      --secret-string "$BASIC_SECRETS" \
      --region $REGION
  }

STAGING_ARN=$(aws secretsmanager describe-secret \
  --secret-id ${PROJECT_NAME}-staging-secrets \
  --region $REGION \
  --query ARN \
  --output text)

echo "✅ Staging secrets created"
echo ""

# Create production secrets (with robots enabled)
PROD_SECRETS=$(echo "$BASIC_SECRETS" | jq '.NEXT_PUBLIC_ROBOTS_ENABLED = "true" | .NEXT_PUBLIC_ASSET_PREFIX = "https://cdn.example.com" | .SENTRY_AUTH_TOKEN = "CHANGE_ME"')

echo "2️⃣  Creating production secrets..."
aws secretsmanager create-secret \
  --name ${PROJECT_NAME}-production-secrets \
  --description "Environment variables for ${PROJECT_NAME} production" \
  --secret-string "$PROD_SECRETS" \
  --region $REGION 2>/dev/null || {
    echo "   Secret already exists. Updating..."
    aws secretsmanager put-secret-value \
      --secret-id ${PROJECT_NAME}-production-secrets \
      --secret-string "$PROD_SECRETS" \
      --region $REGION
  }

PRODUCTION_ARN=$(aws secretsmanager describe-secret \
  --secret-id ${PROJECT_NAME}-production-secrets \
  --region $REGION \
  --query ARN \
  --output text)

echo "✅ Production secrets created"
echo ""

# Extract the suffix from the ARN (last 6 characters)
STAGING_SUFFIX=$(echo $STAGING_ARN | grep -oE '[A-Za-z0-9]{6}$')
PRODUCTION_SUFFIX=$(echo $PRODUCTION_ARN | grep -oE '[A-Za-z0-9]{6}$')

echo "3️⃣  Updating workflow files with secret ARNs..."
echo "   Staging suffix: $STAGING_SUFFIX"
echo "   Production suffix: $PRODUCTION_SUFFIX"

# Update workflow files
sed -i '' "s|secret:mono-front-staging-secrets|secret:mono-front-staging-secrets-$STAGING_SUFFIX|g" .github/workflows/deploy-staging.yml
sed -i '' "s|secret:mono-front-production-secrets|secret:mono-front-production-secrets-$PRODUCTION_SUFFIX|g" .github/workflows/deploy.yml
sed -i '' "s|secret:mono-front-staging-secrets|secret:mono-front-staging-secrets-$STAGING_SUFFIX|g" .github/workflows/demo-environment.yml
sed -i '' "s|secret:mono-front-production-secrets|secret:mono-front-production-secrets-$PRODUCTION_SUFFIX|g" .github/workflows/demo-environment.yml

# Update script
sed -i '' "s|secret:mono-front-staging-secrets|secret:mono-front-staging-secrets-$STAGING_SUFFIX|g" scripts/generate-task-definition.sh
sed -i '' "s|secret:mono-front-production-secrets|secret:mono-front-production-secrets-$PRODUCTION_SUFFIX|g" scripts/generate-task-definition.sh

echo "✅ Workflow files updated"
echo ""

# Summary
echo "📋 Summary"
echo "=========="
echo ""
echo "✅ Secrets created with placeholder values!"
echo ""
echo "Staging Secret ARN:"
echo "  $STAGING_ARN"
echo ""
echo "Production Secret ARN:"
echo "  $PRODUCTION_ARN"
echo ""
echo "⚠️  IMPORTANT: Update secrets with real values:"
echo ""
echo "To update staging secrets:"
echo '  aws secretsmanager put-secret-value \'
echo "    --secret-id ${PROJECT_NAME}-staging-secrets \\"
echo '    --secret-string '"'"'{"NEXT_PUBLIC_ZO_CLIENT_KEY":"your-value",...}'"'"
echo ""
echo "To update production secrets:"
echo '  aws secretsmanager put-secret-value \'
echo "    --secret-id ${PROJECT_NAME}-production-secrets \\"
echo '    --secret-string '"'"'{"NEXT_PUBLIC_ZO_CLIENT_KEY":"your-value",...}'"'"
echo ""
echo "Or use AWS Console > Secrets Manager to edit"
echo ""

