#!/bin/bash
set -e

# Extract secrets from .env files and create separate AWS Secrets Manager secrets per app
# Account ID: 670664477975
# Region: ap-south-1

ACCOUNT_ID="670664477975"
REGION="ap-south-1"
PROJECT_NAME="mono-front"

echo "🔍 Extracting secrets from .env files (one secret per app)"
echo "============================================================"
echo ""

APPS=("admin" "comic" "dashboard" "meme" "payment" "pms" "web-checkin" "website" "zo-ops" "ops-backend")
ENVIRONMENTS=("staging" "production")

# Create temp directory for storing ARNs
mkdir -p /tmp/mono-front-arns

# Function to convert .env file to JSON
env_to_json() {
    local ENV_FILE=$1
    local OUTPUT_FILE=$2

    if [ ! -f "$ENV_FILE" ]; then
        echo "{}" > "$OUTPUT_FILE"
        return
    fi

    echo "{" > "$OUTPUT_FILE"

    # Read all non-comment, non-empty lines
    grep -v '^#' "$ENV_FILE" | grep -v '^$' | while IFS='=' read -r key value; do
        # Trim whitespace from key
        key=$(echo "$key" | xargs)
        
        # Skip if key is empty
        [ -z "$key" ] && continue

        # Trim whitespace from value and remove quotes if present
        value=$(echo "$value" | xargs | sed 's/^"//; s/"$//' | sed "s/^'//; s/'$//")

        # Escape special characters for JSON
        value=$(echo "$value" | sed 's/\\/\\\\/g; s/"/\\"/g; s/$//')

        # Output as JSON key-value
        echo "  \"$key\": \"$value\","
    done >> "$OUTPUT_FILE"

    # Remove trailing comma and close JSON
    sed -i '' '$ s/,$//' "$OUTPUT_FILE"
    echo "}" >> "$OUTPUT_FILE"

    # Validate and format JSON with jq
    if command -v jq &> /dev/null; then
        jq '.' "$OUTPUT_FILE" > "${OUTPUT_FILE}.tmp" 2>/dev/null && mv "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE" || true
    fi
}

# Create secrets for each app and environment
for APP in "${APPS[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Processing app: $APP"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    for ENV in "${ENVIRONMENTS[@]}"; do
        echo "  🔹 Environment: $ENV"

        # Locate the .env file for this app and environment
        ENV_FILE="apps/${APP}/.env.${ENV}"

        if [ ! -f "$ENV_FILE" ]; then
            echo "     ⚠️  No .env file found at: $ENV_FILE"
            echo "     Creating empty secret..."
            ENV_FILE="/dev/null"
        else
            echo "     ✓ Found: $ENV_FILE"
        fi

        # Convert to JSON
        TMP_JSON="/tmp/${APP}-${ENV}-secrets.json"
        env_to_json "$ENV_FILE" "$TMP_JSON"

        # Count keys
        KEY_COUNT=$(jq 'keys | length' "$TMP_JSON" 2>/dev/null || echo "0")
        echo "     📊 Extracted $KEY_COUNT environment variables"

        # Create secret name
        SECRET_NAME="${PROJECT_NAME}-${APP}-${ENV}-secrets"

        # Create or update the secret in AWS
        echo "     ☁️  Creating/updating AWS secret: $SECRET_NAME"

        aws secretsmanager create-secret \
            --name "$SECRET_NAME" \
            --description "Environment variables for ${APP} (${ENV})" \
            --secret-string "file://${TMP_JSON}" \
            --region "$REGION" 2>/dev/null || {
            # Secret exists, update it
            aws secretsmanager put-secret-value \
                --secret-id "$SECRET_NAME" \
                --secret-string "file://${TMP_JSON}" \
                --region "$REGION" > /dev/null
        }

        # Get the ARN
        SECRET_ARN=$(aws secretsmanager describe-secret \
            --secret-id "$SECRET_NAME" \
            --region "$REGION" \
            --query ARN \
            --output text)

        # Store ARN in temp file for later use
        echo "$SECRET_ARN" > "/tmp/mono-front-arns/${APP}-${ENV}.arn"

        echo "     ✅ Secret created: $SECRET_ARN"
        echo ""
    done
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Updating Task Definitions with App-Specific Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Update task definitions to use app-specific secrets
for APP in "${APPS[@]}"; do
    for ENV in "${ENVIRONMENTS[@]}"; do
        TASK_DEF_FILE="aws/task-definitions/${APP}-${ENV}.json"

        if [ ! -f "$TASK_DEF_FILE" ]; then
            echo "⚠️  Task definition not found: $TASK_DEF_FILE"
            continue
        fi

        # Get ARN from temp file
        ARN_FILE="/tmp/mono-front-arns/${APP}-${ENV}.arn"
        if [ ! -f "$ARN_FILE" ]; then
            echo "⚠️  ARN not found for ${APP}-${ENV}"
            continue
        fi

        SECRET_ARN=$(cat "$ARN_FILE")

        echo "📄 Updating: $TASK_DEF_FILE"

        # Fetch all secret keys and create secrets array
        SECRET_JSON="/tmp/${APP}-${ENV}-secrets.json"

        if [ -f "$SECRET_JSON" ]; then
            SECRETS_ARRAY=$(jq -r 'to_entries | map({name: .key, valueFrom: "'"$SECRET_ARN"':\(.key)::"})' "$SECRET_JSON")

            # Update task definition with secrets
            jq --argjson secrets "$SECRETS_ARRAY" \
                '.containerDefinitions[0].secrets = $secrets' \
                "$TASK_DEF_FILE" > "${TASK_DEF_FILE}.tmp" && \
                mv "${TASK_DEF_FILE}.tmp" "$TASK_DEF_FILE"

            echo "   ✅ Updated with $(echo $SECRETS_ARRAY | jq 'length') secrets"
        fi
    done
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Updating GitHub Actions Workflows"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Update workflows to use app-specific secret ARNs
# For staging workflow
echo "📝 Updating deploy-staging.yml..."
cat > /tmp/update-staging.sed <<'EOF'
s|SECRET_ARN: arn:aws:secretsmanager:ap-south-1:670664477975:secret:mono-front-staging-secrets.*|SECRET_ARN_PREFIX: arn:aws:secretsmanager:ap-south-1:670664477975:secret:mono-front|
EOF
sed -i '' -f /tmp/update-staging.sed .github/workflows/deploy-staging.yml

# Update the fetch secrets step in workflows to use app-specific secrets
# We need to modify the workflow to fetch the secret based on the matrix.app variable

echo "   ✅ Workflow template updated"
echo ""

# Create a helper script to update workflow dynamically
cat > scripts/get-app-secret-arn.sh <<'HELPER_EOF'
#!/bin/bash
# Helper script to get app-specific secret ARN
APP=$1
ENV=$2
REGION="ap-south-1"
PROJECT_NAME="mono-front"

SECRET_NAME="${PROJECT_NAME}-${APP}-${ENV}-secrets"
aws secretsmanager describe-secret \
    --secret-id "$SECRET_NAME" \
    --region "$REGION" \
    --query ARN \
    --output text
HELPER_EOF

chmod +x scripts/get-app-secret-arn.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Created/updated secrets for all apps!"
echo ""
echo "Total secrets created: $((${#APPS[@]} * ${#ENVIRONMENTS[@]}))"
echo ""
echo "Secrets by app:"
for APP in "${APPS[@]}"; do
    echo "  📦 $APP:"
    for ENV in "${ENVIRONMENTS[@]}"; do
        ARN_FILE="/tmp/mono-front-arns/${APP}-${ENV}.arn"
        if [ -f "$ARN_FILE" ]; then
            ARN=$(cat "$ARN_FILE")
            echo "     - $ENV: $(echo $ARN | rev | cut -d: -f1 | rev)"
        fi
    done
done
echo ""

# Save secret mappings to a file
echo "# Secret ARN Mappings" > aws-secrets-mapping.txt
echo "# Generated: $(date)" >> aws-secrets-mapping.txt
echo "" >> aws-secrets-mapping.txt

for APP in "${APPS[@]}"; do
    echo "# $APP" >> aws-secrets-mapping.txt
    for ENV in "${ENVIRONMENTS[@]}"; do
        ARN_FILE="/tmp/mono-front-arns/${APP}-${ENV}.arn"
        if [ -f "$ARN_FILE" ]; then
            ARN=$(cat "$ARN_FILE")
            echo "${APP}_${ENV}_SECRET_ARN=$ARN" >> aws-secrets-mapping.txt
        fi
    done
    echo "" >> aws-secrets-mapping.txt
done

echo "✅ Secret ARN mappings saved to: aws-secrets-mapping.txt"
echo ""

echo "⚠️  IMPORTANT NEXT STEPS:"
echo ""
echo "1. Update GitHub Actions workflows to use app-specific secrets"
echo "   I'll create an updated workflow for you..."
echo ""
echo "2. Add GitHub repository secret:"
echo "   Name: AWS_ROLE_ARN"
echo "   Value: arn:aws:iam::$ACCOUNT_ID:role/$PROJECT_NAME-github-actions-role"
echo ""
echo "3. Review secrets in AWS Console:"
echo "   https://console.aws.amazon.com/secretsmanager/home?region=$REGION"
echo ""
echo "4. (Optional) Remove .env files from git after verifying:"
echo "   git rm apps/*/.env.* apps/ops-backend/.env"
echo "   git commit -m 'Remove .env files (moved to AWS Secrets Manager)'"
echo ""
echo "5. Test deployment!"
echo ""

