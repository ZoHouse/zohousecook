#!/bin/bash
set -e

# Create AWS Secrets Manager secrets for mono-front
# Account ID: 670664477975
# Region: ap-south-1

ACCOUNT_ID="670664477975"
REGION="ap-south-1"
PROJECT_NAME="mono-front"

echo "🔒 Creating AWS Secrets Manager Secrets"
echo "========================================"
echo ""

# Template for secrets
cat > /tmp/staging-secrets-template.json <<'EOF'
{
  "NEXT_PUBLIC_ZO_CLIENT_KEY": "CHANGE_ME",
  "NEXT_PUBLIC_ZOSTEL_SUPPORT_NUMBER": "CHANGE_ME",
  "NEXT_PUBLIC_ZO_TRIPS_SUPPORT_NUMBER": "CHANGE_ME",
  "NEXT_PUBLIC_ZOSTEL_BASE_URL": "https://staging.zostel.com",
  "NEXT_PUBLIC_ZOSTEL_CLIENT_ID": "CHANGE_ME",
  "NEXT_PUBLIC_ZO_API_BASE_URL": "https://staging-api.zo.xyz",
  "NEXT_PUBLIC_ZOSTEL_API_BASE_URL": "https://staging-api.zostel.com",
  "NEXT_PUBLIC_GTM_ID": "CHANGE_ME",
  "NEXT_PUBLIC_META_PIXEL_ZOSTEL": "CHANGE_ME",
  "NEXT_PUBLIC_META_PIXEL_ZO_TRIPS": "CHANGE_ME",
  "NEXT_PUBLIC_SENTRY_DSN": "CHANGE_ME",
  "SENTRY_DSN": "CHANGE_ME",
  "NEXT_PUBLIC_ROBOTS_ENABLED": "false",
  "NEXT_PUBLIC_GOOGLE_MAPS_KEY": "CHANGE_ME",
  "NEXT_PUBLIC_MOENGAGE_APP_ID": "CHANGE_ME",
  "NEXT_PUBLIC_MOENGAGE_CLUSTER_ID": "dc_5"
}
EOF

cat > /tmp/production-secrets-template.json <<'EOF'
{
  "NEXT_PUBLIC_ZO_CLIENT_KEY": "CHANGE_ME",
  "NEXT_PUBLIC_ZOSTEL_SUPPORT_NUMBER": "CHANGE_ME",
  "NEXT_PUBLIC_ZO_TRIPS_SUPPORT_NUMBER": "CHANGE_ME",
  "NEXT_PUBLIC_ZOSTEL_BASE_URL": "https://zostel.com",
  "NEXT_PUBLIC_ZOSTEL_CLIENT_ID": "CHANGE_ME",
  "NEXT_PUBLIC_ZO_API_BASE_URL": "https://api.zo.xyz",
  "NEXT_PUBLIC_ZOSTEL_API_BASE_URL": "https://api.zostel.com",
  "NEXT_PUBLIC_GTM_ID": "CHANGE_ME",
  "NEXT_PUBLIC_META_PIXEL_ZOSTEL": "CHANGE_ME",
  "NEXT_PUBLIC_META_PIXEL_ZO_TRIPS": "CHANGE_ME",
  "NEXT_PUBLIC_SENTRY_DSN": "CHANGE_ME",
  "SENTRY_DSN": "CHANGE_ME",
  "SENTRY_AUTH_TOKEN": "CHANGE_ME",
  "NEXT_PUBLIC_ROBOTS_ENABLED": "true",
  "NEXT_PUBLIC_GOOGLE_MAPS_KEY": "CHANGE_ME",
  "NEXT_PUBLIC_ASSET_PREFIX": "https://cdn.example.com",
  "NEXT_PUBLIC_MOENGAGE_APP_ID": "CHANGE_ME",
  "NEXT_PUBLIC_MOENGAGE_CLUSTER_ID": "dc_5"
}
EOF

echo "📝 Secret templates created at:"
echo "   /tmp/staging-secrets-template.json"
echo "   /tmp/production-secrets-template.json"
echo ""
echo "⚠️  Please edit these files with your actual secret values before continuing!"
echo ""
read -p "Have you updated the secret files? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Please update the secret files and run again."
    exit 1
fi

# Create staging secrets
echo "1️⃣  Creating staging secrets..."
aws secretsmanager create-secret \
  --name ${PROJECT_NAME}-staging-secrets \
  --description "Environment variables for ${PROJECT_NAME} staging" \
  --secret-string file:///tmp/staging-secrets-template.json \
  --region $REGION 2>/dev/null || {
    echo "   Secret already exists. Updating..."
    aws secretsmanager update-secret \
      --secret-id ${PROJECT_NAME}-staging-secrets \
      --secret-string file:///tmp/staging-secrets-template.json \
      --region $REGION
  }

STAGING_ARN=$(aws secretsmanager describe-secret \
  --secret-id ${PROJECT_NAME}-staging-secrets \
  --region $REGION \
  --query ARN \
  --output text)

echo "✅ Staging secrets created"
echo "   ARN: $STAGING_ARN"
echo ""

# Create production secrets
echo "2️⃣  Creating production secrets..."
aws secretsmanager create-secret \
  --name ${PROJECT_NAME}-production-secrets \
  --description "Environment variables for ${PROJECT_NAME} production" \
  --secret-string file:///tmp/production-secrets-template.json \
  --region $REGION 2>/dev/null || {
    echo "   Secret already exists. Updating..."
    aws secretsmanager update-secret \
      --secret-id ${PROJECT_NAME}-production-secrets \
      --secret-string file:///tmp/production-secrets-template.json \
      --region $REGION
  }

PRODUCTION_ARN=$(aws secretsmanager describe-secret \
  --secret-id ${PROJECT_NAME}-production-secrets \
  --region $REGION \
  --query ARN \
  --output text)

echo "✅ Production secrets created"
echo "   ARN: $PRODUCTION_ARN"
echo ""

# Update workflow files with actual secret ARNs
echo "3️⃣  Updating workflow files with secret ARNs..."

# The ARN format includes a random suffix, we need to append it to our workflow files
# Extract the suffix from the ARN
STAGING_SUFFIX=$(echo $STAGING_ARN | grep -oE '[A-Za-z0-9]{6}$')
PRODUCTION_SUFFIX=$(echo $PRODUCTION_ARN | grep -oE '[A-Za-z0-9]{6}$')

echo "   Staging suffix: $STAGING_SUFFIX"
echo "   Production suffix: $PRODUCTION_SUFFIX"

# Update workflow files
sed -i '' "s|mono-front-staging-secrets|mono-front-staging-secrets-$STAGING_SUFFIX|g" .github/workflows/deploy-staging.yml
sed -i '' "s|mono-front-production-secrets|mono-front-production-secrets-$PRODUCTION_SUFFIX|g" .github/workflows/deploy.yml
sed -i '' "s|mono-front-staging-secrets|mono-front-staging-secrets-$STAGING_SUFFIX|g" .github/workflows/demo-environment.yml
sed -i '' "s|mono-front-production-secrets|mono-front-production-secrets-$PRODUCTION_SUFFIX|g" .github/workflows/demo-environment.yml

echo "✅ Workflow files updated"
echo ""

# Summary
echo "📋 Summary"
echo "=========="
echo ""
echo "✅ Secrets created successfully!"
echo ""
echo "Staging Secret ARN:"
echo "  $STAGING_ARN"
echo ""
echo "Production Secret ARN:"
echo "  $PRODUCTION_ARN"
echo ""
echo "⚠️  NEXT STEPS:"
echo ""
echo "1. You can update secrets anytime with:"
echo "   aws secretsmanager update-secret --secret-id ${PROJECT_NAME}-staging-secrets --secret-string file://your-secrets.json"
echo ""
echo "2. Workflow files have been updated with the correct secret ARNs"
echo ""

