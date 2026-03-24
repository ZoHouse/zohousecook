# Testing Deployment Pipeline on staging-new

## 🧪 Test Branch Setup

This branch (`staging-new`) is configured to trigger the staging deployment workflow for testing purposes.

## ✅ Pre-deployment Checklist

Before pushing:

- [ ] AWS IAM roles created
- [ ] ECR repository created
- [ ] ECS clusters created
- [ ] Security groups configured
- [ ] Secrets created in AWS Secrets Manager (20 secrets)
- [ ] GitHub repository secret added: `AWS_ROLE_ARN`

## 🚀 Testing Steps

### 1. Push to staging-new
```bash
git push origin staging-new
```

### 2. Monitor Deployment
- Watch GitHub Actions: https://github.com/thezoworld/mono-front/actions
- Check CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1

### 3. Verify Deployment
```bash
# Check which apps were deployed
aws ecs list-services --cluster mono-front-cluster-staging

# Check service status
aws ecs describe-services \
  --cluster mono-front-cluster-staging \
  --services mono-front-APPNAME-staging-service
```

## 🔄 After Successful Test

Once verified on `staging-new`, merge to actual staging:

```bash
# Switch to staging branch
git checkout staging

# Merge test branch
git merge staging-new

# Push to staging
git push origin staging

# Update workflow to remove staging-new trigger
# Edit .github/workflows/deploy-staging.yml and remove:
#   - staging-new  # Test branch
```

## 📊 What Will Happen

1. **GitHub Actions** detects push to staging-new
2. **Nx** determines which apps changed
3. **For each changed app:**
   - Fetches app-specific secrets from AWS
   - Builds Docker image
   - Pushes to ECR
   - Updates ECS task definition
   - Deploys to staging cluster

## 🐛 Troubleshooting

### If deployment fails:
1. Check GitHub Actions logs
2. Check CloudWatch Logs: `/ecs/mono-front-APPNAME-staging`
3. Verify secrets exist in AWS Secrets Manager
4. Check ECS task definition was registered

### Common issues:
- **"Secret not found"**: Run `./scripts/extract-and-create-app-secrets.sh` again
- **"Service not found"**: Services are created on first deployment (expected)
- **"No apps changed"**: Nx didn't detect changes, try: `npx nx show projects --affected --type=app`

---

**Test Branch**: staging-new  
**Target Environment**: Staging  
**Ready for Production**: After successful test, merge to main

