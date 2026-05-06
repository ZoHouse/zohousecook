import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const GITHUB_API = "https://api.github.com";

type GhEvent = {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string; url: string };
  payload: Record<string, unknown>;
};

type GhRepo = {
  id: number;
  name: string;
  full_name: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
};

async function gh<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`github ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

type ShipRow = {
  source: string;
  kind: string;
  ref: string;
  repo: string;
  title: string;
  occurredAt: Date;
  metadata: Record<string, unknown>;
};

function eventToShip(ev: GhEvent): ShipRow | null {
  const repo = ev.repo.name; // 'owner/repo'
  const occurredAt = new Date(ev.created_at);

  switch (ev.type) {
    case "PushEvent": {
      const payload = ev.payload as {
        head?: string;
        commits?: Array<{ message: string }>;
        size?: number;
      };
      if (!payload.head) return null;
      const msg = payload.commits?.[0]?.message?.split("\n")[0] ?? "Pushed commits";
      return {
        source: "github",
        kind: "commit",
        ref: `https://github.com/${repo}/commit/${payload.head}`,
        repo,
        title: `${msg} · ${repo}`,
        occurredAt,
        metadata: { commits: payload.size ?? payload.commits?.length ?? 1 },
      };
    }

    case "PullRequestEvent": {
      const payload = ev.payload as {
        action?: string;
        pull_request?: {
          merged?: boolean;
          html_url?: string;
          title?: string;
          number?: number;
        };
      };
      if (
        payload.action !== "closed" ||
        !payload.pull_request?.merged ||
        !payload.pull_request.html_url
      ) {
        return null;
      }
      return {
        source: "github",
        kind: "pr_merged",
        ref: payload.pull_request.html_url,
        repo,
        title: `PR #${payload.pull_request.number}: ${payload.pull_request.title ?? "(no title)"}`,
        occurredAt,
        metadata: { number: payload.pull_request.number },
      };
    }

    case "ReleaseEvent": {
      const payload = ev.payload as {
        action?: string;
        release?: { html_url?: string; name?: string; tag_name?: string };
      };
      if (payload.action !== "published" || !payload.release?.html_url) return null;
      return {
        source: "github",
        kind: "release",
        ref: payload.release.html_url,
        repo,
        title: `Released ${payload.release.tag_name ?? payload.release.name ?? "version"} · ${repo}`,
        occurredAt,
        metadata: { tag: payload.release.tag_name },
      };
    }

    case "CreateEvent": {
      const payload = ev.payload as { ref_type?: string };
      if (payload.ref_type !== "repository") return null;
      return {
        source: "github",
        kind: "repo_created",
        ref: `https://github.com/${repo}`,
        repo,
        title: `Created repo ${repo}`,
        occurredAt,
        metadata: {},
      };
    }

    default:
      return null;
  }
}

export async function ingestGitHubFor(
  userId: string,
  accessToken: string,
  githubLogin: string,
): Promise<{ shipsAdded: number; productsAdded: number }> {
  // 1. Pull recent events.
  const events = await gh<GhEvent[]>(
    `/users/${encodeURIComponent(githubLogin)}/events?per_page=100`,
    accessToken,
  );
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
  const candidates = events
    .map(eventToShip)
    .filter((s): s is ShipRow => s !== null)
    .filter((s) => s.occurredAt.getTime() >= cutoff);

  // 2. Dedupe against existing ships for this user.
  let shipsAdded = 0;
  if (candidates.length > 0) {
    const refs = candidates.map((c) => c.ref);
    const existing = await prisma.builderShip.findMany({
      where: { userId, source: "github", ref: { in: refs } },
      select: { ref: true },
    });
    const existingRefs = new Set(existing.map((e) => e.ref));
    const fresh = candidates.filter((c) => !existingRefs.has(c.ref));

    if (fresh.length > 0) {
      await prisma.builderShip.createMany({
        data: fresh.map((c) => ({
          userId,
          source: c.source,
          kind: c.kind,
          ref: c.ref,
          repo: c.repo,
          title: c.title,
          metadata: c.metadata as Prisma.InputJsonValue,
          occurredAt: c.occurredAt,
        })),
      });
      shipsAdded = fresh.length;
    }
  }

  // 3. Auto-detect products: user's own repos with a homepage URL.
  const repos = await gh<GhRepo[]>(
    `/user/repos?affiliation=owner&sort=updated&per_page=100`,
    accessToken,
  );
  const products = repos.filter(
    (r) =>
      !r.fork &&
      !r.archived &&
      typeof r.homepage === "string" &&
      r.homepage.trim().length > 0 &&
      /^https?:\/\//.test(r.homepage),
  );

  let productsAdded = 0;
  for (const r of products) {
    const result = await prisma.builderProduct.upsert({
      where: {
        userId_repoFullName: { userId, repoFullName: r.full_name },
      },
      create: {
        userId,
        repoFullName: r.full_name,
        homepageUrl: r.homepage as string,
        name: r.name,
        language: r.language,
        stars: r.stargazers_count,
      },
      update: {
        homepageUrl: r.homepage as string,
        language: r.language,
        stars: r.stargazers_count,
      },
    });
    if (result.detectedAt.getTime() > Date.now() - 5000) productsAdded++;
  }

  return { shipsAdded, productsAdded };
}
