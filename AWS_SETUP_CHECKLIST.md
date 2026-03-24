# AWS Setup Checklist for Mono Front Deployment

Use this checklist to ensure all AWS resources are properly configured before deploying.

## ✅ IAM Roles

- [ ] Create `mono-front-ecs-execution-role`
  - [ ] Attach `AmazonECSTaskExecutionRolePolicy`
  - [ ] Add Secrets Manager read permissions
  - [ ] Add CloudWatch Logs permissions
  
- [ ] Create `mono-front-ecs-task-role`
  - [ ] Add any app-specific permissions (S3, DynamoDB, etc.)
  
- [ ] Create `mono-front-github-actions-role` (OIDC)
  - [ ] Create OIDC provider for GitHub
  - [ ] Attach ECR permissions
  - [ ] Attach ECS deployment permissions
  - [ ] Add Secrets Manager read permissions
  - [ ] Add IAM PassRole permission

## ✅ ECR Repository

- [ ] Create ECR repository `mono-front` in `ap-south-1`
- [ ] Enable scan on push
- [ ] Set up lifecycle policy to manage old images
- [ ] Note the repository URI

## ✅ ECS Clusters

- [ ] Create `mono-front-cluster-staging`
- [ ] Create `mono-front-cluster-production`
- [ ] Create `mono-front-cluster-demo`

## ✅ Networking

- [ ] VPC with public subnets (or use default VPC)
- [ ] Security Group allowing inbound on port 3000
- [ ] Note subnet IDs
- [ ] Note security group IDs
- [ ] (Optional) Create Application Load Balancer

## ✅ AWS Secrets Manager

- [ ] Create `mono-front-staging-secrets`
  - [ ] Add all `NEXT_PUBLIC_*` variables
  - [ ] Add server-side secrets
  - [ ] Note the complete ARN (including suffix)
  
- [ ] Create `mono-front-production-secrets`
  - [ ] Add all `NEXT_PUBLIC_*` variables
  - [ ] Add server-side secrets
  - [ ] Note the complete ARN (including suffix)

### Required Secrets

Copy this template and fill in your values:

```json
{
  "NEXT_PUBLIC_ZO_CLIENT_KEY": "your-value",
  "NEXT_PUBLIC_ZOSTEL_SUPPORT_NUMBER": "your-value",
  "NEXT_PUBLIC_ZO_TRIPS_SUPPORT_NUMBER": "your-value",
  "NEXT_PUBLIC_ZOSTEL_BASE_URL": "your-value",
  "NEXT_PUBLIC_ZOSTEL_CLIENT_ID": "your-value",
  "NEXT_PUBLIC_ZO_API_BASE_URL": "your-value",
  "NEXT_PUBLIC_ZOSTEL_API_BASE_URL": "your-value",
  "NEXT_PUBLIC_GTM_ID": "your-value",
  "NEXT_PUBLIC_META_PIXEL_ZOSTEL": "your-value",
  "NEXT_PUBLIC_META_PIXEL_ZO_TRIPS": "your-value",
  "NEXT_PUBLIC_SENTRY_DSN": "your-value",
  "SENTRY_DSN": "your-value",
  "SENTRY_AUTH_TOKEN": "your-value",
  "NEXT_PUBLIC_ROBOTS_ENABLED": "true/false",
  "NEXT_PUBLIC_GOOGLE_MAPS_KEY": "your-value",
  "NEXT_PUBLIC_MOENGAGE_APP_ID": "your-value",
  "NEXT_PUBLIC_MOENGAGE_CLUSTER_ID": "your-value"
}
```

## ✅ CloudWatch Logs

- [ ] Verify log groups are created (auto-created by workflows):
  - `/ecs/mono-front-admin-staging`
  - `/ecs/mono-front-admin-production`
  - `/ecs/mono-front-comic-staging`
  - `/ecs/mono-front-comic-production`
  - ... (and so on for each app)
  - `/ecs/mono-front-demo`

## ✅ ECS Services

Create services for each app. For each app (admin, comic, dashboard, meme, payment, pms, web-checkin, website, zo-ops, ops-backend):

### Staging Services

- [ ] `mono-front-admin-staging-service`
- [ ] `mono-front-comic-staging-service`
- [ ] `mono-front-dashboard-staging-service`
- [ ] `mono-front-meme-staging-service`
- [ ] `mono-front-payment-staging-service`
- [ ] `mono-front-pms-staging-service`
- [ ] `mono-front-web-checkin-staging-service`
- [ ] `mono-front-website-staging-service`
- [ ] `mono-front-zo-ops-staging-service`
- [ ] `mono-front-ops-backend-staging-service`

### Production Services

- [ ] `mono-front-admin-production-service`
- [ ] `mono-front-comic-production-service`
- [ ] `mono-front-dashboard-production-service`
- [ ] `mono-front-meme-production-service`
- [ ] `mono-front-payment-production-service`
- [ ] `mono-front-pms-production-service`
- [ ] `mono-front-web-checkin-production-service`
- [ ] `mono-front-website-production-service`
- [ ] `mono-front-zo-ops-production-service`
- [ ] `mono-front-ops-backend-production-service`

## ✅ GitHub Configuration

- [ ] Add `AWS_ROLE_ARN` secret to GitHub repository
- [ ] Add `AWS_REGION` secret to GitHub repository (if different from ap-south-1)
- [ ] Update workflow files with correct:
  - [ ] AWS Account ID
  - [ ] Secret ARNs (with suffixes)
  - [ ] Subnet IDs
  - [ ] Security Group IDs
- [ ] Enable GitHub Actions if not already enabled

## ✅ Update Workflow Files

Update these values in workflow files:

### `.github/workflows/deploy-staging.yml`
- [ ] Line 9: `SECRET_ARN` with full staging secret ARN
- [ ] Update account ID if different from 786741319455

### `.github/workflows/deploy.yml`
- [ ] Line 9: `SECRET_ARN` with full production secret ARN
- [ ] Update account ID if different from 786741319455

### `.github/workflows/demo-environment.yml`
- [ ] Line 19: `ECS_SUBNETS` with your subnet IDs
- [ ] Line 20: `ECS_SECURITY_GROUPS` with your security group IDs
- [ ] Lines 60-61: Update secret ARNs for both environments
- [ ] Update account ID if different from 786741319455

## ✅ Initial Deployment

Before first deployment:

- [ ] Push to a feature branch first to test
- [ ] Manually build and push one Docker image to test ECR access
- [ ] Run `npx nx show projects --affected --base=origin/staging --head=HEAD --type=app` locally to test Nx detection
- [ ] Review GitHub Actions permissions

## ✅ Testing

- [ ] Test staging deployment by pushing to `staging` branch
- [ ] Verify app is accessible
- [ ] Check CloudWatch Logs for any errors
- [ ] Test demo environment by commenting on a PR
- [ ] Test production deployment on a low-traffic app first

## ✅ Monitoring Setup

- [ ] Set up CloudWatch alarms for:
  - [ ] High CPU utilization
  - [ ] High memory utilization
  - [ ] Task failures
- [ ] Set up log insights queries for common errors
- [ ] Configure SNS topics for alerts

## ✅ Cost Management

- [ ] Set up AWS Budgets
- [ ] Review Fargate pricing for your workload
- [ ] Consider Fargate Spot for non-production
- [ ] Set CloudWatch Logs retention policies
- [ ] Set up ECR image lifecycle policies

## 📝 Notes

**Important ARNs to Save:**

```
Execution Role ARN: arn:aws:iam::ACCOUNT_ID:role/mono-front-ecs-execution-role
Task Role ARN: arn:aws:iam::ACCOUNT_ID:role/mono-front-ecs-task-role
GitHub Actions Role ARN: arn:aws:iam::ACCOUNT_ID:role/mono-front-github-actions-role

Staging Secret ARN: arn:aws:secretsmanager:ap-south-1:ACCOUNT_ID:secret:mono-front-staging-secrets-XXXXXX
Production Secret ARN: arn:aws:secretsmanager:ap-south-1:ACCOUNT_ID:secret:mono-front-production-secrets-XXXXXX

ECR Repository URI: ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/mono-front

Subnet IDs: subnet-xxxxx, subnet-yyyyy
Security Group IDs: sg-xxxxx
```

## 🎯 Quick Start Commands

After completing the checklist, deploy with:

```bash
# Deploy to staging
git checkout staging
git push origin staging

# Deploy to production
git checkout main
git push origin main

# Create demo environment
# Comment on any PR: "demo-staging admin"
```

## 🆘 Rollback Plan

If deployment fails:

```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster mono-front-cluster-production \
  --service mono-front-APPNAME-production-service \
  --task-definition mono-front-APPNAME-production:PREVIOUS_REVISION
```

---

**Created**: November 2025
**Last Review**: November 2025

