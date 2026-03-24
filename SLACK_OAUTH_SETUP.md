# Slack OAuth Integration Setup Guide

## Overview
The Slack Messaging tool now supports sending messages from your personal Slack account instead of the bot account. This makes messages appear more authentic and less likely to be ignored by recipients.

## What Was Implemented

### Backend Changes (`apps/ops-backend/server.js`)

1. **OAuth Endpoints:**
   - `GET /api/slack/oauth/connect` - Initiates OAuth flow
   - `GET /api/slack/oauth/callback` - Handles OAuth callback
   - `GET /api/slack/oauth/status` - Checks connection status
   - `POST /api/slack/oauth/disconnect` - Disconnects Slack account

2. **Token Storage:**
   - User tokens are stored in Redis with 90-day expiration
   - Tokens are keyed by user ID for secure access
   - Automatic token validation on each use

3. **Message Sending:**
   - Modified `/api/slack/message` endpoint to accept `userId`
   - Automatically uses user token if available, falls back to bot token
   - Returns `sentFromUserAccount` flag in response

### Frontend Changes (`apps/zo-ops/src/components/SlackMessaging.jsx`)

1. **Connection Status UI:**
   - Shows connection status at the top of the page
   - Displays connected user name and team
   - "Connect Slack" button when not connected
   - "Disconnect" button when connected

2. **Automatic Token Usage:**
   - Automatically uses user account when connected
   - Falls back to bot account if not connected
   - Success messages indicate which account was used

## Setup Instructions

### 1. Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name your app (e.g., "Zo Ops Messaging")
4. Select your workspace

### 2. Configure OAuth Settings

1. In your app settings, go to **OAuth & Permissions**
2. Add the following **Redirect URLs:**
   - Development: `http://localhost:4211/api/slack/oauth/callback`
   - Production: `https://zo.xyz/ops-backend/api/slack/oauth/callback`
   - Staging: `https://staging.zo.xyz/ops-backend/api/slack/oauth/callback`

3. Under **Scopes** → **User Token Scopes**, add:
   - `chat:write` - Send messages as user
   - `channels:read` - Read channel information
   - `pins:write` - Pin messages (if you want to keep pinning feature)
   - `users:read` - Read user information
   - `users:read.email` - Read user email

4. Under **Scopes** → **Bot Token Scopes** (keep existing bot scopes):
   - `chat:write` - Send messages as bot (fallback)
   - `channels:read`
   - `pins:write`

### 3. Install App to Workspace

1. Go to **OAuth & Permissions** page
2. Click **Install to Workspace**
3. Authorize the app
4. Copy the **OAuth Tokens**:
   - **Client ID** (starts with `xxxxx.xxxxx`)
   - **Client Secret** (starts with `xxxxx`)

### 4. Environment Variables

Add the following to your `.env` file in `apps/ops-backend/`:

```bash
# Slack OAuth Configuration
SLACK_CLIENT_ID=your-client-id-here
SLACK_CLIENT_SECRET=your-client-secret-here
SLACK_REDIRECT_URI=https://zo.xyz/ops-backend/api/slack/oauth/callback
FRONTEND_URL=https://zo.xyz/ops
```

**For Development:**
```bash
SLACK_REDIRECT_URI=http://localhost:4211/api/slack/oauth/callback
FRONTEND_URL=http://localhost:4210
```

### 5. User ID Configuration

The system uses the user ID from the authentication data. Make sure your auth system provides one of:
- `user.id`
- `user_id`
- `mobile_number` (as fallback)

If your auth system doesn't provide a unique user ID, you may need to modify the `userId` extraction logic in `SlackMessaging.jsx` (around line 80).

## How It Works

### Connection Flow

1. User clicks "Connect Slack" button
2. System generates OAuth URL with required scopes
3. User is redirected to Slack authorization page
4. User authorizes the app
5. Slack redirects back with authorization code
6. Backend exchanges code for access token
7. Token is stored in Redis keyed by user ID
8. User is redirected back to frontend with success message

### Message Sending Flow

1. User composes and sends message
2. Frontend passes `userId` to backend
3. Backend checks if user has connected Slack account
4. If connected, uses user's access token
5. If not connected, falls back to bot token
6. Message is sent via Slack API
7. Response indicates which account was used

## Security Considerations

1. **Token Storage:**
   - Tokens are stored in Redis (not in database)
   - Tokens expire after 90 days
   - Tokens are automatically validated before use

2. **State Parameter:**
   - OAuth flow uses state parameter to prevent CSRF attacks
   - State is stored in Redis with 10-minute expiration

3. **Token Validation:**
   - Tokens are validated on each API call
   - Invalid tokens are automatically removed

## Troubleshooting

### "Failed to connect Slack" Error

1. Check that `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` are set correctly
2. Verify redirect URI matches exactly in Slack app settings
3. Check that all required scopes are added
4. Ensure Redis is running and accessible

### Messages Still Sent from Bot

1. Verify user is connected (check connection status UI)
2. Check that `userId` is being passed correctly
3. Verify token is stored in Redis: `redis-cli GET slack:user:{userId}`
4. Check backend logs for token retrieval errors

### Token Expired

- Tokens expire after 90 days
- User needs to reconnect Slack account
- System will automatically fall back to bot token

## Testing

1. **Test Connection:**
   - Click "Connect Slack"
   - Complete OAuth flow
   - Verify connection status shows your name

2. **Test Message Sending:**
   - Send a test message to a channel
   - Verify message appears from your account (not bot)
   - Check success message indicates "from your Slack account"

3. **Test Disconnect:**
   - Click "Disconnect"
   - Verify connection status shows "Not Connected"
   - Send a message and verify it's from bot account

## Notes

- The bot token is still required as a fallback
- Users can disconnect and reconnect at any time
- Each user's token is stored separately
- Multiple users can connect their own Slack accounts
