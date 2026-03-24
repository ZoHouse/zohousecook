#!/bin/bash
set -e

# Create ECS Services for all apps
# Account ID: 670664477975
# Region: ap-south-1

ACCOUNT_ID="670664477975"
REGION="ap-south-1"
PROJECT_NAME="mono-front"

# Read configuration
if [ -f "aws-config.txt" ]; then
    source aws-config.txt
else
    echo "❌ aws-config.txt not found. Run ./scripts/create-all-aws-resources.sh first"
    exit 1
fi

echo "🚢 Creating ECS Services for All Apps"
echo "======================================"
echo ""

APPS=("admin" "comic" "dashboard" "meme" "payment" "pms" "web-checkin" "website" "zo-ops" "ops-backend")

# Function to create a service
create_service() {
    local APP=$1
    local ENV=$2
    local CLUSTER=$3
    local DESIRED_COUNT=$4
    
    SERVICE_NAME="${PROJECT_NAME}-${APP}-${ENV}-service"
    TASK_DEF="${PROJECT_NAME}-${APP}-${ENV}"
    
    echo "Creating service: $SERVICE_NAME"
    
    # Check if service already exists
    if aws ecs describe-services \
        --cluster $CLUSTER \
        --services $SERVICE_NAME \
        --region $REGION \
        --query 'services[0].serviceName' \
        --output text 2>/dev/null | grep -q "$SERVICE_NAME"; then
        echo "   ⚠️  Service already exists: $SERVICE_NAME"
        return
    fi
    
    # Create service
    aws ecs create-service \
        --cluster $CLUSTER \
        --service-name $SERVICE_NAME \
        --task-definition $TASK_DEF \
        --desired-count $DESIRED_COUNT \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
        --region $REGION \
        --enable-execute-command \
        > /dev/null 2>&1 || {
            echo "   ⚠️  Failed to create service. Task definition might not exist yet."
            echo "       Service will be created after first deployment."
            return
        }
    
    echo "   ✅ Created: $SERVICE_NAME"
}

# Create staging services
echo "1️⃣  Creating Staging Services..."
for app in "${APPS[@]}"; do
    create_service "$app" "staging" "$STAGING_CLUSTER" 1
done
echo ""

# Create production services
echo "2️⃣  Creating Production Services..."
for app in "${APPS[@]}"; do
    # Higher replica count for production
    if [ "$app" = "website" ] || [ "$app" = "admin" ]; then
        DESIRED=2
    else
        DESIRED=1
    fi
    create_service "$app" "production" "$PRODUCTION_CLUSTER" $DESIRED
done
echo ""

echo "📋 Summary"
echo "=========="
echo ""
echo "✅ ECS Service creation attempted for all apps"
echo ""
echo "⚠️  NOTE: Some services might not be created if task definitions don't exist yet."
echo "   Services will be automatically created during first deployment."
echo ""
echo "To check service status:"
echo "  aws ecs list-services --cluster $STAGING_CLUSTER"
echo "  aws ecs list-services --cluster $PRODUCTION_CLUSTER"
echo ""

