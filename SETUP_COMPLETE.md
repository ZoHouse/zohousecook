# 🎉 AWS Setup Complete - Ready to Deploy!

## ✅ What's Been Done

### 1. Configuration Updated
- ✅ All files updated with AWS Account ID: `670664477975`
- ✅ Region set to: `ap-south-1`
- ✅ GitHub repository: `thezoworld/mono-front`

### 2. IAM Roles Created
- ✅ **ECS Execution Role**: `arn:aws:iam::670664477975:role/mono-front-ecs-execution-role`
- ✅ **ECS Task Role**: `arn:aws:iam::670664477975:role/mono-front-ecs-task-role`
- ✅ **GitHub Actions Role**: `arn:aws:iam::670664477975:role/mono-front-github-actions-role`
- ✅ **OIDC Provider**: Configured for GitHub Actions

### 3. AWS Infrastructure Created
- ✅ **ECR Repository**: `670664477975.dkr.ecr.ap-south-1.amazonaws.com/mono-front`
- ✅ **VPC**: `vpc-0b25e960`
- ✅ **Subnets**: `subnet-3ff89544`, `subnet-dc297390`
- ✅ **Security Group**: `sg-079303d020372cc8b` (ports 3000 and 80 open)

### 4. ECS Clusters Created
- ✅ `mono-front-cluster-staging`
- ✅ `mono-front-cluster-production`
- ✅ `mono-front-cluster-demo`

### 5. CloudWatch Log Groups
- ✅ 20 log groups created (10 apps × 2 environments)
- ✅ 1 demo log group
- ✅ Retention: 7 days (staging), 30 days (production)

### 6. Workflow Files Updated
- ✅ Subnet and security group IDs configured
- ✅ All AWS account IDs updated
- ✅ Ready for secret ARNs (next step)

## 🔜 Final Steps

### Step 1: Create AWS Secrets from Existing .env Files

Run this script to extract all secrets from your committed `.env.staging` and `.env.production` files:

```bash
./scripts/extract-and-create-secrets.sh
```

This will:
1. Extract all `NEXT_PUBLIC_*` and other environment variables
2. Merge them from all apps
3. Show you a preview
4. Create/update AWS Secrets Manager secrets
5. Update workflow files with complete secret ARNs (including suffixes)

### Step 2: Add GitHub Repository Secrets

Go to: `https://github.com/thezoworld/mono-front/settings/secrets/actions`

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `AWS_ROLE_ARN` | `arn:aws:iam::670664477975:role/mono-front-github-actions-role` |
| `AWS_REGION` | `ap-south-1` |

### Step 3: (Optional) Clean Up Committed .env Files

After secrets are in AWS Secrets Manager, remove .env files from git:

```bash
# Remove all .env files from git
git rm apps/*/.env.production apps/*/.env.staging apps/*/.env.local apps/ops-backend/.env

# Commit the change
git commit -m "Remove environment files (moved to AWS Secrets Manager)"

# Push to remote
git push origin staging
```

### Step 4: Test First Deployment

```bash
# Create a test branch
git checkout -b test-deployment

# Make a small change to trigger deployment
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test: trigger deployment pipeline"

# Push to staging
git push origin test-deployment
git checkout staging
git merge test-deployment
git push origin staging

# Watch GitHub Actions: https://github.com/thezoworld/mono-front/actions
```

## 📁 Configuration Files

All configuration is saved in `aws-config.txt`:

```
AWS_ACCOUNT_ID=670664477975
AWS_REGION=ap-south-1
VPC_ID=vpc-0b25e960
SUBNET_1=subnet-3ff89544
SUBNET_2=subnet-dc297390
SECURITY_GROUP_ID=sg-079303d020372cc8b
ECR_URI=670664477975.dkr.ecr.ap-south-1.amazonaws.com/mono-front

EXECUTION_ROLE_ARN=arn:aws:iam::670664477975:role/mono-front-ecs-execution-role
TASK_ROLE_ARN=arn:aws:iam::670664477975:role/mono-front-ecs-task-role
GITHUB_ACTIONS_ROLE_ARN=arn:aws:iam::670664477975:role/mono-front-github-actions-role

STAGING_CLUSTER=mono-front-cluster-staging
PRODUCTION_CLUSTER=mono-front-cluster-production
DEMO_CLUSTER=mono-front-cluster-demo
```

## 🚀 How to Deploy

### Deploy to Staging
```bash
git checkout staging
git merge your-feature-branch
git push origin staging
# ✅ Only changed apps will be built and deployed
```

### Deploy to Production
```bash
git checkout main
git merge staging
git push origin main
# ✅ Only changed apps will be built and deployed
```

### Create Demo Environment
Comment on any PR:
```
demo-staging admin
```
or
```
demo-production website
```

## 📊 Monitoring

### CloudWatch Logs
```bash
# View logs for a specific app
aws logs tail /ecs/mono-front-admin-staging --follow

# Or use AWS Console
https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1#logsV2:log-groups
```

### ECS Services
```bash
# List services in staging
aws ecs list-services --cluster mono-front-cluster-staging

# Describe a specific service
aws ecs describe-services \
  --cluster mono-front-cluster-staging \
  --services mono-front-admin-staging-service
```

### ECR Images
```bash
# List images in repository
aws ecr list-images --repository-name mono-front

# View in console
https://console.aws.amazon.com/ecr/repositories/private/670664477975/mono-front?region=ap-south-1
```

## 🔧 Useful Commands

### Update Secrets
```bash
# Update staging secrets
aws secretsmanager put-secret-value \
  --secret-id mono-front-staging-secrets-XXXXXX \
  --secret-string '{"NEXT_PUBLIC_KEY":"new-value"}'

# Update production secrets
aws secretsmanager put-secret-value \
  --secret-id mono-front-production-secrets-XXXXXX \
  --secret-string '{"NEXT_PUBLIC_KEY":"new-value"}'
```

### Force Redeploy (without code changes)
```bash
aws ecs update-service \
  --cluster mono-front-cluster-staging \
  --service mono-front-admin-staging-service \
  --force-new-deployment
```

### Check Which Apps Changed
```bash
# See what Nx detects as changed
npx nx show projects --affected --base=origin/staging --head=HEAD --type=app
```

## ⚠️ Important Notes

1. **ECS Services**: Services will be automatically created on first deployment
2. **Secret ARNs**: Will be updated after running `extract-and-create-secrets.sh`
3. **First Deployment**: May take 10-15 minutes for Docker builds
4. **Costs**: Monitor AWS costs in first few days
5. **Logs**: Check CloudWatch Logs if deployment fails

## 📚 Documentation

- **Complete Guide**: `DEPLOYMENT.md`
- **Setup Checklist**: `AWS_SETUP_CHECKLIST.md`
- **Quick Reference**: `README-DEPLOYMENT.md`

## 🆘 Troubleshooting

### Deployment fails with "Service not found"
ECS services are created automatically on first deployment. This is expected.

### "Failed to pull image"
Check that ECR repository permissions are correct and execution role has ECR access.

### "Secrets not found"
Run `./scripts/extract-and-create-secrets.sh` to create secrets from .env files.

### Apps not deploying
Check if Nx detects them as changed:
```bash
npx nx show projects --affected --base=origin/staging --type=app
```

## ✅ Ready to Deploy!

Your pipeline is now complete. Just run:

```bash
./scripts/extract-and-create-secrets.sh
```

Then push to `staging` or `main` to deploy! 🚀

---

**Setup Completed**: November 4, 2025  
**AWS Account**: 670664477975  
**Region**: ap-south-1  
**Apps**: 10 (admin, comic, dashboard, meme, payment, pms, web-checkin, website, zo-ops, ops-backend)

