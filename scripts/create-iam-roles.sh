#!/bin/bash
set -e

# Create IAM roles for mono-front deployment
# AWS Account ID: 670664477975
# Region: ap-south-1

ACCOUNT_ID="670664477975"
REGION="ap-south-1"
PROJECT_NAME="mono-front"

echo "🔐 Creating IAM Roles for Mono Front"
echo "====================================="
echo ""

# 1. Create ECS Execution Role
echo "1️⃣  Creating ECS Execution Role..."
aws iam create-role \
  --role-name ${PROJECT_NAME}-ecs-execution-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || echo "   Role may already exist"

# Attach managed policy
aws iam attach-role-policy \
  --role-name ${PROJECT_NAME}-ecs-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Add Secrets Manager and CloudWatch Logs access
aws iam put-role-policy \
  --role-name ${PROJECT_NAME}-ecs-execution-role \
  --policy-name SecretsAndLogsAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ],
        "Resource": "arn:aws:secretsmanager:'${REGION}':'${ACCOUNT_ID}':secret:mono-front-*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "arn:aws:logs:'${REGION}':'${ACCOUNT_ID}':log-group:/ecs/mono-front-*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ],
        "Resource": "*"
      }
    ]
  }'

echo "✅ ECS Execution Role created"
echo ""

# 2. Create ECS Task Role
echo "2️⃣  Creating ECS Task Role..."
aws iam create-role \
  --role-name ${PROJECT_NAME}-ecs-task-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || echo "   Role may already exist"

# Add basic permissions for tasks (add more as needed)
aws iam put-role-policy \
  --role-name ${PROJECT_NAME}-ecs-task-role \
  --policy-name TaskPermissions \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "*"
      }
    ]
  }'

echo "✅ ECS Task Role created"
echo ""

# 3. Create OIDC Provider for GitHub Actions (if not exists)
echo "3️⃣  Creating OIDC Provider for GitHub Actions..."
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  2>/dev/null || echo "   OIDC Provider may already exist"

echo "✅ OIDC Provider ready"
echo ""

# 4. Create GitHub Actions Role
echo "4️⃣  Creating GitHub Actions Role (OIDC)..."

# Get your GitHub repository owner from git remote
GITHUB_REPO=$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')
echo "   GitHub Repository: $GITHUB_REPO"

aws iam create-role \
  --role-name ${PROJECT_NAME}-github-actions-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::'${ACCOUNT_ID}':oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:'${GITHUB_REPO}':*"
        }
      }
    }]
  }' 2>/dev/null || echo "   Role may already exist"

# Attach ECR permissions
aws iam attach-role-policy \
  --role-name ${PROJECT_NAME}-github-actions-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

# Add ECS deployment and other permissions
aws iam put-role-policy \
  --role-name ${PROJECT_NAME}-github-actions-role \
  --policy-name DeploymentAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ecs:*",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeVpcs",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:PutRetentionPolicy",
          "logs:DescribeLogGroups",
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": "iam:PassRole",
        "Resource": [
          "arn:aws:iam::'${ACCOUNT_ID}':role/'${PROJECT_NAME}'-ecs-execution-role",
          "arn:aws:iam::'${ACCOUNT_ID}':role/'${PROJECT_NAME}'-ecs-task-role"
        ]
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "arn:aws:s3:::zoworld-static-nsfp/*",
          "arn:aws:s3:::zoworld-static-nsfp",
          "arn:aws:s3:::zoworld-static/*",
          "arn:aws:s3:::zoworld-static"
        ]
      }
    ]
  }'

echo "✅ GitHub Actions Role created"
echo ""

# Summary
echo "📋 Summary"
echo "=========="
echo ""
echo "✅ All IAM roles created successfully!"
echo ""
echo "Role ARNs:"
echo "  Execution Role: arn:aws:iam::${ACCOUNT_ID}:role/${PROJECT_NAME}-ecs-execution-role"
echo "  Task Role:      arn:aws:iam::${ACCOUNT_ID}:role/${PROJECT_NAME}-ecs-task-role"
echo "  GitHub Actions: arn:aws:iam::${ACCOUNT_ID}:role/${PROJECT_NAME}-github-actions-role"
echo ""
echo "⚠️  IMPORTANT: Add this to GitHub repository secrets:"
echo "  Secret Name: AWS_ROLE_ARN"
echo "  Secret Value: arn:aws:iam::${ACCOUNT_ID}:role/${PROJECT_NAME}-github-actions-role"
echo ""

