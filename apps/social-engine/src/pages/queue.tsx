import { Button, Empty, Popconfirm, Spin, Tag } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { PostStatus, SocialPost } from "../types/post";

dayjs.extend(relativeTime);

const STATUS_COLOR: Record<PostStatus, string> = {
  pending: "blue",
  posted: "green",
  failed: "red",
  cancelled: "default",
};

export default function QueuePage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "failed");
      setPosts(json.posts ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  async function postNow(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "failed");
      toast.success("Posted to X");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "failed");
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "failed");
      toast.success("Cancelled");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Queue</h1>
        <Button onClick={load} size="small">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spin />
        </div>
      ) : posts.length === 0 ? (
        <Empty description="No posts yet — head to Compose" />
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const isPending = p.status === "pending";
            const due = dayjs(p.scheduled_at);
            return (
              <div
                key={p.id}
                className="border border-zui-grey/30 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Tag color={STATUS_COLOR[p.status]}>{p.status}</Tag>
                    <span className="text-zui-white/50">
                      {isPending
                        ? `due ${due.fromNow()} · ${due.format("MMM D, HH:mm")}`
                        : p.posted_at
                        ? `posted ${dayjs(p.posted_at).fromNow()}`
                        : due.format("MMM D, HH:mm")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {p.x_tweet_id && (
                      <a
                        href={`https://x.com/i/web/status/${p.x_tweet_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zui-primary hover:underline"
                      >
                        view
                      </a>
                    )}
                    {isPending && (
                      <>
                        <Button
                          size="small"
                          loading={busyId === p.id}
                          onClick={() => postNow(p.id)}
                        >
                          Post now
                        </Button>
                        <Popconfirm
                          title="Cancel this post?"
                          onConfirm={() => cancel(p.id)}
                        >
                          <Button size="small" danger>
                            Cancel
                          </Button>
                        </Popconfirm>
                      </>
                    )}
                    {p.status === "failed" && (
                      <Button
                        size="small"
                        loading={busyId === p.id}
                        onClick={() => postNow(p.id)}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-sm">{p.content}</div>
                {p.error && (
                  <div className="mt-2 text-xs text-red-400">{p.error}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
