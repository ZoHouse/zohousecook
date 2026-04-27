import { Button, DatePicker, Input } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const MAX_LEN = 280;

export default function ComposePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [when, setWhen] = useState<Dayjs | null>(dayjs().add(15, "minute"));
  const [submitting, setSubmitting] = useState(false);

  const remaining = MAX_LEN - content.length;
  const overLimit = remaining < 0;

  const canSubmit = useMemo(() => {
    if (!content.trim()) return false;
    if (overLimit) return false;
    if (!when) return false;
    return true;
  }, [content, overLimit, when]);

  async function submit(postNow: boolean) {
    if (submitting) return;
    if (!content.trim() || overLimit) return;
    const scheduled = postNow ? dayjs() : when;
    if (!scheduled) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          scheduled_at: scheduled.toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "failed");
      toast.success(
        postNow ? "Queued for next tick (~1 min)" : `Scheduled for ${scheduled.format("MMM D, HH:mm")}`
      );
      router.push("/queue");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Compose</h1>
      <div className="space-y-5">
        <div>
          <label className="block text-sm text-zui-white/70 mb-2">Tweet</label>
          <Input.TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            autoSize={{ minRows: 5, maxRows: 12 }}
            maxLength={undefined}
          />
          <div
            className={`mt-2 text-xs text-right ${
              overLimit ? "text-red-400" : "text-zui-white/50"
            }`}
          >
            {remaining} / {MAX_LEN}
          </div>
        </div>

        <div>
          <label className="block text-sm text-zui-white/70 mb-2">
            Schedule (your local time)
          </label>
          <DatePicker
            showTime={{ format: "HH:mm", minuteStep: 5 }}
            format="YYYY-MM-DD HH:mm"
            value={when}
            onChange={setWhen}
            className="w-full"
            disabledDate={(d) => d.isBefore(dayjs().startOf("minute"))}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="primary"
            size="large"
            disabled={!canSubmit}
            loading={submitting}
            onClick={() => submit(false)}
          >
            Schedule
          </Button>
          <Button
            size="large"
            disabled={!content.trim() || overLimit || submitting}
            onClick={() => submit(true)}
          >
            Post now
          </Button>
        </div>
      </div>
    </div>
  );
}
