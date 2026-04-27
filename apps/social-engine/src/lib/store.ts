import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { PostStatus, SocialPost } from "../types/post";

// Local JSON store. Two collections: posts + tokens. One file on disk.
// Concurrency-safe within a single Node process via an in-memory promise queue.
// NOT suitable for serverless production (Vercel filesystem is ephemeral).
// When deploying, swap this file for a real DB-backed store with the same API.

export interface TokenRow {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  updated_at: string;
}

interface DB {
  posts: SocialPost[];
  tokens: Record<string, TokenRow>;
}

const DATA_DIR = path.join(process.cwd(), "apps", "social-engine", ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const EMPTY_DB: DB = { posts: [], tokens: {} };

let writeQueue: Promise<unknown> = Promise.resolve();

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readDB(): Promise<DB> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DB>;
    return {
      posts: parsed.posts ?? [],
      tokens: parsed.tokens ?? {},
    };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return { ...EMPTY_DB };
    throw e;
  }
}

async function writeDB(db: DB): Promise<void> {
  await ensureDir();
  const tmp = DB_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

// Serialize all read+modify+write sequences so concurrent requests don't clobber.
async function txn<T>(fn: (db: DB) => Promise<T> | T): Promise<T> {
  const next = writeQueue.then(async () => {
    const db = await readDB();
    const result = await fn(db);
    await writeDB(db);
    return result;
  });
  writeQueue = next.catch(() => undefined);
  return next;
}

async function read<T>(fn: (db: DB) => T): Promise<T> {
  return fn(await readDB());
}

// ---------- Posts ----------

export async function listPosts(limit = 200): Promise<SocialPost[]> {
  return read((db) =>
    [...db.posts]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, limit)
  );
}

export async function getPost(id: string): Promise<SocialPost | null> {
  return read((db) => db.posts.find((p) => p.id === id) ?? null);
}

export async function createPost(input: {
  content: string;
  scheduled_at: string;
}): Promise<SocialPost> {
  return txn((db) => {
    const post: SocialPost = {
      id: crypto.randomUUID(),
      content: input.content,
      scheduled_at: input.scheduled_at,
      status: "pending",
      posted_at: null,
      x_tweet_id: null,
      error: null,
      attempt_count: 0,
      created_at: new Date().toISOString(),
    };
    db.posts.push(post);
    return post;
  });
}

export async function updatePost(
  id: string,
  patch: Partial<SocialPost>
): Promise<SocialPost | null> {
  return txn((db) => {
    const idx = db.posts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    db.posts[idx] = { ...db.posts[idx], ...patch };
    return db.posts[idx];
  });
}

export async function cancelPendingPost(id: string): Promise<boolean> {
  return txn((db) => {
    const p = db.posts.find((x) => x.id === id);
    if (!p || p.status !== "pending") return false;
    p.status = "cancelled" as PostStatus;
    return true;
  });
}

export async function getDuePosts(
  nowIso: string,
  limit: number
): Promise<SocialPost[]> {
  return read((db) =>
    db.posts
      .filter((p) => p.status === "pending" && p.scheduled_at <= nowIso)
      .sort((a, b) => (a.scheduled_at < b.scheduled_at ? -1 : 1))
      .slice(0, limit)
  );
}

// ---------- Tokens ----------

export async function getTokens(platform: string): Promise<TokenRow | null> {
  return read((db) => db.tokens[platform] ?? null);
}

export async function saveTokens(
  platform: string,
  row: Pick<TokenRow, "access_token" | "refresh_token" | "expires_at">
): Promise<TokenRow> {
  return txn((db) => {
    const next: TokenRow = { ...row, updated_at: new Date().toISOString() };
    db.tokens[platform] = next;
    return next;
  });
}
