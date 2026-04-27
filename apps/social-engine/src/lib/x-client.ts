import { getTokens, saveTokens, TokenRow } from "./store";

// OAuth 2.0 user-context tokens for X v2.
// Access token expires in ~2h. Refresh token rotates on every use, so we
// always persist the new pair we get back from /2/oauth2/token.

const PLATFORM = "x";
const REFRESH_URL = "https://api.x.com/2/oauth2/token";
const TWEET_URL = "https://api.x.com/2/tweets";
const SAFETY_WINDOW_MS = 60_000;

function readClientCreds() {
  const id = process.env.X_CLIENT_ID;
  const secret = process.env.X_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("X_CLIENT_ID and X_CLIENT_SECRET must be set");
  }
  return { id, secret };
}

async function bootstrapFromEnv(): Promise<TokenRow | null> {
  const access = process.env.X_INITIAL_ACCESS_TOKEN;
  const refresh = process.env.X_INITIAL_REFRESH_TOKEN;
  if (!access || !refresh) return null;
  // Force refresh on first use so we verify creds + capture the rotated pair.
  return saveTokens(PLATFORM, {
    access_token: access,
    refresh_token: refresh,
    expires_at: new Date(Date.now() - 1000).toISOString(),
  });
}

async function refreshAccessToken(currentRefresh: string): Promise<TokenRow> {
  const { id, secret } = readClientCreds();
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: currentRefresh,
    client_id: id,
  });

  const res = await fetch(REFRESH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`X token refresh ${res.status}: ${text.slice(0, 500)}`);
  }
  let parsed: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`X token refresh non-JSON: ${text.slice(0, 200)}`);
  }
  if (!parsed.access_token || !parsed.refresh_token || !parsed.expires_in) {
    throw new Error(`X token refresh missing fields: ${text.slice(0, 200)}`);
  }
  return saveTokens(PLATFORM, {
    access_token: parsed.access_token,
    refresh_token: parsed.refresh_token,
    expires_at: new Date(Date.now() + parsed.expires_in * 1000).toISOString(),
  });
}

async function getValidAccessToken(): Promise<string> {
  let row = await getTokens(PLATFORM);
  if (!row) {
    row = await bootstrapFromEnv();
    if (!row) {
      throw new Error(
        "No X tokens stored and X_INITIAL_ACCESS_TOKEN/X_INITIAL_REFRESH_TOKEN not set in env"
      );
    }
  }
  if (new Date(row.expires_at).getTime() - Date.now() <= SAFETY_WINDOW_MS) {
    row = await refreshAccessToken(row.refresh_token);
  }
  return row.access_token;
}

export interface PostTweetResult {
  tweetId: string;
}

export async function postTweet(text: string): Promise<PostTweetResult> {
  let token = await getValidAccessToken();

  const send = async (bearer: string) =>
    fetch(TWEET_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

  let res = await send(token);
  if (res.status === 401) {
    const row = await getTokens(PLATFORM);
    if (row) {
      const refreshed = await refreshAccessToken(row.refresh_token);
      token = refreshed.access_token;
      res = await send(token);
    }
  }

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`X API ${res.status}: ${body.slice(0, 500)}`);
  }
  let parsed: { data?: { id?: string } } = {};
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error(`X API non-JSON: ${body.slice(0, 200)}`);
  }
  const tweetId = parsed.data?.id;
  if (!tweetId) {
    throw new Error(`X API missing tweet id: ${body.slice(0, 200)}`);
  }
  return { tweetId };
}
