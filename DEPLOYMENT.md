# Deployment Guide - Mono Front

This guide covers the CI/CD pipeline setup for deploying multiple Next.js apps and Node.js backend to AWS ECS Fargate.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [AWS Setup](#aws-setup)
- [GitHub Setup](#github-setup)
- [Deployment Workflows](#deployment-workflows)
- [Managing Secrets](#managing-secrets)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

This project uses:
- **Nx Monorepo**: Contains multiple apps (admin, comic, dashboard, meme, payment, pms, web-checkin, website, zo-ops, ops-backend)
- **AWS ECS Fargate**: Containerized deployment for each app
- **AWS ECR**: Docker image registry
- **AWS Secrets Manager**: Secure environment variable management
- **GitHub Actions**: CI/CD automation with selective app deployment

### Key Features

1. **Selective Deployment**: Only changed apps are built and deployed (uses `nx affected`)
2. **No Committed Secrets**: All secrets managed via AWS Secrets Manager
3. **Multi-Environment**: Staging and Production environments
4. **Demo Environments**: Create temporary deployments from PRs

## Prerequisites

- AWS Account with appropriate permissions
- GitHub repository with Actions enabled
- Docker knowledge for troubleshooting
- Basic understanding of ECS/Fargate

## AWS Setup

### 1. Create IAM Roles

#### Execution Role (for ECS to pull images and secrets)

```bash
aws iam create-role \
  --role-name mono-front-ecs-execution-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policies
aws iam attach-role-policy \
  --role-name mono-front-ecs-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Add Secrets Manager access
aws iam put-role-policy \
  --role-name mono-front-ecs-execution-role \
  --policy-name SecretsManagerAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:ap-south-1:786741319455:secret:mono-front-*"
    }]
  }'
```

#### Task Role (for app runtime permissions)

```bash
aws iam create-role \
  --role-name mono-front-ecs-task-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Add any additional permissions your apps need (S3, DynamoDB, etc.)
```

#### GitHub Actions Role (OIDC)

```bash
# Create OIDC provider (if not exists)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# Create role for GitHub Actions
aws iam create-role \
  --role-name mono-front-github-actions-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::786741319455:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/mono-front:*"
        }
      }
    }]
  }'

# Attach permissions (ECR, ECS, Secrets Manager, CloudWatch Logs)
aws iam attach-role-policy \
  --role-name mono-front-github-actions-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam put-role-policy \
  --role-name mono-front-github-actions-role \
  --policy-name ECSDeploymentAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ecs:*",
          "logs:CreateLogGroup",
          "logs:PutRetentionPolicy",
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "ec2:DescribeNetworkInterfaces",
          "iam:PassRole"
        ],
        "Resource": "*"
      }
    ]
  }'
```

### 2. Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name mono-front \
  --region ap-south-1 \
  --image-scanning-configuration scanOnPush=true
```

### 3. Create ECS Clusters

```bash
# Staging cluster
aws ecs create-cluster \
  --cluster-name mono-front-cluster-staging \
  --region ap-south-1

# Production cluster
aws ecs create-cluster \
  --cluster-name mono-front-cluster-production \
  --region ap-south-1

# Demo cluster (for PR previews)
aws ecs create-cluster \
  --cluster-name mono-front-cluster-demo \
  --region ap-south-1
```

### 4. Create Secrets in AWS Secrets Manager

#### Staging Secrets

```bash
aws secretsmanager create-secret \
  --name mono-front-staging-secrets \
  --description "Environment variables for mono-front staging" \
  --secret-string '{
    "NEXT_PUBLIC_ZO_CLIENT_KEY": "your-staging-client-key",
    "NEXT_PUBLIC_ZOSTEL_SUPPORT_NUMBER": "+1234567890",
    "NEXT_PUBLIC_ZO_TRIPS_SUPPORT_NUMBER": "+1234567890",
    "NEXT_PUBLIC_ZOSTEL_BASE_URL": "https://staging.zostel.com",
    "NEXT_PUBLIC_ZOSTEL_CLIENT_ID": "staging-client-id",
    "NEXT_PUBLIC_ZO_API_BASE_URL": "https://staging-api.zo.xyz",
    "NEXT_PUBLIC_ZOSTEL_API_BASE_URL": "https://staging-api.zostel.com",
    "NEXT_PUBLIC_GTM_ID": "GTM-XXXXXXX",
    "NEXT_PUBLIC_META_PIXEL_ZOSTEL": "123456789",
    "NEXT_PUBLIC_META_PIXEL_ZO_TRIPS": "987654321",
    "NEXT_PUBLIC_SENTRY_DSN": "https://xxx@sentry.io/xxx",
    "SENTRY_DSN": "https://xxx@sentry.io/xxx",
    "NEXT_PUBLIC_ROBOTS_ENABLED": "false",
    "NEXT_PUBLIC_GOOGLE_MAPS_KEY": "your-maps-key",
    "NEXT_PUBLIC_MOENGAGE_APP_ID": "your-moengage-app-id",
    "NEXT_PUBLIC_MOENGAGE_CLUSTER_ID": "dc_5"
  }' \
  --region ap-south-1
```

#### Production Secrets

```bash
aws secretsmanager create-secret \
  --name mono-front-production-secrets \
  --description "Environment variables for mono-front production" \
  --secret-string '{
    "NEXT_PUBLIC_ZO_CLIENT_KEY": "your-production-client-key",
    "NEXT_PUBLIC_ZOSTEL_SUPPORT_NUMBER": "+1234567890",
    "NEXT_PUBLIC_ZO_TRIPS_SUPPORT_NUMBER": "+1234567890",
    "NEXT_PUBLIC_ZOSTEL_BASE_URL": "https://zostel.com",
    "NEXT_PUBLIC_ZOSTEL_CLIENT_ID": "production-client-id",
    "NEXT_PUBLIC_ZO_API_BASE_URL": "https://api.zo.xyz",
    "NEXT_PUBLIC_ZOSTEL_API_BASE_URL": "https://api.zostel.com",
    "NEXT_PUBLIC_GTM_ID": "GTM-XXXXXXX",
    "NEXT_PUBLIC_META_PIXEL_ZOSTEL": "123456789",
    "NEXT_PUBLIC_META_PIXEL_ZO_TRIPS": "987654321",
    "NEXT_PUBLIC_SENTRY_DSN": "https://xxx@sentry.io/xxx",
    "SENTRY_DSN": "https://xxx@sentry.io/xxx",
    "SENTRY_AUTH_TOKEN": "your-sentry-auth-token",
    "NEXT_PUBLIC_ROBOTS_ENABLED": "true",
    "NEXT_PUBLIC_GOOGLE_MAPS_KEY": "your-maps-key",
    "NEXT_PUBLIC_ASSET_PREFIX": "https://cdn.example.com",
    "NEXT_PUBLIC_MOENGAGE_APP_ID": "your-moengage-app-id",
    "NEXT_PUBLIC_MOENGAGE_CLUSTER_ID": "dc_5"
  }' \
  --region ap-south-1
```

**Note**: After creating secrets, update the ARNs in:
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/demo-environment.yml`

### 5. Create VPC and Security Groups (if needed)

```bash
# Create security group that allows inbound traffic on port 3000
aws ec2 create-security-group \
  --group-name mono-front-ecs-sg \
  --description "Security group for mono-front ECS tasks" \
  --vpc-id vpc-xxxxxx

# Allow inbound on port 3000
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxx \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0
```

### 6. Create ECS Services

For each app, create an ECS service. Example for the `admin` app:

```bash
# Staging
aws ecs create-service \
  --cluster mono-front-cluster-staging \
  --service-name mono-front-admin-staging-service \
  --task-definition mono-front-admin-staging:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --region ap-south-1

# Production (with higher resource allocation)
aws ecs create-service \
  --cluster mono-front-cluster-production \
  --service-name mono-front-admin-production-service \
  --task-definition mono-front-admin-production:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --region ap-south-1
```

**Repeat for all apps**: admin, comic, dashboard, meme, payment, pms, web-checkin, website, zo-ops, ops-backend

### 7. (Optional) Set up Application Load Balancer

For production, it's recommended to use an ALB:

```bash
# Create target groups for each app
aws elbv2 create-target-group \
  --name mono-front-admin-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /

# Create ALB and configure routing
# ... (detailed ALB setup)
```

## GitHub Setup

### 1. Add Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add:
- `AWS_ROLE_ARN`: ARN of the GitHub Actions role (e.g., `arn:aws:iam::786741319455:role/mono-front-github-actions-role`)
- `AWS_REGION`: `ap-south-1` (or your region)

### 2. Update Workflow Files

Update the following in workflow files if needed:
- AWS Account ID
- Region
- Secret ARN suffixes (the random string at the end)
- Subnet IDs
- Security Group IDs

## Deployment Workflows

### 1. Staging Deployment (`deploy-staging.yml`)

**Trigger**: Push to `staging` branch

**What it does**:
1. Detects which apps changed using `nx affected`
2. Builds Docker images for changed apps
3. Pushes to ECR
4. Updates ECS task definitions with secrets
5. Deploys to staging ECS cluster

**Example**:
```bash
git checkout staging
git merge feature-branch
git push origin staging
# GitHub Actions will automatically deploy changed apps
```

### 2. Production Deployment (`deploy.yml`)

**Trigger**: Push to `main` branch

**What it does**:
1. Same as staging but with production resources
2. Waits for service stabilization
3. Higher resource allocation (1024 CPU / 2048 MB)

**Example**:
```bash
git checkout main
git merge staging
git push origin main
# GitHub Actions will automatically deploy changed apps
```

### 3. Demo Environment (`demo-environment.yml`)

**Trigger**: Comment on PR with `demo-staging <app-name>` or `demo-production <app-name>`

**What it does**:
1. Creates temporary branch with PR changes
2. Builds specified app
3. Deploys to demo cluster with public IP
4. Comments on PR with URL
5. Cleans up demo branch

**Example**:
```
Comment on PR:
"demo-staging admin"

or

"demo-production website"
```

## Managing Secrets

### Updating Secrets

```bash
# Update staging secrets
aws secretsmanager update-secret \
  --secret-id mono-front-staging-secrets \
  --secret-string '{
    "NEXT_PUBLIC_ZO_CLIENT_KEY": "new-value",
    ...
  }'

# Update production secrets
aws secretsmanager update-secret \
  --secret-id mono-front-production-secrets \
  --secret-string '{
    "NEXT_PUBLIC_ZO_CLIENT_KEY": "new-value",
    ...
  }'
```

### Adding New Secrets

1. Add to AWS Secrets Manager
2. No code changes needed - secrets are dynamically injected

### Secret Types

- **NEXT_PUBLIC_***: Available at build time and runtime (exposed to browser)
- **Other secrets**: Only available at runtime (server-side only)

## Troubleshooting

### Build Failures

1. **Check GitHub Actions logs**: See which step failed
2. **Common issues**:
   - Missing secrets in AWS Secrets Manager
   - Incorrect IAM permissions
   - Nx cache issues (try `nx reset`)

### Deployment Failures

1. **Service doesn't exist**:
   ```bash
   aws ecs describe-services \
     --cluster mono-front-cluster-staging \
     --services mono-front-admin-staging-service
   ```

2. **Task failed to start**:
   ```bash
   # Check CloudWatch Logs
   aws logs tail /ecs/mono-front-admin-staging --follow
   ```

3. **Image pull errors**:
   - Verify ECR permissions
   - Check execution role has ECR access

### Nx Affected Not Detecting Changes

```bash
# Locally test what would be detected
npx nx show projects --affected --base=origin/staging --head=HEAD --type=app
```

### Docker Build Issues

Test locally:
```bash
# Build a specific app
docker build \
  -f Dockerfile.nextjs \
  --build-arg APP_NAME=admin \
  --build-arg NEXT_PUBLIC_ZO_CLIENT_KEY=test \
  -t test-admin .

# Run locally
docker run -p 3000:3000 test-admin
```

### ECS Service Won't Update

```bash
# Force new deployment
aws ecs update-service \
  --cluster mono-front-cluster-staging \
  --service mono-front-admin-staging-service \
  --force-new-deployment
```

## Cost Optimization

1. **Use Fargate Spot** for staging and demo environments
2. **Scale down** non-critical staging services outside business hours
3. **Set CloudWatch Logs retention** (7 days for staging, 30 for production)
4. **Use ECR lifecycle policies** to remove old images

Example ECR lifecycle policy:
```json
{
  "rules": [{
    "rulePriority": 1,
    "description": "Keep last 10 images",
    "selection": {
      "tagStatus": "any",
      "countType": "imageCountMoreThan",
      "countNumber": 10
    },
    "action": {
      "type": "expire"
    }
  }]
}
```

## Monitoring

### CloudWatch Logs

All apps log to CloudWatch:
- Staging: `/ecs/mono-front-{app-name}-staging`
- Production: `/ecs/mono-front-{app-name}-production`
- Demo: `/ecs/mono-front-demo`

### Metrics

Monitor in CloudWatch:
- CPU Utilization
- Memory Utilization
- Task Count
- Request Count (if using ALB)

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Check CloudWatch Logs
3. Review this documentation
4. Contact DevOps team

---

**Last Updated**: November 2025

