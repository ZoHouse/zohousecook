const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

const SCOPES = "read:user repo";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} not set`);
  return v;
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("GITHUB_CLIENT_ID"),
    redirect_uri: `${requireEnv("EARN_BASE_URL")}/api/connect/github/callback`,
    scope: SCOPES,
    state,
    allow_signup: "true",
  });
  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  scope: string;
}> {
  const res = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: requireEnv("GITHUB_CLIENT_ID"),
      client_secret: requireEnv("GITHUB_CLIENT_SECRET"),
      code,
    }),
  });
  if (!res.ok) {
    throw new Error(`github token exchange failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    access_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (data.error || !data.access_token) {
    throw new Error(
      `github oauth: ${data.error_description ?? data.error ?? "unknown error"}`,
    );
  }
  return {
    accessToken: data.access_token,
    scope: data.scope ?? "",
  };
}

export async function fetchGitHubUser(accessToken: string): Promise<{
  id: string;
  login: string;
}> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`github user fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as { id: number; login: string };
  return { id: String(data.id), login: data.login };
}
