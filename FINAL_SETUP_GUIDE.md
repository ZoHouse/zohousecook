# 🎉 Final Setup Guide - App-Specific Secrets

## ✅ What's Been Completed

### Infrastructure Created
- ✅ IAM Roles (execution, task, GitHub Actions OIDC)
- ✅ ECR Repository
- ✅ ECS Clusters (staging, production, demo)
- ✅ Security Groups & Networking
- ✅ CloudWatch Log Groups (21 log groups)
- ✅ All configuration files updated with account ID: `670664477975`

### Updated Approach: App-Specific Secrets 🔐

We've implemented **one secret per app per environment** for better security and isolation:

```
mono-front-admin-staging-secrets
mono-front-admin-production-secrets
mono-front-comic-staging-secrets
mono-front-comic-production-secrets
... (20 total secrets for 10 apps × 2 environments)
```

**Benefits:**
- ✅ Better security isolation
- ✅ Easier to manage per-app secrets
- ✅ Can update one app's secrets without affecting others
- ✅ Clear ownership and organization

## 🚀 Final Steps to Deploy

### Step 1: Create Secrets from Your .env Files

Run this command to extract ALL variables from your existing `.env.staging` and `.env.production` files and create app-specific secrets:

```bash
./scripts/extract-and-create-app-secrets.sh
```

This will:
1. Read complete `.env.staging` and `.env.production` files for each app
2. Convert them to JSON
3. Show you a preview of what will be created
4. Create 20 secrets in AWS Secrets Manager (one per app per environment)
5. Update all task definitions with app-specific secret references
6. Generate `aws-secrets-mapping.txt` with all secret ARNs

**Expected output:**
```
🔍 Extracting secrets from .env files (one secret per app)
============================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Processing app: admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🔹 Environment: staging
     ✓ Found: apps/admin/.env.staging
     📊 Extracted 15 environment variables
     ☁️  Creating/updating AWS secret: mono-front-admin-staging-secrets
     ✅ Secret created: arn:aws:secretsmanager:ap-south-1:...

  🔹 Environment: production
     ✓ Found: apps/admin/.env.production
     📊 Extracted 18 environment variables
     ☁️  Creating/updating AWS secret: mono-front-admin-production-secrets
     ✅ Secret created: arn:aws:secretsmanager:ap-south-1:...

... (continues for all 10 apps)
```

### Step 2: Add GitHub Repository Secrets

Go to: **https://github.com/thezoworld/mono-front/settings/secrets/actions**

Click **"New repository secret"** and add:

| Name | Value |
|------|-------|
| `AWS_ROLE_ARN` | `arn:aws:iam::670664477975:role/mono-front-github-actions-role` |
| `AWS_REGION` | `ap-south-1` |

### Step 3: Test Deployment!

```bash
# Create a test branch
git checkout -b test-deployment-pipeline

# Make a small change
echo "# Pipeline test" >> README.md
git add README.md
git commit -m "test: verify deployment pipeline"

# Push to staging
git push origin test-deployment-pipeline:staging

# Watch the deployment
# https://github.com/thezoworld/mono-front/actions
```

## 📊 Secret Structure

### How Secrets Are Organized

```
AWS Secrets Manager
├── mono-front-admin-staging-secrets
│   ├── NEXT_PUBLIC_ZO_CLIENT_KEY
│   ├── NEXT_PUBLIC_ZOSTEL_BASE_URL
│   ├── API_BASE_URL
│   └── ... (all variables from apps/admin/.env.staging)
│
├── mono-front-admin-production-secrets
│   ├── NEXT_PUBLIC_ZO_CLIENT_KEY
│   ├── NEXT_PUBLIC_ZOSTEL_BASE_URL
│   └── ... (all variables from apps/admin/.env.production)
│
├── mono-front-website-staging-secrets
│   └── ... (all variables from apps/website/.env.staging)
│
└── ... (20 total secrets)
```

### How It Works in the Pipeline

1. **Build Time**: 
   - GitHub Actions fetches the app-specific secret: `mono-front-admin-staging-secrets`
   - Exports `NEXT_PUBLIC_*` variables as build args
   - Builds Docker image with these variables baked in

2. **Runtime**:
   - ECS task definition references the app-specific secret
   - ECS injects ALL variables from the secret into the container
   - Both `NEXT_PUBLIC_*` and server-side secrets are available

## 🔧 Managing Secrets

### Update a Single App's Secrets

```bash
# Update staging secrets for admin app
aws secretsmanager put-secret-value \
  --secret-id mono-front-admin-staging-secrets \
  --secret-string '{
    "NEXT_PUBLIC_ZO_CLIENT_KEY": "new-value",
    "API_BASE_URL": "https://new-api.com",
    ...
  }'

# Force redeploy to pick up new secrets
aws ecs update-service \
  --cluster mono-front-cluster-staging \
  --service mono-front-admin-staging-service \
  --force-new-deployment
```

### View Secrets in AWS Console

```bash
# Direct links to your secrets
https://console.aws.amazon.com/secretsmanager/home?region=ap-south-1#!/listSecrets/
```

### Update from .env File

```bash
# If you update apps/admin/.env.staging, re-run:
./scripts/extract-and-create-app-secrets.sh

# It will update only the changed secrets
```

## 🗑️ Clean Up .env Files (After Verification)

Once you've verified deployments work, you can remove .env files from git:

```bash
# List all .env files first
find apps -name ".env.*" -o -name ".env"

# Remove from git
git rm apps/*/.env.* apps/ops-backend/.env apps/*/.env.local

# Commit
git commit -m "chore: remove .env files (moved to AWS Secrets Manager)"

# Push
git push origin staging
```

**⚠️ Important**: Keep local copies of your .env files as backup before removing from git!

## 📁 Key Files

### Configuration Files
- `aws-config.txt` - All AWS resource IDs
- `aws-secrets-mapping.txt` - All secret ARNs (generated after running script)

### Scripts
- `scripts/extract-and-create-app-secrets.sh` - Main secret creation script
- `scripts/get-app-secret-arn.sh` - Helper to get secret ARN for an app
- `scripts/create-ecs-services.sh` - Create ECS services (optional)

### Workflows
- `.github/workflows/deploy-staging.yml` - ✅ Updated for app-specific secrets
- `.github/workflows/deploy.yml` - ✅ Updated for app-specific secrets
- `.github/workflows/demo-environment.yml` - ✅ Updated for app-specific secrets

## 🚀 Deployment Workflows

### Staging Deployment
```bash
git push origin staging
```
- ✅ Detects changed apps using `nx affected`
- ✅ Fetches app-specific secrets for each changed app
- ✅ Builds and deploys only changed apps

### Production Deployment
```bash
git push origin main
```
- ✅ Same as staging but with production resources
- ✅ Waits for service stabilization

### Demo Environment
Comment on any PR:
```
demo-staging admin
```
- ✅ Creates temporary environment with app-specific secrets
- ✅ Comments back with public URL

## 📊 Monitoring

### View Logs
```bash
# Tail logs for specific app
aws logs tail /ecs/mono-front-admin-staging --follow

# Or in CloudWatch Console
https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1#logsV2:log-groups
```

### Check Deployment Status
```bash
# List services
aws ecs list-services --cluster mono-front-cluster-staging

# Describe service
aws ecs describe-services \
  --cluster mono-front-cluster-staging \
  --services mono-front-admin-staging-service

# View in ECS Console
https://console.aws.amazon.com/ecs/home?region=ap-south-1#/clusters
```

## 🔍 Troubleshooting

### "Secret not found" Error
Make sure you ran `./scripts/extract-and-create-app-secrets.sh` to create all secrets.

### "Service not found" Error
ECS services are created automatically on first deployment. This is expected.

### App not deploying
Check if Nx detects it as changed:
```bash
npx nx show projects --affected --base=origin/staging --type=app
```

### Wrong secrets in container
```bash
# Check what's in the secret
aws secretsmanager get-secret-value \
  --secret-id mono-front-admin-staging-secrets \
  --query SecretString \
  --output text | jq .

# Check task definition
aws ecs describe-task-definition \
  --task-definition mono-front-admin-staging \
  --query 'taskDefinition.containerDefinitions[0].secrets' \
  --output json
```

## ✅ Next Actions

1. **Run**: `./scripts/extract-and-create-app-secrets.sh` ✨
2. **Add GitHub Secrets**: AWS_ROLE_ARN and AWS_REGION
3. **Test Deploy**: Push to staging branch
4. **Monitor**: Watch GitHub Actions and CloudWatch Logs
5. **(Optional)**: Remove .env files from git after verification

## 🎉 You're Ready!

Your CI/CD pipeline is now complete with app-specific secrets management!

**Pipeline Summary:**
- ✅ 10 apps supported
- ✅ 20 secrets (one per app per environment)
- ✅ Selective deployment (only changed apps)
- ✅ Separate staging and production
- ✅ Demo environments from PRs
- ✅ No secrets in git

---

**Setup Completed**: November 4, 2025  
**AWS Account**: 670664477975  
**Region**: ap-south-1  
**Apps**: admin, comic, dashboard, meme, payment, pms, web-checkin, website, zo-ops, ops-backend

