#!/bin/bash
set -e

# Complete AWS setup for mono-front
# Account ID: 670664477975
# Region: ap-south-1

ACCOUNT_ID="670664477975"
REGION="ap-south-1"
PROJECT_NAME="mono-front"

echo "🚀 Complete AWS Setup for Mono Front"
echo "====================================="
echo ""
echo "Account ID: $ACCOUNT_ID"
echo "Region: $REGION"
echo ""

# 1. Get VPC and Subnet Information
echo "1️⃣  Getting VPC and Subnet information..."
DEFAULT_VPC=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text --region $REGION)
echo "   Default VPC: $DEFAULT_VPC"

# Get public subnets
SUBNETS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$DEFAULT_VPC" "Name=map-public-ip-on-launch,Values=true" \
  --query 'Subnets[*].SubnetId' \
  --output text \
  --region $REGION)

SUBNET_ARRAY=($SUBNETS)
SUBNET_1=${SUBNET_ARRAY[0]}
SUBNET_2=${SUBNET_ARRAY[1]:-$SUBNET_1}

echo "   Subnet 1: $SUBNET_1"
echo "   Subnet 2: $SUBNET_2"
echo ""

# 2. Create Security Group
echo "2️⃣  Creating Security Group..."
SG_ID=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-ecs-sg \
  --description "Security group for ${PROJECT_NAME} ECS tasks" \
  --vpc-id $DEFAULT_VPC \
  --region $REGION \
  --query 'GroupId' \
  --output text 2>/dev/null) || {
  # Security group might exist, try to get it
  SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-ecs-sg" \
    --query 'SecurityGroups[0].GroupId' \
    --output text \
    --region $REGION)
  echo "   Security group already exists"
}

echo "   Security Group ID: $SG_ID"

# Allow inbound on port 3000 from anywhere
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0 \
  --region $REGION 2>/dev/null || echo "   Port 3000 rule already exists"

# Allow inbound on port 80 (for ALB or direct access)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $REGION 2>/dev/null || echo "   Port 80 rule already exists"

echo "✅ Security Group configured"
echo ""

# 3. Create ECR Repository
echo "3️⃣  Creating ECR Repository..."
aws ecr create-repository \
  --repository-name $PROJECT_NAME \
  --region $REGION \
  --image-scanning-configuration scanOnPush=true 2>/dev/null || echo "   Repository may already exist"

ECR_URI=$(aws ecr describe-repositories \
  --repository-names $PROJECT_NAME \
  --region $REGION \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "   ECR URI: $ECR_URI"
echo "✅ ECR Repository ready"
echo ""

# 4. Set ECR Lifecycle Policy
echo "4️⃣  Setting ECR Lifecycle Policy..."
aws ecr put-lifecycle-policy \
  --repository-name $PROJECT_NAME \
  --region $REGION \
  --lifecycle-policy-text '{
    "rules": [{
      "rulePriority": 1,
      "description": "Keep last 10 images per app",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    }]
  }' || true

echo "✅ Lifecycle policy set"
echo ""

# 5. Create ECS Clusters
echo "5️⃣  Creating ECS Clusters..."
for env in staging production demo; do
  aws ecs create-cluster \
    --cluster-name ${PROJECT_NAME}-cluster-${env} \
    --region $REGION 2>/dev/null || echo "   Cluster ${env} may already exist"
  echo "   ✅ ${PROJECT_NAME}-cluster-${env}"
done
echo ""

# 6. Create CloudWatch Log Groups
echo "6️⃣  Creating CloudWatch Log Groups..."
APPS=("admin" "comic" "dashboard" "meme" "payment" "pms" "web-checkin" "website" "zo-ops" "ops-backend")

for app in "${APPS[@]}"; do
  for env in staging production; do
    aws logs create-log-group \
      --log-group-name "/ecs/${PROJECT_NAME}-${app}-${env}" \
      --region $REGION 2>/dev/null || true
    
    # Set retention policy
    if [ "$env" = "staging" ]; then
      RETENTION_DAYS=7
    else
      RETENTION_DAYS=30
    fi
    
    aws logs put-retention-policy \
      --log-group-name "/ecs/${PROJECT_NAME}-${app}-${env}" \
      --retention-in-days $RETENTION_DAYS \
      --region $REGION 2>/dev/null || true
  done
done

# Demo log group
aws logs create-log-group \
  --log-group-name "/ecs/${PROJECT_NAME}-demo" \
  --region $REGION 2>/dev/null || true
aws logs put-retention-policy \
  --log-group-name "/ecs/${PROJECT_NAME}-demo" \
  --retention-in-days 7 \
  --region $REGION 2>/dev/null || true

echo "✅ All log groups created"
echo ""

# 7. Save configuration
echo "7️⃣  Saving configuration..."
cat > aws-config.txt <<EOF
# AWS Configuration for Mono Front
# Generated: $(date)

AWS_ACCOUNT_ID=$ACCOUNT_ID
AWS_REGION=$REGION
VPC_ID=$DEFAULT_VPC
SUBNET_1=$SUBNET_1
SUBNET_2=$SUBNET_2
SECURITY_GROUP_ID=$SG_ID
ECR_URI=$ECR_URI

# IAM Role ARNs
EXECUTION_ROLE_ARN=arn:aws:iam::${ACCOUNT_ID}:role/${PROJECT_NAME}-ecs-execution-role
TASK_ROLE_ARN=arn:aws:iam::${ACCOUNT_ID}:role/${PROJECT_NAME}-ecs-task-role
GITHUB_ACTIONS_ROLE_ARN=arn:aws:iam::${ACCOUNT_ID}:role/${PROJECT_NAME}-github-actions-role

# ECS Clusters
STAGING_CLUSTER=${PROJECT_NAME}-cluster-staging
PRODUCTION_CLUSTER=${PROJECT_NAME}-cluster-production
DEMO_CLUSTER=${PROJECT_NAME}-cluster-demo

# Secrets Manager
STAGING_SECRET_ARN=arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${PROJECT_NAME}-staging-secrets
PRODUCTION_SECRET_ARN=arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${PROJECT_NAME}-production-secrets
EOF

echo "✅ Configuration saved to aws-config.txt"
echo ""

# Summary
echo "📋 Summary"
echo "=========="
echo ""
echo "✅ AWS Resources Created Successfully!"
echo ""
echo "VPC & Network:"
echo "  VPC ID: $DEFAULT_VPC"
echo "  Subnet 1: $SUBNET_1"
echo "  Subnet 2: $SUBNET_2"
echo "  Security Group: $SG_ID"
echo ""
echo "ECR:"
echo "  Repository URI: $ECR_URI"
echo ""
echo "ECS Clusters:"
echo "  - ${PROJECT_NAME}-cluster-staging"
echo "  - ${PROJECT_NAME}-cluster-production"
echo "  - ${PROJECT_NAME}-cluster-demo"
echo ""
echo "CloudWatch Logs:"
echo "  - 20 log groups created for all apps (staging + production)"
echo "  - 1 demo log group"
echo ""
echo "⚠️  NEXT STEPS:"
echo ""
echo "1. Update GitHub workflow file:"
echo "   File: .github/workflows/demo-environment.yml"
echo "   Line 23: ECS_SUBNETS: $SUBNET_1"
echo "   Line 24: ECS_SECURITY_GROUPS: $SG_ID"
echo ""
echo "2. Create IAM roles (if not done yet):"
echo "   ./scripts/create-iam-roles.sh"
echo ""
echo "3. Create AWS Secrets Manager secrets:"
echo "   ./scripts/create-secrets.sh"
echo ""
echo "4. Create ECS Services:"
echo "   ./scripts/create-ecs-services.sh"
echo ""
echo "All configuration saved to: aws-config.txt"
echo ""

