# Testing Slack OAuth Integration

## Test URLs

### For Local Development:
**Frontend (Slack Messaging Page):**
```
http://localhost:4210/slack-messaging
```

**Backend OAuth Endpoints:**
- Initiate OAuth: `http://localhost:4211/api/slack/oauth/connect?userId=YOUR_USER_ID`
- OAuth Callback: `http://localhost:4211/api/slack/oauth/callback`
- Check Status: `http://localhost:4211/api/slack/oauth/status?userId=YOUR_USER_ID`

### For Production:
**Frontend (Slack Messaging Page):**
```
https://zo.xyz/ops/slack-messaging
```

**Backend OAuth Endpoints:**
- Initiate OAuth: `https://zo.xyz/ops-backend/api/slack/oauth/connect?userId=YOUR_USER_ID`
- OAuth Callback: `https://zo.xyz/ops-backend/api/slack/oauth/callback`
- Check Status: `https://zo.xyz/ops-backend/api/slack/oauth/status?userId=YOUR_USER_ID`

## Quick Test Steps

1. **Start the Frontend:**
   ```bash
   cd mono-front
   nx serve zo-ops
   ```
   Frontend will be available at: `http://localhost:4210`

2. **Start the Backend (requires DB and Redis):**
   ```bash
   cd mono-front/apps/ops-backend
   node server.js
   ```
   Backend will be available at: `http://localhost:4211`

3. **Test the OAuth Flow:**
   - Navigate to: `http://localhost:4210/slack-messaging`
   - Click "Connect Slack" button
   - You'll be redirected to Slack for authorization
   - After authorizing, you'll be redirected back
   - You should see "Connected as [Your Name]"

## Required Environment Variables

Before starting the backend, make sure your `.env` file has:

```bash
# Database (required)
DB_HOST_READ=your-db-host
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Redis (required)
REDIS_URL=your-redis-host:6379

# Slack OAuth (already configured)
SLACK_CLIENT_ID=2315784668.10249038418855
SLACK_CLIENT_SECRET=2822dc9adfa29f1b62e46adb158c9d22
SLACK_REDIRECT_URI=http://localhost:4211/api/slack/oauth/callback
FRONTEND_URL=http://localhost:4210
```

## Testing on Production/Staging

If you have access to production or staging environments, you can test there:

1. Make sure the environment variables are set in your production/staging environment
2. Navigate to: `https://zo.xyz/ops/slack-messaging` (or your staging URL)
3. Click "Connect Slack"
4. Complete the OAuth flow

## Troubleshooting

### Server won't start
- Check that all required environment variables are set
- Verify database and Redis connections
- Check server logs for specific errors

### OAuth redirect fails
- Verify `SLACK_REDIRECT_URI` matches exactly what's in Slack app settings
- Check that redirect URL is added in Slack app OAuth settings
- Ensure `FRONTEND_URL` is correct

### "User ID not found" error
- Make sure you're logged in to the frontend
- Check that auth data is stored in localStorage
- Verify userId extraction logic matches your auth system
