#!/bin/bash
set -e

# Helper script to set up AWS resources for mono-front deployment
# Usage: ./scripts/setup-aws-resources.sh

echo "🚀 Mono Front - AWS Resources Setup"
echo "===================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="ap-south-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PROJECT_NAME="mono-front"

echo "AWS Account ID: $ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo ""

# Function to check if resource exists
check_resource() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
    fi
}

# 1. Create ECR Repository
echo "📦 Creating ECR Repository..."
aws ecr create-repository \
    --repository-name $PROJECT_NAME \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true 2>/dev/null || echo "Repository may already exist"
check_resource "ECR Repository: $PROJECT_NAME"

# Get ECR URI
ECR_URI=$(aws ecr describe-repositories --repository-names $PROJECT_NAME --region $AWS_REGION --query 'repositories[0].repositoryUri' --output text)
echo "ECR URI: $ECR_URI"
echo ""

# 2. Create ECS Clusters
echo "🏗️  Creating ECS Clusters..."
for env in staging production demo; do
    aws ecs create-cluster \
        --cluster-name ${PROJECT_NAME}-cluster-${env} \
        --region $AWS_REGION 2>/dev/null || echo "Cluster may already exist"
    check_resource "Cluster: ${PROJECT_NAME}-cluster-${env}"
done
echo ""

# 3. Create CloudWatch Log Groups
echo "📊 Creating CloudWatch Log Groups..."
APPS=("admin" "comic" "dashboard" "meme" "payment" "pms" "web-checkin" "website" "zo-ops" "ops-backend")
for app in "${APPS[@]}"; do
    for env in staging production; do
        aws logs create-log-group \
            --log-group-name "/ecs/${PROJECT_NAME}-${app}-${env}" \
            --region $AWS_REGION 2>/dev/null || true

        # Set retention policy
        if [ "$env" = "staging" ]; then
            RETENTION_DAYS=7
        else
            RETENTION_DAYS=30
        fi

        aws logs put-retention-policy \
            --log-group-name "/ecs/${PROJECT_NAME}-${app}-${env}" \
            --retention-in-days $RETENTION_DAYS \
            --region $AWS_REGION 2>/dev/null || true
    done
    echo -e "${GREEN}✓${NC} Log groups for app: $app"
done

# Demo log group
aws logs create-log-group --log-group-name "/ecs/${PROJECT_NAME}-demo" --region $AWS_REGION 2>/dev/null || true
aws logs put-retention-policy --log-group-name "/ecs/${PROJECT_NAME}-demo" --retention-in-days 7 --region $AWS_REGION 2>/dev/null || true
check_resource "Demo log group"
echo ""

# 4. Check IAM Roles
echo "🔐 Checking IAM Roles..."
check_role() {
    aws iam get-role --role-name $1 &>/dev/null
    check_resource "Role: $1"
}

check_role "${PROJECT_NAME}-ecs-execution-role"
check_role "${PROJECT_NAME}-ecs-task-role"
check_role "${PROJECT_NAME}-github-actions-role"
echo ""

# 5. Check Secrets Manager
echo "🔒 Checking AWS Secrets Manager..."
check_secret() {
    aws secretsmanager describe-secret --secret-id $1 --region $AWS_REGION &>/dev/null
    check_resource "Secret: $1"
}

check_secret "${PROJECT_NAME}-staging-secrets"
check_secret "${PROJECT_NAME}-production-secrets"
echo ""

# 6. Summary
echo "📋 Summary"
echo "=========="
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Create IAM roles if they don't exist (see DEPLOYMENT.md)"
echo "2. Create/update secrets in AWS Secrets Manager:"
echo "   - ${PROJECT_NAME}-staging-secrets"
echo "   - ${PROJECT_NAME}-production-secrets"
echo ""
echo "3. Update GitHub repository secrets:"
echo "   AWS_ROLE_ARN: arn:aws:iam::${ACCOUNT_ID}:role/${PROJECT_NAME}-github-actions-role"
echo "   AWS_REGION: ${AWS_REGION}"
echo ""
echo "4. Update workflow files with:"
echo "   - Account ID: ${ACCOUNT_ID}"
echo "   - ECR Repository: ${ECR_URI}"
echo "   - Subnet IDs and Security Group IDs"
echo ""
echo "5. Create ECS services for each app (see AWS_SETUP_CHECKLIST.md)"
echo ""
echo -e "${GREEN}✅ Basic AWS resources setup complete!${NC}"
echo ""
echo "For detailed setup instructions, see:"
echo "  - DEPLOYMENT.md"
echo "  - AWS_SETUP_CHECKLIST.md"

