# Mono Front - Deployment Pipeline

This repository now has a complete CI/CD pipeline for deploying multiple Next.js apps and Node.js backend to AWS ECS Fargate.

## 🎯 Quick Start

### For Developers

1. **Deploy to Staging**: Push to `staging` branch
2. **Deploy to Production**: Push to `main` branch
3. **Create Demo**: Comment `demo-staging <app-name>` on any PR

### For DevOps/Setup

1. Follow `AWS_SETUP_CHECKLIST.md` for initial AWS setup
2. Run `./scripts/setup-aws-resources.sh` to create basic resources
3. Configure GitHub secrets
4. Read full documentation in `DEPLOYMENT.md`

## 📁 What's Included

### GitHub Actions Workflows

- **`.github/workflows/deploy-staging.yml`**: Auto-deploy to staging on push
- **`.github/workflows/deploy.yml`**: Auto-deploy to production on push  
- **`.github/workflows/demo-environment.yml`**: Create temporary demo environments from PRs

### Dockerfiles

- **`Dockerfile.nextjs`**: For Next.js apps (admin, comic, dashboard, meme, payment, pms, web-checkin, website, zo-ops)
- **`Dockerfile.nodejs`**: For Node.js backend (ops-backend)

### Scripts

- **`scripts/fetch-secrets.sh`**: Fetch secrets from AWS Secrets Manager
- **`scripts/generate-docker-build-args.sh`**: Generate Docker build arguments
- **`scripts/generate-task-definition.sh`**: Generate ECS task definitions with secrets
- **`scripts/detect-changed-apps.sh`**: Detect which apps changed using Nx
- **`scripts/generate-app-task-definitions.sh`**: Generate all task definition files
- **`scripts/setup-aws-resources.sh`**: Helper script for AWS setup

### AWS Task Definitions

Location: `aws/task-definitions/`

For each app, there are two task definitions:
- `{app-name}-staging.json`
- `{app-name}-production.json`

Apps included:
- admin, comic, dashboard, meme, payment, pms, web-checkin, website, zo-ops, ops-backend

### Documentation

- **`DEPLOYMENT.md`**: Complete deployment guide with AWS setup, troubleshooting, and monitoring
- **`AWS_SETUP_CHECKLIST.md`**: Step-by-step checklist for AWS resource creation
- **`README-DEPLOYMENT.md`** (this file): Quick reference

## 🚀 Key Features

### 1. Selective Deployment

Only apps that changed are built and deployed:

```bash
# If you only modified apps/admin, only admin will be deployed
# Uses Nx's affected projects detection
```

### 2. Secrets Management

All environment variables are stored in AWS Secrets Manager:

- ✅ No secrets committed to repository
- ✅ Secrets injected at build time (NEXT_PUBLIC_*)
- ✅ Secrets injected at runtime (all others)
- ✅ Easy to update without code changes

### 3. Multi-Environment

Three environments supported:

- **Staging**: Lower resources, shorter log retention
- **Production**: Higher resources, longer log retention, waits for stability
- **Demo**: Ephemeral environments for PR testing

### 4. Independent App Deployments

Each app runs in its own ECS service:

- `mono-front-admin-staging-service`
- `mono-front-website-production-service`
- etc.

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  admin   │  │  comic   │  │dashboard │  │   ...    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Push to staging/main
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                           │
│  1. Detect changed apps (nx affected)                       │
│  2. Fetch secrets from AWS Secrets Manager                  │
│  3. Build Docker images                                      │
│  4. Push to ECR                                              │
│  5. Update ECS task definitions                              │
│  6. Deploy to ECS                                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                         AWS                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ECR: Docker Images                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Secrets Manager: Environment Variables               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ECS Fargate Clusters                                  │  │
│  │  ├─ mono-front-cluster-staging                        │  │
│  │  ├─ mono-front-cluster-production                     │  │
│  │  └─ mono-front-cluster-demo                           │  │
│  │                                                        │  │
│  │  Services (one per app per environment):              │  │
│  │  ├─ mono-front-admin-staging-service                  │  │
│  │  ├─ mono-front-admin-production-service               │  │
│  │  ├─ mono-front-comic-staging-service                  │  │
│  │  └─ ... (and more)                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CloudWatch Logs                                       │  │
│  │  ├─ /ecs/mono-front-admin-staging (7 days)           │  │
│  │  ├─ /ecs/mono-front-admin-production (30 days)       │  │
│  │  └─ ... (logs for each service)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Common Operations

### Deploy Specific App to Staging

```bash
# Make changes to app
git checkout staging
git add apps/admin
git commit -m "Update admin app"
git push origin staging

# GitHub Actions will automatically:
# 1. Detect that only 'admin' changed
# 2. Build and deploy only 'admin'
```

### Create Demo Environment

```bash
# 1. Create a PR with your changes
# 2. Comment on the PR:
demo-staging admin

# 3. Wait for GitHub Actions to complete
# 4. You'll get a comment with the demo URL
```

### Update Environment Variables

```bash
# Update in AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id mono-front-staging-secrets \
  --secret-string file://secrets.json

# Trigger redeployment to pick up new secrets
git commit --allow-empty -m "Redeploy with updated secrets"
git push origin staging
```

### View Logs

```bash
# View logs for a specific app
aws logs tail /ecs/mono-front-admin-staging --follow

# Or use CloudWatch Logs Insights in AWS Console
```

## 🔍 Troubleshooting

### "Service not found"

The ECS service doesn't exist yet. Create it:

```bash
aws ecs create-service \
  --cluster mono-front-cluster-staging \
  --service-name mono-front-admin-staging-service \
  --task-definition mono-front-admin-staging:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

See `DEPLOYMENT.md` for more details.

### "No apps changed"

Nx detected no changes to any apps. Check:

```bash
# See what Nx thinks changed
npx nx show projects --affected --base=origin/staging --head=HEAD --type=app
```

### Build failures

Check GitHub Actions logs and CloudWatch Logs. Common issues:
- Missing secrets in AWS Secrets Manager
- Incorrect IAM permissions
- Docker build errors

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `DEPLOYMENT.md` | Complete deployment guide |
| `AWS_SETUP_CHECKLIST.md` | Step-by-step AWS setup |
| `README-DEPLOYMENT.md` | This quick reference |

## 🎓 Learning Resources

### How Selective Deployment Works

The pipeline uses Nx's `affected` command:

```bash
# Compares current commit with previous commit
npx nx show projects --affected --base=origin/staging~1 --head=HEAD --type=app
```

This returns only apps that have changed files in their directory or dependencies.

### How Secrets Are Managed

1. **Build time** (NEXT_PUBLIC_*):
   - Fetched from Secrets Manager
   - Passed as Docker build args
   - Baked into the image

2. **Runtime** (all secrets):
   - Referenced in ECS task definition
   - ECS fetches from Secrets Manager on container start
   - Available as environment variables

## 🔗 Related Files

```
.
├── .github/workflows/
│   ├── deploy-staging.yml       # Staging deployment
│   ├── deploy.yml                # Production deployment
│   └── demo-environment.yml      # Demo environments
├── aws/
│   ├── task-definitions/         # ECS task definitions (20 files)
│   ├── task-definition-staging.json    # Legacy - can be removed
│   ├── task-definition-production.json # Legacy - can be removed
│   └── task-definition-template.json   # Legacy - can be removed
├── scripts/
│   ├── detect-changed-apps.sh
│   ├── fetch-secrets.sh
│   ├── generate-app-task-definitions.sh
│   ├── generate-docker-build-args.sh
│   ├── generate-task-definition.sh
│   └── setup-aws-resources.sh
├── Dockerfile.nextjs             # For Next.js apps
├── Dockerfile.nodejs             # For Node.js backend
├── DEPLOYMENT.md                 # Full guide
├── AWS_SETUP_CHECKLIST.md       # Setup checklist
└── README-DEPLOYMENT.md         # This file
```

## 🎉 Getting Started

1. **First time setup**: Follow `AWS_SETUP_CHECKLIST.md`
2. **Daily development**: Just push to `staging` or `main`
3. **PR testing**: Comment `demo-staging <app-name>` on PR
4. **Troubleshooting**: Check `DEPLOYMENT.md`

## 📞 Support

- GitHub Actions logs: Check workflow runs in GitHub UI
- CloudWatch Logs: Check `/ecs/mono-front-*` log groups
- Documentation: See `DEPLOYMENT.md` for detailed troubleshooting

---

**Pipeline Created**: November 2025  
**Apps Supported**: 10 (admin, comic, dashboard, meme, payment, pms, web-checkin, website, zo-ops, ops-backend)  
**Environments**: Staging, Production, Demo

