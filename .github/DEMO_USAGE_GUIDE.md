# Demo Environment Usage Guide

## Quick Start

To deploy a demo environment, simply comment on any Pull Request with the following format:

```
demo-staging <app1>,<app2>,...
```

or

```
demo-production <app1>,<app2>,...
```

## Available Apps

- `admin` - Admin dashboard
- `pms` - PMS application
- `web-checkin` - Web check-in
- `website` - Main website
- `zo-ops` - Operations dashboard
- `ops-backend` - Backend API server

## Examples

### Deploy Single App

**Staging:**
```
demo-staging website
```

**Production:**
```
demo-production admin
```

### Deploy Multiple Apps

**Staging:**
```
demo-staging admin,website
```

**Production:**
```
demo-production admin,pms,web-checkin
```

### Deploy with Spaces (optional)

Spaces after commas are automatically trimmed:
```
demo-staging admin, website, pms
```

## What Happens Next?

1. **Verification**: Your permissions are checked (need `admin`, `write`, or `maintain` access)
2. **Branch Creation**: A temporary demo branch is created with your PR changes
3. **Parallel Deployment**: Apps are built and deployed (max 2 at a time)
4. **URL Comments**: Each app gets a separate comment with:
   - Public URL (accessible immediately)
   - Task ARN (for debugging)
   - Environment info

## Example Output

After deployment, you'll see comments like this:

### 🚀 Demo: **admin**

**Environment:** staging
**URL:** http://13.126.45.78:3000
**Task ARN:** `arn:aws:ecs:ap-south-1:123456789012:task/mono-front-cluster-demo/abcd1234`

⏰ This demo will run for 60 minutes or until manually stopped.

---

### 🚀 Demo: **website**

**Environment:** staging
**URL:** http://13.126.45.79:3000
**Task ARN:** `arn:aws:ecs:ap-south-1:123456789012:task/mono-front-cluster-demo/efgh5678`

⏰ This demo will run for 60 minutes or until manually stopped.

## Important Notes

### Access
- ✅ Anyone with **write** permissions can trigger demos
- ❌ Demo environments use **public IPs** (not behind ALB)
- ⚠️ Do NOT use for sensitive data testing

### Resources
- **CPU**: 0.5 vCPU per app
- **Memory**: 1GB per app
- **Duration**: 60 minutes (then auto-stopped)
- **Logs**: Retained for 7 days

### Limits
- **Max Concurrent Builds**: 2 apps at a time
- **Timeout**: 60 minutes per deployment
- **Branch**: Automatically deleted after deployment

## Troubleshooting

### "No app names specified" Error

**Problem:**
```
❌ No app names specified. Please use format: demo-staging <app1>,<app2>,...
```

**Solution:**
Make sure to include at least one app name after the environment:
```
# ❌ Wrong
demo-staging

# ✅ Correct
demo-staging website
```

### Deployment Failed

1. **Check GitHub Actions**: Go to the Actions tab and find your workflow run
2. **Review Logs**: Each app has its own job with detailed logs
3. **AWS Console**: Use the Task ARN to check CloudWatch Logs

### Permission Denied

**Error:**
```
User <your-username> does not have permission to trigger demo environments.
```

**Solution:**
Ask a repository admin to grant you `write` or `maintain` permissions.

### App Not Responding

1. **Wait**: It takes ~2-3 minutes after URL is posted for app to be ready
2. **Check Logs**: Use CloudWatch Logs group `/ecs/mono-front-demo`
3. **Verify Task**: Use AWS Console to check task status with the provided ARN

## Stopping Demo Environments

### Manual Stop

If you need to stop a demo before the 60-minute timeout:

```bash
aws ecs stop-task \
  --cluster mono-front-cluster-demo \
  --task <task-arn-from-comment>
```

### Automatic Stop

Demos will automatically stop after 60 minutes (implementation pending).

## Best Practices

### When to Use Demos

✅ **Good Use Cases:**
- Testing new features before merge
- Sharing progress with stakeholders
- QA testing on isolated environment
- Debugging specific issues

❌ **Avoid Using For:**
- Long-running tests (use staging instead)
- Load testing (use dedicated environment)
- Storing important data (will be lost after 60 min)

### Choosing Environment

**Staging** (`demo-staging`):
- Uses staging secrets/configs
- Connected to staging databases
- Safer for testing

**Production** (`demo-production`):
- Uses production secrets/configs
- Connected to production databases
- ⚠️ Use with caution

### Resource Management

- **Deploy only what you need**: Don't deploy all apps if you only need one
- **Stop when done**: Manually stop demos when finished testing
- **Clean up**: Old task definitions can be manually deregistered if needed

## FAQ

### Q: How many apps can I deploy at once?
**A:** There's no hard limit, but deployments run 2 at a time for resource efficiency.

### Q: Can I deploy the same app twice?
**A:** No, each app can only be deployed once per demo request. The app name acts as a unique identifier.

### Q: What happens to my data?
**A:** Demo environments are ephemeral. Any data will be lost when the task stops.

### Q: Can I extend the 60-minute limit?
**A:** Currently no, but you can create a new demo environment with the same apps.

### Q: Why use public IPs instead of ALB?
**A:** Demos are temporary and don't need the complexity of load balancers. Public IPs are faster and simpler.

### Q: How do I know which port to use?
**A:** All demo environments run on port 3000 (included in the URL).

### Q: Can I SSH into the demo environment?
**A:** No, but you can use ECS Exec if needed (requires additional setup).

## Getting Help

### GitHub Issues
Create an issue in this repository with:
- PR number
- Comment used to trigger demo
- Error message (if any)
- Expected vs actual behavior

### AWS Resources
- CloudWatch Logs: `/ecs/mono-front-demo`
- ECS Cluster: `mono-front-cluster-demo`
- ECR Repository: `mono-front`

### Workflow File
The workflow is defined in `.github/workflows/demo-environment.yml`

## Changelog

### Latest Version (Current)
- ✨ Added support for comma-separated app names
- ✨ Added parallel deployment with matrix strategy
- ✨ Integrated Docker Buildx with registry caching
- ✨ Added static file extraction and S3 upload
- ✨ Improved disk space management
- ✨ Better error handling and diagnostics
- ✨ Individual PR comments per app
- ✨ Automatic demo branch cleanup

### Previous Version
- Single app deployment only
- No caching support
- Single PR comment
- Manual branch cleanup

---

**Happy Testing! 🚀**

